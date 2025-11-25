<script lang="ts">
  import type { BaseIconProps } from "./types.js";

  const {
    iconName,
    class: className,
    children,
    ...rest
  }: BaseIconProps = $props();

  const stampId = $derived(`${iconName}-icon`);
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 16 16"
  class={["svelte-icon", className]}
  {...rest}
>
  <defs>
    <symbol id={stampId}>
      {@render children()}
    </symbol>
  </defs>
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
