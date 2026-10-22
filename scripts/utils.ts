import { readdir } from "node:fs/promises";
import path from "node:path";
import { type ParseArgsOptionsConfig, parseArgs } from "node:util";

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

/** An invalid invocation: reported with the usage line instead of a stack trace. */
export class UsageError extends Error {}

/** `parseArgs` with the scripts' shared settings; invalid input becomes a `UsageError`. */
export function parseCliArgs<O extends ParseArgsOptionsConfig>(
  argv: string[],
  options: O,
) {
  try {
    return parseArgs({
      args: argv,
      options,
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    throw new UsageError((error as Error).message, { cause: error });
  }
}

/** Runs `parse`, turning a `UsageError` into an error message, the usage line and exit code 2. */
export function withUsage<T>(usage: string, parse: () => T): T {
  try {
    return parse();
  } catch (error) {
    if (!(error instanceof UsageError)) {
      throw error;
    }
    console.error(`error: ${error.message}\n${usage}`);
    process.exit(2);
  }
}
