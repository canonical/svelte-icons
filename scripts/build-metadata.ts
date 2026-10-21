import { readdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

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

const prompt = `
You are a helpful assistant that generates metadata for SVG icons.
You are given an SVG icon and you need to generate a list of keywords that describe the icon.
The keywords should be a list of words that describe the icon.
The keywords should be separated by commas.
The keywords should be in the following format: "keyword1, keyword2, keyword3"
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

  const tags = content
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  if (!tags.length) {
    throw new Error(`Empty tags while ${context}`);
  }
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
