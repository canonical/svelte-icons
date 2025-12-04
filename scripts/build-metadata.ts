import { readdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { GoogleGenAI } from "@google/genai";

const {
  values: { inputDir, outputFile, clean },
} = parseArgs({
  args: Bun.argv,
  options: {
    inputDir: { type: "string", short: "i" },
    outputFile: { type: "string", short: "o" },
    clean: { type: "boolean", short: "c", default: false },
  },
  allowPositionals: true,
  strict: true,
});

if (!inputDir || !outputFile) {
  console.error(
    "Usage: bun build-metadata.ts -i <inputDir> -o <outputFile> [-c]",
  );
  process.exit(1);
}

const svgFiles = (await readdir(inputDir)).filter((file) =>
  file.endsWith(".svg"),
);

const ai = new GoogleGenAI({});
const prompt = `
You are a helpful assistant that generates metadata for SVG icons.
You are given an SVG icon and you need to generate a list of keywords that describe the icon.
The keywords should be a list of words that describe the icon.
The keywords should be separated by commas.
The keywords should be in the following format: "keyword1, keyword2, keyword3"
`;
async function generateTags(svg: { name: string; content: string }) {
  console.log(`Generating tags for ${svg.name}`);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: prompt,
    },
    contents: `<name>${svg.name}</name><content>${svg.content}</content>`,
  });

  const tags =
    response?.text?.split(",").map((keyword) => keyword.trim()) ?? [];
  console.log(`Generated tags: ${tags}`);
  return tags;
}

const metadataFile = Bun.file(outputFile);
const metadata = (await metadataFile.exists()) ? await metadataFile.json() : {};

for (const svgFileName of svgFiles) {
  const iconName = svgFileName.replace(/\.svg$/, "");
  metadata[iconName] = { ...(metadata[iconName] || {}), file: svgFileName };
  const shouldGenerateTags = clean || !metadata[svgFileName];
  if (shouldGenerateTags) {
    const svg = await Bun.file(path.join(inputDir, svgFileName)).text();
    const tags = await generateTags({ name: iconName, content: svg });
    metadata[iconName].tags = tags;
  }
}

await metadataFile.write(JSON.stringify(metadata, null, 2));
