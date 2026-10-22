import { readdir } from "node:fs/promises";
import path from "node:path";

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
