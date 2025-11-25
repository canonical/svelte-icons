import { readdir } from "node:fs/promises";
import path from "node:path";

(async () => {
  const [_, __, inputDir, outputDir] = process.argv;

  if (!inputDir || !outputDir) {
    console.log("Usage: bun buildStories.ts <inputDir> <outputDir>");
    return;
  }

  const relativeInput = path.relative(outputDir, inputDir);

  (await readdir(inputDir))
    .filter((file) => file.endsWith(".svelte"))
    .forEach((svelteFile) => {
      const componentName = svelteFile.replace(/\.svelte$/, "");

      Bun.write(
        path.join(outputDir, `${componentName}.stories.svelte`),
        generateStory(componentName, relativeInput),
      );
    });
})();

function generateStory(componentName: string, relativeInput: string) {
  return `<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import ${componentName} from "${relativeInput}/${componentName}.svelte";

  const { Story } = defineMeta({
    title: "Icons/${componentName}",
    component: ${componentName},
  });
</script>

<Story name="Default" />

<Story name="Of different sizes" asChild>
  <h1><${componentName} /></h1>
  <h2><${componentName} /></h2>
  <h3><${componentName} /></h3>
  <h4><${componentName} /></h4>
  <h5><${componentName} /></h5>
  <h6><${componentName} /></h6>
</Story>

<Story name="With custom color" args={{ style: "color: red;" }} />
`;
}
