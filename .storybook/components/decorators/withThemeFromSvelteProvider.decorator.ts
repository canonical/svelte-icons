import { DecoratorHelpers } from "@storybook/addon-themes";
import type { Decorator } from "@storybook/svelte-vite";
import type { ThemeVars } from "storybook/theming";
import type { Component, Snippet } from "svelte";

const { pluckThemeFromContext, initializeThemeState } = DecoratorHelpers;

type ThemeMap = Record<string, ThemeVars>;

export type WithThemeFromSvelteProviderProps = {
  theme: keyof ThemeMap;
  children: Snippet;
};

export const withThemeFromSvelteProvider = ({
  themes,
  defaultTheme,
  Provider,
}: {
  themes: ThemeMap;
  defaultTheme: keyof ThemeMap;
  Provider: Component<WithThemeFromSvelteProviderProps>;
}): Decorator => {
  initializeThemeState(Object.keys(themes), defaultTheme);

  return (_storyFn, context) => ({
    Component: Provider,
    props: {
      theme: pluckThemeFromContext(context) || defaultTheme,
    },
  });
};
