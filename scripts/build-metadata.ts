import { readdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { Resvg } from "@resvg/resvg-js";
import { z } from "zod";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "google/gemma-4-26b-a4b-it";
const DEFAULT_TIMEOUT_SECONDS = "120";
const DEFAULT_CONCURRENCY = "6";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const TEMPERATURE = 0.2;
const RENDER_SIZE = 256;

const PROMPT = `
You write search tags for an icon library. The icons come from Canonical's design system and are used in web apps for cloud, infrastructure and developer tools (Ubuntu, Juju, MAAS, LXD, Kubernetes), as well as in general UI.
A user looking for an icon types a single word or short phrase. Tags must match what such a user would type, either because of what the icon shows or what it means.

You are given the icon's name and an image of the icon (black on white).
1. In "visual", describe in one short sentence only the shapes drawn in the image, e.g. "an outlined isometric cube" or "a rounded rectangle with a bar across the top". Do not use the name here.
2. In "meaning", state in one short sentence what the icon represents in a software UI. Names often have several senses; choose the one the drawing supports. Use the name to decide only when the drawing itself is ambiguous.
3. In "tags", list 6 to 12 lowercase search terms, most relevant first:
   - the name's concept and its closest synonyms,
   - the objects the drawing depicts, as interpreted in "meaning",
   - the actions or states the icon is commonly used for.
Rules:
- Each tag must fit the meaning. Never add tags for things the shapes merely resemble when that contradicts the meaning.
- Never add objects that are not drawn and not implied by the name.
- Prefer common, concrete words over abstract or formal ones (e.g. "clean" rather than "sanitize").
- Include a product or technology name only when the icon name is a term from it (e.g. a Kubernetes or Juju concept).
- Do not use filler words such as "icon", "symbol", "graphic", "design", "shape", "ui element".
`;

const FILLER_TAGS = new Set([
  "icon",
  "symbol",
  "graphic",
  "design",
  "shape",
  "ui element",
]);

// Field order matters: the model describes the drawing and its meaning before choosing tags.
const TAGS_SCHEMA = z.strictObject({
  visual: z.string(),
  meaning: z.string(),
  tags: z.array(z.string().trim().min(1)).min(1),
});
const TAGS_JSON_SCHEMA = TAGS_SCHEMA.toJSONSchema();

const {
  values: {
    inputDir,
    outputFile,
    clean,
    model,
    "base-url": customBaseUrl,
    timeout,
    concurrency: concurrencyArg,
    verbose,
  },
} = parseArgs({
  args: Bun.argv,
  options: {
    inputDir: { type: "string", short: "i" },
    outputFile: { type: "string", short: "o" },
    clean: { type: "boolean", short: "c", default: false },
    model: { type: "string", short: "m" },
    "base-url": { type: "string" },
    timeout: { type: "string", default: DEFAULT_TIMEOUT_SECONDS },
    concurrency: { type: "string", short: "j", default: DEFAULT_CONCURRENCY },
    verbose: { type: "boolean", short: "v", default: false },
  },
  allowPositionals: true,
  strict: true,
});

if (!inputDir || !outputFile) {
  console.error(
    "Usage: bun build-metadata.ts -i <inputDir> -o <outputFile> [-c] [-m <model>] [--base-url <apiBaseUrl>] [--timeout <seconds>] [-j <concurrency>] [-v]",
  );
  process.exit(1);
}

const timeoutMs = Number(timeout) * 1000;
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  throw new Error("--timeout must be a positive number of seconds");
}

const concurrency = Number(concurrencyArg);
if (!Number.isInteger(concurrency) || concurrency < 1) {
  throw new Error("--concurrency must be a positive integer");
}

let baseUrl: URL;
let selectedModel: string | undefined;
let apiKey: string | undefined;
let providerOptions = {};

if (customBaseUrl !== undefined) {
  try {
    baseUrl = new URL(customBaseUrl);
  } catch {
    throw new Error("--base-url must be a valid HTTP(S) API base URL");
  }
  if (
    !["http:", "https:"].includes(baseUrl.protocol) ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new Error(
      "--base-url must be an HTTP(S) API base URL without credentials, a query, or a fragment",
    );
  }
  selectedModel = model;
  apiKey = process.env.METADATA_API_KEY?.trim();
} else {
  baseUrl = new URL(OPENROUTER_BASE_URL);
  selectedModel = model ?? DEFAULT_MODEL;
  apiKey = process.env.OPENROUTER_API_KEY?.trim();
  providerOptions = { provider: { require_parameters: true } };
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
}

if (!selectedModel?.trim()) {
  throw new Error(
    "A non-empty --model is required when using --base-url or overriding the default model",
  );
}

baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, "")}/chat/completions`;

const svgFiles = (await readdir(inputDir)).filter((file) =>
  file.endsWith(".svg"),
);

const metadataFile = Bun.file(outputFile);
const metadata = (await metadataFile.exists()) ? await metadataFile.json() : {};

const iconNames = new Set<string>();
const pendingIcons: string[] = [];
for (const svgFileName of svgFiles) {
  const iconName = svgFileName.replace(/\.svg$/, "");
  iconNames.add(iconName);
  metadata[iconName] ??= {};
  // Existing tags are normalized too, so config changes apply without regenerating.
  const existingTags = clean ? [] : normalizeTags(metadata[iconName].tags);
  if (existingTags.length) {
    metadata[iconName].tags = existingTags;
  } else {
    pendingIcons.push(iconName);
  }
}

console.log(
  `Generating tags for ${pendingIcons.length} of ${iconNames.size} icons with ${selectedModel} at ${baseUrl.origin} (concurrency: ${concurrency})`,
);

const reporter = createReporter(pendingIcons);
const failedIcons: string[] = [];
await runWithConcurrency(pendingIcons, concurrency, async (iconName) => {
  const startedAt = performance.now();
  try {
    const svg = await Bun.file(path.join(inputDir, `${iconName}.svg`)).text();
    const result = await generateTags(iconName, svg, (message) =>
      reporter.warn(iconName, message),
    );
    metadata[iconName].tags = result.tags;
    reporter.succeed(iconName, result, performance.now() - startedAt);
  } catch (error) {
    failedIcons.push(iconName);
    reporter.fail(iconName, error);
  }
});
reporter.finish(iconNames.size - pendingIcons.length, failedIcons);

const outputMetadata = Object.fromEntries(
  Object.entries(metadata)
    .filter(([name]) => iconNames.has(name))
    .sort(),
);

await metadataFile.write(JSON.stringify(outputMetadata, null, 2));

if (failedIcons.length) {
  process.exitCode = 1;
}

function normalizeTags(tags: unknown) {
  if (!Array.isArray(tags)) {
    return [];
  }
  const normalized = tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, " "))
    .filter((tag) => tag && !FILLER_TAGS.has(tag));
  return [...new Set(normalized)];
}

function renderIcon(svg: string) {
  const png = new Resvg(svg.replaceAll("currentColor", "#000000"), {
    fitTo: { mode: "width", value: RENDER_SIZE },
    background: "#ffffff",
  })
    .render()
    .asPng();
  return `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
}

async function generateTags(
  name: string,
  svg: string,
  onRetry: (message: string) => void,
) {
  const result = await requestCompletion(
    {
      model: selectedModel,
      stream: false,
      temperature: TEMPERATURE,
      ...providerOptions,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "icon_tags",
          strict: true,
          schema: TAGS_JSON_SCHEMA,
        },
      },
      messages: [
        { role: "system", content: PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Icon name: ${name}` },
            { type: "image_url", image_url: { url: renderIcon(svg) } },
          ],
        },
      ],
    },
    onRetry,
  );
  if (isRecord(result) && result.error != null) {
    throw new Error(`API returned an error: ${getErrorMessage(result)}`);
  }
  const choice =
    isRecord(result) && Array.isArray(result.choices)
      ? result.choices[0]
      : undefined;
  const content =
    isRecord(choice) && isRecord(choice.message)
      ? choice.message.content
      : undefined;
  if (typeof content !== "string") {
    throw new Error("Unexpected response content");
  }

  let generated: unknown;
  try {
    generated = JSON.parse(content);
  } catch (cause) {
    throw new Error("Invalid tags JSON", { cause });
  }
  const parsed = TAGS_SCHEMA.safeParse(generated);
  if (!parsed.success) {
    throw new Error("Invalid tags schema", {
      cause: parsed.error,
    });
  }
  const tags = normalizeTags(parsed.data.tags);
  if (tags.length === 0) {
    throw new Error("No usable tags");
  }
  return { ...parsed.data, tags };
}

async function requestCompletion(
  body: Record<string, unknown>,
  onRetry: (message: string) => void,
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let retryable = true;
    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        return (await response.json()) as unknown;
      }
      const details = getErrorMessage(await response.json().catch(() => null));
      lastError = new Error(
        `HTTP ${response.status}${details ? `: ${details}` : ""}`,
      );
      retryable = RETRYABLE_STATUSES.has(response.status);
    } catch (error) {
      lastError = error;
    }
    if (!retryable || attempt === MAX_ATTEMPTS) {
      break;
    }
    onRetry(
      `attempt ${attempt}/${MAX_ATTEMPTS} failed (${formatError(lastError)}), retrying`,
    );
    await Bun.sleep(RETRY_DELAY_MS * attempt);
  }
  throw new Error("Request failed", { cause: lastError });
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const runners = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
        await worker(item);
      }
    },
  );
  await Promise.all(runners);
}

function createReporter(iconNames: string[]) {
  const colors = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
  const total = iconNames.length;
  const counterWidth = String(total).length;
  const nameWidth = Math.max(0, ...iconNames.map((name) => name.length));
  const indent = " ".repeat(counterWidth * 2 + 6);
  const startedAt = performance.now();
  let completed = 0;

  const style = (code: number, text: string) =>
    colors ? `\x1b[${code}m${text}\x1b[0m` : text;
  const counter = () =>
    `[${String(completed).padStart(counterWidth)}/${total}]`;

  return {
    succeed(
      name: string,
      result: { visual: string; meaning: string; tags: string[] },
      durationMs: number,
    ) {
      completed++;
      console.log(
        `${style(32, "✓")} ${counter()} ${name.padEnd(nameWidth)}  ${result.tags.join(", ")} ${style(2, `(${formatDuration(durationMs)})`)}`,
      );
      if (verbose) {
        console.log(style(2, `${indent}visual:  ${result.visual}`));
        console.log(style(2, `${indent}meaning: ${result.meaning}`));
      }
    },
    fail(name: string, error: unknown) {
      completed++;
      console.log(
        `${style(31, "✗")} ${counter()} ${name.padEnd(nameWidth)}  ${style(31, formatError(error))}`,
      );
    },
    warn(name: string, message: string) {
      console.log(`${style(33, "!")} ${indent.slice(2)}${name}: ${message}`);
    },
    finish(reused: number, failed: string[]) {
      const summary = `${total - failed.length} generated, ${reused} reused, ${failed.length} failed in ${formatDuration(performance.now() - startedAt)}`;
      console.log(style(failed.length ? 31 : 32, summary));
      if (failed.length) {
        console.log(`Failed icons: ${failed.join(", ")}`);
      }
    },
  };
}

function formatDuration(ms: number) {
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  return `${Math.floor(seconds / 60)}m${String(Math.floor(seconds % 60)).padStart(2, "0")}s`;
}

function formatError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return z.prettifyError(error).replace(/\s*\n\s*/g, " ");
  }
  if (!(error instanceof Error)) {
    return String(error);
  }
  return error.cause === undefined
    ? error.message
    : `${error.message}: ${formatError(error.cause)}`;
}

function getErrorMessage(value: unknown) {
  if (isRecord(value) && isRecord(value.error)) {
    return typeof value.error.message === "string" ? value.error.message : "";
  }
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
