#!/usr/bin/env bun
import path from "node:path";
import { parseArgs } from "node:util";
import { Eta } from "eta";
import { readIconSvgs } from "../utils.ts";
import { indent, kebabToPascalCase } from "./utils.ts";

const {
  values: { inputDir, outputDir },
} = parseArgs({
  args: Bun.argv,
  options: {
    inputDir: { type: "string", short: "i" },
    outputDir: { type: "string", short: "o" },
  },
  allowPositionals: true,
  strict: true,
});

if (!inputDir || !outputDir) {
  console.error("Usage: bun run build:icons -i <inputDir> -o <outputDir>");
  process.exit(1);
}

const eta = new Eta({ views: path.join(__dirname, "templates") });
const icons = await readIconSvgs(inputDir);

const components = await Promise.all(
  [...icons].map(async ([iconName, svgRaw]) => {
    const component = `${kebabToPascalCase(iconName)}Icon`;
    const outputPath = path.join(outputDir, `${component}.svelte`);

    const svgContent = svgRaw.replace(/<\?xml[^?]*\?>\s*/g, "");

    const componentContent = eta.render("./Icon", {
      iconName,
      svgContent: indent(svgContent, 1),
    });

    await Bun.write(outputPath, componentContent);
    return component;
  }),
);

const indexPath = path.join(outputDir, "index.ts");
const indexContent = eta.render("./index", {
  components: components.toSorted(),
});

await Bun.write(indexPath, indexContent);
