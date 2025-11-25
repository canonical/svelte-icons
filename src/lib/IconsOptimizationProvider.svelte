<script lang="ts">
  import { type Snippet } from "svelte";
  import { setIconsContext } from "./context.js";
  import { IconDefinitionsRegistry } from "./IconDefinitionsRegistry.svelte.js";

  const { children }: { children: Snippet<[]> } = $props();

  const registry = new IconDefinitionsRegistry();

  setIconsContext({ registry });
</script>

{@render children()}

<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <defs>
    <!--
    We rely on the fact that registry definitions in SSR are accessed AFTER all the icons in `children` have been initialized.
    TODO: Will this work in async Svelte?
    -->
    {#each registry.definitions as [stampId, entry]}
      <symbol id={stampId}>
        {@render entry.definition()}
      </symbol>
    {/each}
  </defs>
</svg>
