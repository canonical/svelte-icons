<script lang="ts">
  import { getIconsContext } from "./context.js";
  import type { BaseIconProps } from "./types.js";

  const {
    iconName,
    class: className,
    children,
    ...rest
  }: BaseIconProps = $props();

  const instanceId = Symbol(iconName);
  const iconsContext = getIconsContext();

  iconsContext?.registerIconInstance(iconName, instanceId);

  const isLeader = $derived(
    !iconsContext || iconsContext.isLeaderInstance(iconName, instanceId),
  );

  $effect.pre(() => {
    if (!iconsContext) return;

    iconsContext.registerIconInstance(iconName, instanceId);

    return () => {
      iconsContext.unregisterIconInstance(iconName, instanceId);
    };
  });

  const stampId = $derived(`${iconName}-svelte-icon`);
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 16 16"
  class={["svelte-icon", className]}
  {...rest}
>
  {#if isLeader}
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
