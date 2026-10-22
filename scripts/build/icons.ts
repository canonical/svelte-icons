#!/usr/bin/env bun
import path from "node:path";
import { Eta } from "eta";
import { readIconSvgs } from "../utils.ts";
import { parseIconsArgs } from "./args.ts";
import { TEMPLATES_DIR } from "./constants.ts";
import { indent, kebabToPascalCase } from "./utils.ts";

const { inputDir, outputDir } = parseIconsArgs(Bun.argv);

const eta = new Eta({ views: TEMPLATES_DIR });
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
