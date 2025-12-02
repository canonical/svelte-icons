<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import IconBase from "../lib/IconBase.svelte";
  import IconsOptimizationProvider from "../lib/IconsOptimizationProvider.svelte";

  const { Story } = defineMeta({
    title: "IconsOptimizationProvider",
    component: IconsOptimizationProvider,
  });
</script>

<script lang="ts">
  const numIcons = 20;
  let withOptimizationContainer = $state<HTMLElement>();
  let withoutOptimizationContainer = $state<HTMLElement>();

  // Reactivity playground
  const icons = $state(
    Array.from({ length: 10 }, (_, i) =>
      Array.from({ length: 4 }, () => ({
        content: String.fromCharCode(97 + i),
        name: i.toString(),
        mounted: true,
      })),
    ).flatMap((x) => x),
  );
</script>

{#snippet exampleSVG()}
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <circle
      cx="8"
      cy="8"
      r="7"
      stroke="currentColor"
      stroke-width="1"
      fill="lightgray"
    />
    <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="1" />
    <line x1="8" y1="4" x2="8" y2="12" stroke="currentColor" stroke-width="1" />
  </svg>
{/snippet}

<Story name="Default">
  {#snippet template({ children, ...args })}
    <IconsOptimizationProvider {...args}>
      <IconBase iconName="example">
        {@render exampleSVG()}
      </IconBase>
      <IconBase iconName="example">
        {@render exampleSVG()}
      </IconBase>
    </IconsOptimizationProvider>
  {/snippet}
</Story>

<Story name="Node tree size comparison">
  {#snippet template({ children, ...args })}
    <div
      bind:this={withOptimizationContainer}
      style="border: 1px dashed gray; padding: 0.5rem;"
    >
      <IconsOptimizationProvider {...args}>
        {#each { length: numIcons }, i (i)}
          <IconBase iconName="example">
            {@render exampleSVG()}
          </IconBase>
        {/each}
      </IconsOptimizationProvider>
      <div>
        Nodes subtree size with optimization: {withOptimizationContainer?.querySelectorAll(
          "*",
        ).length}
      </div>
    </div>
    <div
      bind:this={withoutOptimizationContainer}
      style="margin-top: 1em; border: 1px dashed gray; padding: 0.5rem;"
    >
      {#each { length: numIcons }, i (i)}
        <IconBase iconName="example">
          {@render exampleSVG()}
        </IconBase>
      {/each}
      <div>
        Nodes subtree size without optimization: {withoutOptimizationContainer?.querySelectorAll(
          "*",
        ).length}
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Reactivity playground" tags={["!autodocs"]}>
  {#snippet template()}
    <div style="font-size: small;">
      <p>
        This playground allows you to test the behaviors of the <code
          >IconsOptimizationProvider</code
        >.
      </p>
      <ul>
        <li>
          You can change the name and content (text rendered inside <code
            >svg</code
          >) of each icon using the inputs.
        </li>
        <li>
          Icons are rendered inside the buttons that you can use to mount and
          unmount them.
        </li>
        <li>
          Icons in <span style="outline: 1px solid red;">red outlines</span>
          indicate that they are the ones that currently define the SVG structure
          for all the icons with the matching name.
        </li>
      </ul>
    </div>
    <IconsOptimizationProvider>
      <div
        style="display: grid; grid-template-columns: repeat(4, 1fr 1fr auto); gap: 0.5rem;"
      >
        {#each icons as icon (icon)}
          <div
            style="display: grid; grid-template-columns: subgrid; grid-column: span 3;"
            class="icon-controls-wrapper"
          >
            <div
              style="display: grid; grid-template-columns: subgrid; grid-column: span 2; font-size: x-small;"
            >
              <label>
                <div>Icon name:</div>
                <input
                  style="font-size: x-small; width: 100%;"
                  type="text"
                  size="1"
                  bind:value={icon.name}
                  placeholder="Change name"
                />
              </label>
              <label>
                <div>Icon content:</div>
                <input
                  style="font-size: x-small; width: 100%;"
                  type="text"
                  size="1"
                  bind:value={icon.content}
                  placeholder="Change content"
                />
              </label>
            </div>
            <button
              onclick={() => (icon.mounted = !icon.mounted)}
              title="Mount / Unmount Icon"
              style="display: grid; place-content: center;"
            >
              {#if icon.mounted}
                <IconBase iconName={icon.name}>
                  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <text
                      x="8"
                      y="8"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      font-size="10"
                      fill="currentColor">{icon.content}</text
                    >
                  </svg>
                </IconBase>
              {/if}
            </button>
          </div>
        {/each}
      </div>
      <style>
        .icon-controls-wrapper:has(svg.svelte-icon > defs) {
          outline: 1px solid red;
        }
      </style>
    </IconsOptimizationProvider>
  {/snippet}
</Story>
