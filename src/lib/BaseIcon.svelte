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

  const inContextId = $derived(`${iconName}-svelte-icon`);
  // Avoid id clashes for icons that are used outside of an IconsOptimizationProvider
  // TODO: Maybe in case we are outside of context we should just not use stamping at all? But how to pass props to the outer svg then...
  const outOfContextId = $props.id();
  const stampId = $derived(iconsContext ? inContextId : outOfContextId);
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
    width: 1em;
    height: 1em;
  }
</style>
