import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const METADATA_SCHEMA = z.record(
  z.string(),
  z.object({
    hash: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
);

export type Metadata = z.infer<typeof METADATA_SCHEMA>;

export function parseMetadata(json: string): Metadata {
  return METADATA_SCHEMA.parse(JSON.parse(json));
}

/** Reads all SVG icons in a directory, keyed by icon name. */
export async function readIconSvgs(dir: string): Promise<Map<string, string>> {
  const svgFiles = (await readdir(dir))
    .filter((file) => file.endsWith(".svg"))
    .sort();
  const svgs = await Promise.all(
    svgFiles.map((file) => Bun.file(path.join(dir, file)).text()),
  );
  return new Map(
    svgFiles.map((file, i) => [file.replace(/\.svg$/, ""), svgs[i]]),
  );
}

export function hashSvg(svg: string): string {
  return createHash("sha256").update(svg).digest("hex").slice(0, 16);
}

export function kebabToPascalCase(str: string): string {
  return str.replace(/(^\w|-\w)/g, (match) =>
    match.replace("-", "").toUpperCase(),
  );
}

export function indent(str: string, levels: number): string {
  const indent = "  ".repeat(levels);
  return str
    .split("\n")
    .map((line) => (line ? `${indent}${line}` : line))
    .join("\n");
}
