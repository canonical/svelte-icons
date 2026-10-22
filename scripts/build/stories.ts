#!/usr/bin/env bun
import { readdir } from "node:fs/promises";
import path from "node:path";
import { Eta } from "eta";
import { parseStoriesArgs } from "./args.ts";
import { TEMPLATES_DIR } from "./constants.ts";

const { inputDir, outputDir } = parseStoriesArgs(Bun.argv);

const eta = new Eta({ views: TEMPLATES_DIR });
const relativeInput = path.relative(outputDir, inputDir);
const svelteFiles = (await readdir(inputDir)).filter((file) =>
  file.endsWith(".svelte"),
);

await Promise.all(
  svelteFiles.map((svelteFile) => {
    const component = svelteFile.replace(/\.svelte$/, "");
    const outputPath = path.join(outputDir, `${component}.stories.svelte`);
    const content = eta.render("Story", { component, relativeInput });

    return Bun.write(outputPath, content);
  }),
);
