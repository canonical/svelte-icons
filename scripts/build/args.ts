import { parseCliArgs, UsageError, withUsage } from "../utils.ts";

export function parseIconsArgs(argv: string[]) {
  return withUsage(
    "Usage: bun run scripts/build/icons.ts -i <inputDir> -o <outputDir>",
    () => {
      const { values } = parseCliArgs(argv, {
        inputDir: { type: "string", short: "i" },
        outputDir: { type: "string", short: "o" },
      });

      if (!values.inputDir || !values.outputDir) {
        throw new UsageError("-i <inputDir> and -o <outputDir> are required");
      }

      return { inputDir: values.inputDir, outputDir: values.outputDir };
    },
  );
}

export function parseStoriesArgs(argv: string[]) {
  return withUsage(
    "Usage: bun run scripts/build/stories.ts -i <inputDir> -o <outputDir>",
    () => {
      const { values } = parseCliArgs(argv, {
        inputDir: { type: "string", short: "i" },
        outputDir: { type: "string", short: "o" },
      });

      if (!values.inputDir || !values.outputDir) {
        throw new UsageError("-i <inputDir> and -o <outputDir> are required");
      }

      return { inputDir: values.inputDir, outputDir: values.outputDir };
    },
  );
}
