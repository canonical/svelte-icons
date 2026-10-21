import { readdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { Resvg } from "@resvg/resvg-js";
import { z } from "zod";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "google/gemma-4-26b-a4b-it";
const DEFAULT_TIMEOUT_SECONDS = "120";
const MAX_ATTEMPTS = 3;
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
  },
  allowPositionals: true,
  strict: true,
});

if (!inputDir || !outputFile) {
  console.error(
    "Usage: bun build-metadata.ts -i <inputDir> -o <outputFile> [-c] [-m <model>] [--base-url <apiBaseUrl>] [--timeout <seconds>]",
  );
  process.exit(1);
}

const timeoutMs = Number(timeout) * 1000;
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  throw new Error("--timeout must be a positive number of seconds");
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
for (const svgFileName of svgFiles) {
  const iconName = svgFileName.replace(/\.svg$/, "");
  iconNames.add(iconName);
  metadata[iconName] ??= {};
  // Existing tags are normalized too, so config changes apply without regenerating.
  const existingTags = clean ? [] : normalizeTags(metadata[iconName].tags);
  if (existingTags.length) {
    metadata[iconName].tags = existingTags;
  } else {
    const svg = await Bun.file(path.join(inputDir, svgFileName)).text();
    metadata[iconName].tags = await generateTags({
      name: iconName,
      content: svg,
    });
  }
}

const outputMetadata = Object.fromEntries(
  Object.entries(metadata)
    .filter(([name]) => iconNames.has(name))
    .sort(),
);

await metadataFile.write(JSON.stringify(outputMetadata, null, 2));

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

// Models can't reliably infer geometry from SVG path data, so send a rendered image instead.
function renderIcon(svg: string) {
  const png = new Resvg(svg.replaceAll("currentColor", "#000000"), {
    fitTo: { mode: "width", value: RENDER_SIZE },
    background: "#ffffff",
  })
    .render()
    .asPng();
  return `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
}

async function generateTags(svg: { name: string; content: string }) {
  console.log(`Generating tags for ${svg.name}`);
  const context = `generating tags for ${svg.name} at ${baseUrl}`;
  let response: Response | undefined;
  let result: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      response = await fetch(baseUrl, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
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
                { type: "text", text: `Icon name: ${svg.name}` },
                {
                  type: "image_url",
                  image_url: { url: renderIcon(svg.content) },
                },
              ],
            },
          ],
        }),
      });
      if (response.ok) {
        result = await response.json();
      }
      break;
    } catch (cause) {
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(
          `Request failed after ${MAX_ATTEMPTS} attempts while ${context}`,
          { cause },
        );
      }
      console.warn(
        `Attempt ${attempt} failed (${cause instanceof Error ? cause.message : cause}), retrying`,
      );
    }
  }
  if (!response?.ok) {
    throw new Error(`HTTP ${response?.status} while ${context}`);
  }
  if (isRecord(result) && result.error != null) {
    throw new Error(`API returned an error while ${context}`);
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
    throw new Error(`Unexpected response content while ${context}`);
  }

  let generated: unknown;
  try {
    generated = JSON.parse(content);
  } catch (cause) {
    throw new Error(`Invalid tags JSON while ${context}`, { cause });
  }
  const parsed = TAGS_SCHEMA.safeParse(generated);
  if (!parsed.success) {
    throw new Error(`Invalid tags schema while ${context}`, {
      cause: parsed.error,
    });
  }
  const tags = normalizeTags(parsed.data.tags);
  if (tags.length === 0) {
    throw new Error(`No usable tags while ${context}`);
  }
  console.log(`Visual: ${parsed.data.visual}`);
  console.log(`Meaning: ${parsed.data.meaning}`);
  console.log(`Generated tags: ${tags}`);
  return tags;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
