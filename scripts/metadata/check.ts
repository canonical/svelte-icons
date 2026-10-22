#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { readIconSvgs } from "../utils.ts";
import { hashSvg, parseMetadata } from "./utils.ts";

const {
  values: { inputDir, metadataFile },
} = parseArgs({
  args: Bun.argv,
  options: {
    inputDir: { type: "string", short: "i" },
    metadataFile: { type: "string", short: "m" },
  },
  allowPositionals: true,
  strict: true,
});

if (!inputDir || !metadataFile) {
  console.error(
    "Usage: bun run check:metadata -i <inputDir> -m <metadataFile>",
  );
  process.exit(1);
}

const icons = await readIconSvgs(inputDir);
const metadata = parseMetadata(await Bun.file(metadataFile).text());

const problems: string[] = [];
for (const [name, svg] of icons) {
  const entry = metadata[name];
  if (!entry) {
    problems.push(`${name}: new icon`);
  } else if (!entry.tags?.length) {
    problems.push(`${name}: missing tags`);
  } else if (entry.hash === undefined) {
    problems.push(`${name}: missing hash`);
  } else if (entry.hash !== hashSvg(svg)) {
    problems.push(`${name}: SVG changed since tags were generated`);
  }
}
for (const name of Object.keys(metadata)) {
  if (!icons.has(name)) {
    problems.push(`${name}: icon no longer exists`);
  }
}

if (problems.length) {
  console.error(`${metadataFile} is out of sync with ${inputDir}:`);
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  console.error("Run `bun run build:metadata` to update it.");
  process.exit(1);
}

console.log(`${metadataFile} is in sync with ${icons.size} icons.`);
