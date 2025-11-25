<script lang="ts">
  import { onMount } from "svelte";
  import { getIconsContext } from "./context.js";
  import type { BaseIconProps } from "./types.js";

  const {
    iconName,
    class: className,
    children,
    ...rest
  }: BaseIconProps = $props();

  const stampId = $derived(`${iconName}-svelte-icon`);

  const iconsContext = getIconsContext();
  // svelte-ignore state_referenced_locally
  if (iconsContext) {
    // In case of name conflicts, later registrations override earlier ones
    iconsContext.registry.register(stampId, children);
  }

  $effect(() => {
    if (!iconsContext) return;

    // If name or children change, re-register
    // In case of name conflicts, and different definitions, the last one to update overrides earlier ones
    iconsContext.registry.register(stampId, children);
    iconsContext.registry.notifyMounted(stampId);

    return () => iconsContext.registry.notifyUnmounted(stampId);
  });
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 16 16"
  class={["svelte-icon", className]}
  {...rest}
>
  {#if !iconsContext}
    <defs>
      <symbol id={stampId}>
        {@render children()}
      </symbol>
    </defs>
  {/if}
  <use href={`#${stampId}`}></use>
</svg>

<style>
  svg {
    display: inline-grid;
    place-content: center;
    width: 1em;
    height: 1em;
  }
</style>
