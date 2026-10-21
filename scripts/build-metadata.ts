import { readdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";

const {
  values: { inputDir, outputFile, clean, model, "base-url": customBaseUrl },
} = parseArgs({
  args: Bun.argv,
  options: {
    inputDir: { type: "string", short: "i" },
    outputFile: { type: "string", short: "o" },
    clean: { type: "boolean", short: "c", default: false },
    model: { type: "string", short: "m" },
    "base-url": { type: "string" },
  },
  allowPositionals: true,
  strict: true,
});

if (!inputDir || !outputFile) {
  console.error(
    "Usage: bun build-metadata.ts -i <inputDir> -o <outputFile> [-c] [-m <model>] [--base-url <apiBaseUrl>]",
  );
  process.exit(1);
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
  baseUrl = new URL("https://openrouter.ai/api/v1");
  selectedModel = model ?? "google/gemma-3-4b-it";
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

const tagsSchema = z.strictObject({
  tags: z.array(z.string().trim().min(1)).min(1),
});
const tagsJsonSchema = tagsSchema.toJSONSchema();

const prompt = `
Generate concise search keywords for the provided SVG icon.
Use its name and SVG content to identify its appearance, meaning, and likely uses.
Return the keywords in the tags field.
`;
async function generateTags(svg: { name: string; content: string }) {
  console.log(`Generating tags for ${svg.name}`);
  const context = `generating tags for ${svg.name} at ${baseUrl}`;
  let response: Response;
  try {
    response = await fetch(baseUrl, {
      method: "POST",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: selectedModel,
        stream: false,
        ...providerOptions,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "icon_tags",
            strict: true,
            schema: tagsJsonSchema,
          },
        },
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: `<name>${svg.name}</name><content>${svg.content}</content>`,
          },
        ],
      }),
    });
  } catch (cause) {
    throw new Error(`Request failed while ${context}`, { cause });
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while ${context}`);
  }
  let result: unknown;
  try {
    result = await response.json();
  } catch (cause) {
    throw new Error(`Invalid JSON response while ${context}`, { cause });
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
  const parsed = tagsSchema.safeParse(generated);
  if (!parsed.success) {
    throw new Error(`Invalid tags schema while ${context}`, {
      cause: parsed.error,
    });
  }
  const { tags } = parsed.data;
  console.log(`Generated tags: ${tags}`);
  return tags;
}

const metadataFile = Bun.file(outputFile);
const metadata = (await metadataFile.exists()) ? await metadataFile.json() : {};

const iconNames = new Set<string>();
for (const svgFileName of svgFiles) {
  const iconName = svgFileName.replace(/\.svg$/, "");
  iconNames.add(iconName);
  const shouldGenerateTags = clean || !metadata[iconName]?.tags?.length;
  metadata[iconName] ??= {};
  if (shouldGenerateTags) {
    const svg = await Bun.file(path.join(inputDir, svgFileName)).text();
    const tags = await generateTags({ name: iconName, content: svg });
    metadata[iconName].tags = tags;
  }
}

const outputMetadata = Object.fromEntries(
  Object.entries(metadata)
    .filter(([name]) => iconNames.has(name))
    .sort(),
);

await metadataFile.write(JSON.stringify(outputMetadata, null, 2));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
