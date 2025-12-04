<script lang="ts">
  import type { ThemeName } from "../../theme";
  import type { WithThemeFromSvelteProviderProps } from "../decorators/withThemeFromSvelteProvider.decorator";
  import { CLASS_MAP } from "./constants";

  let { theme, children }: WithThemeFromSvelteProviderProps = $props();
  const vanillaClassName = $derived(CLASS_MAP[theme as ThemeName]);

  $effect(() => {
    document.documentElement.classList.add(vanillaClassName);
    return () => {
      document.documentElement.classList.remove(vanillaClassName);
    };
  });
</script>

{@render children?.()}
