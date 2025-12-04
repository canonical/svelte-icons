<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import IconBase from "../lib/IconBase.svelte";

  const { Story } = defineMeta({
    title: "Advanced/IconBase",
    component: IconBase,
  });
</script>

<Story name="Default" args={{ iconName: "example" }}>
  {#snippet template({ children, ...args })}
    <IconBase {...args}>
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="8"
          cy="8"
          r="7"
          stroke="currentColor"
          stroke-width="1"
          fill="lightgray"
        />
        <line
          x1="4"
          y1="8"
          x2="12"
          y2="8"
          stroke="currentColor"
          stroke-width="1"
        />
        <line
          x1="8"
          y1="4"
          x2="8"
          y2="12"
          stroke="currentColor"
          stroke-width="1"
        />
      </svg>
    </IconBase>
  {/snippet}
</Story>
