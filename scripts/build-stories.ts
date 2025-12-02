import { readdir } from "node:fs/promises";
import path from "node:path";
import { Eta } from "eta";

const [, , inputDir, outputDir] = process.argv;

if (!inputDir || !outputDir) {
  console.error("Usage: bun build-stories.ts <inputDir> <outputDir>");
  process.exit(1);
}

const eta = new Eta({ views: path.join(__dirname, "templates") });
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
