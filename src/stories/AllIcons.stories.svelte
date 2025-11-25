<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import * as icons from "../lib/icons/index.js";

  const { Story } = defineMeta({
    tags: ["!autodocs"],
    title: "All Icons",
  });
</script>

<Story name="All Icons" asChild>
  <div
    style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1em;"
  >
    {#each Object.entries(icons) as [iconName, IconComponent]}
      <div style="display: flex; gap: 0.5em; align-items: center;">
        <IconComponent />
        <span>{iconName}</span>
      </div>
    {/each}
  </div>
</Story>
