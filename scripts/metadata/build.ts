#!/usr/bin/env bun
import { Resvg } from "@resvg/resvg-js";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { readIconSvgs } from "../utils.ts";
import { parseBuildArgs } from "./args.ts";
import {
  FILLER_TAGS,
  MAX_RETRIES,
  PROMPT,
  RENDER_SIZE,
  TAGS_SCHEMA,
  TEMPERATURE,
} from "./constants.ts";
import { hashSvg, parseMetadata } from "./utils.ts";

const {
  inputDir,
  outputFile,
  clean,
  verbose,
  concurrency,
  timeoutMs,
  endpoint: { baseUrl, model, apiKey, providerOptions },
} = parseBuildArgs(Bun.argv);

const client = new OpenAI({
  baseURL: baseUrl.href,
  // The SDK requires a key; for keyless endpoints, pass a placeholder and drop the header.
  apiKey: apiKey || "unused",
  defaultHeaders: apiKey ? undefined : { Authorization: null },
  // Don't pick up OPENAI_ORG_ID / OPENAI_PROJECT_ID and send them to other providers.
  organization: null,
  project: null,
  timeout: timeoutMs,
  maxRetries: MAX_RETRIES,
  fetchOptions: { redirect: "error" },
});

const icons = await readIconSvgs(inputDir);

const metadataFile = Bun.file(outputFile);
const metadata = (await metadataFile.exists())
  ? parseMetadata(await metadataFile.text())
  : {};

const pendingIcons: string[] = [];
for (const [iconName, svg] of icons) {
  const hash = hashSvg(svg);
  const entry = metadata[iconName] ?? {};
  // Existing tags are normalized too, so config changes apply without regenerating.
  const existingTags = clean ? [] : normalizeTags(entry.tags);
  if (existingTags.length && entry.hash === hash) {
    metadata[iconName] = { hash, tags: existingTags };
  } else {
    metadata[iconName] = entry;
    pendingIcons.push(iconName);
  }
}

console.log(
  `Generating tags for ${pendingIcons.length} of ${icons.size} icons with ${model} at ${baseUrl.origin} (concurrency: ${concurrency})`,
);

const reporter = createReporter(pendingIcons);
const failedIcons: string[] = [];
await runWithConcurrency(pendingIcons, concurrency, async (iconName) => {
  const startedAt = performance.now();
  try {
    const svg = icons.get(iconName) ?? "";
    const result = await generateTags(iconName, svg);
    metadata[iconName] = { hash: hashSvg(svg), tags: result.tags };
    reporter.succeed(iconName, result, performance.now() - startedAt);
  } catch (error) {
    failedIcons.push(iconName);
    reporter.fail(iconName, error);
  }
});
reporter.finish(icons.size - pendingIcons.length, failedIcons);

const outputMetadata = Object.fromEntries(
  Object.entries(metadata)
    .filter(([name]) => icons.has(name))
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

async function generateTags(name: string, svg: string) {
  const completion = await client.chat.completions.parse({
    model,
    temperature: TEMPERATURE,
    ...providerOptions,
    response_format: zodResponseFormat(TAGS_SCHEMA, "icon_tags"),
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
  });
  const message = completion.choices[0]?.message;
  if (!message?.parsed) {
    throw new Error(
      message?.refusal
        ? `Model refused: ${message.refusal}`
        : "Unexpected response content",
    );
  }
  const tags = normalizeTags(message.parsed.tags);
  if (tags.length === 0) {
    throw new Error("No usable tags");
  }
  return { ...message.parsed, tags };
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
