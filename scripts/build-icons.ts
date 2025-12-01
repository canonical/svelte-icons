import { readdir } from "node:fs/promises";
import path from "node:path";

(async () => {
  const [_, __, inputDir, outputDir] = process.argv;

  if (!inputDir || !outputDir) {
    console.log("Usage: bun buildIcons.ts <inputDir> <outputDir>");
    return;
  }

  const componentNames: string[] = [];
  (await readdir(inputDir))
    .filter((file) => file.endsWith(".svg"))
    .forEach(async (svgFileName) => {
      const iconName = svgFileName.replace(/\.svg$/, "");
      const componentName = toPascalCase(iconName);

      generateComponent(
        path.join(inputDir, svgFileName),
        path.join(outputDir, `${componentName}.svelte`),
        `${iconName}-build-in`,
      );

      componentNames.push(componentName);
    });

  generateIndex(outputDir, componentNames);
})();

async function generateIndex(outputDir: string, componentNames: string[]) {
  Bun.write(
    path.join(outputDir, "index.ts"),
    componentNames
      .toSorted()
      .map(
        (component) =>
          `export { default as ${component} } from "./${component}.svelte";\n`,
      ),
  );
}

async function generateComponent(
  input: string,
  output: string,
  iconName: string,
) {
  const svg = await Bun.file(input, {
    type: "image/svg+xml",
  }).text();

  const svgContent = svg.replace(/<\?xml[^?]*\?>\s*/g, "");
  const indentedSvgContent = svgContent
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");

  Bun.write(
    output,
    `<script lang="ts">
  import BaseIcon from "../BaseIcon.svelte";
  import type { IconProps } from "../types.js";

  const props: IconProps = $props();
</script>

<BaseIcon iconName="${iconName}" {...props}>
${indentedSvgContent}
</BaseIcon>
`,
  );
}

function toPascalCase(str: string) {
  return str.replace(/(^\w|-\w)/g, (match) =>
    match.replace("-", "").toUpperCase(),
  );
}
