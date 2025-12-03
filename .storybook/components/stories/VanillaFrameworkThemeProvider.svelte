<script lang="ts">
  import { setContext } from "svelte";
  import type { WithThemeFromSvelteProviderProps } from "../../decorators/withThemeFromSvelteProvider.decorator";
  import type { ThemeName } from "../../theme";
  import { VANILLA_THEME_CLASS_MAP } from "./constants";

  let { theme, children }: WithThemeFromSvelteProviderProps = $props();
  const vanillaClassName = $derived(
    VANILLA_THEME_CLASS_MAP[theme as ThemeName],
  );

  $effect(() => {
    document.documentElement.classList.add(vanillaClassName);
    return () => {
      document.documentElement.classList.remove(vanillaClassName);
    };
  });

  $effect(() => {
    setContext("vanilla-framework-theme", { theme, vanillaClassName });
  });
</script>

{@render children?.()}
