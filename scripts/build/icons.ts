#!/usr/bin/env bun
import path from "node:path";
import { Eta } from "eta";
import { readIconSvgs } from "../utils.ts";
import { parseIconsArgs } from "./args.ts";
import { TEMPLATES_DIR } from "./constants.ts";

const { inputDir, outputDir } = parseIconsArgs(Bun.argv);

const eta = new Eta({ views: TEMPLATES_DIR });
const icons = await readIconSvgs(inputDir);

const components = await Promise.all(
  [...icons].map(async ([iconName, svgRaw]) => {
    const component = `${kebabToPascalCase(iconName)}Icon`;
    const outputPath = path.join(outputDir, `${component}.svelte`);

    const svgInner = svgRaw.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1];
    if (svgInner === undefined) {
      throw new Error(`Could not find <svg> root element in ${iconName}`);
    }
    const svgContent = svgInner.replace(/^\s*\n|\s+$/g, "");

    const componentContent = eta.render("./Icon", {
      iconName,
      svgContent,
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

function kebabToPascalCase(str: string): string {
  return str.replace(/(^\w|-\w)/g, (match) =>
    match.replace("-", "").toUpperCase(),
  );
}
