<script lang="ts">
  import type { ThemeName } from "../../theme";
  import { VANILLA_THEME_CLASS_MAP } from "./constants";
  import type { WithThemeFromSvelteProviderProps } from "./withThemeFromSvelteProvider.decorator";

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
</script>

{@render children?.()}
