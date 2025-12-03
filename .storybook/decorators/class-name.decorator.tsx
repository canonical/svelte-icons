// source: https://github.com/storybookjs/storybook/blob/HEAD/code/addons/themes/src/decorators/class-name.decorator.tsx
// override the default theme value to follow prefers-color-scheme
import { DecoratorHelpers } from "@storybook/addon-themes";
import type { DecoratorFunction, Renderer } from "storybook/internal/types";
import { useEffect } from "storybook/preview-api";

const { pluckThemeFromContext, initializeThemeState } = DecoratorHelpers;

const PARAM_KEY = "themes";

export interface ClassNameStrategyConfiguration {
  themes: {
    light: string;
    dark: string;
    system: string;
  };
  parentSelector?: string;
}

const DEFAULT_ELEMENT_SELECTOR = "html";

const classStringToArray = (classString: string) =>
  classString.split(" ").filter(Boolean);

export const withThemeByClassName = <TRenderer extends Renderer = Renderer>({
  themes,
  parentSelector = DEFAULT_ELEMENT_SELECTOR,
}: ClassNameStrategyConfiguration): DecoratorFunction<TRenderer> => {
  const prefersColorSchemeDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );

  const defaultTheme = prefersColorSchemeDark.matches ? "dark" : "light";
  initializeThemeState(Object.keys(themes), "system");

  return (storyFn, context) => {
    const { themeOverride } = context.parameters[PARAM_KEY] ?? {};
    const selected = pluckThemeFromContext(context);

    useEffect(() => {
      const selectedThemeName = themeOverride || selected || defaultTheme;
      const parentElement = document.querySelector(parentSelector);

      if (!parentElement) {
        return;
      }

      Object.entries(themes)
        .filter(([themeName]) => themeName !== selectedThemeName)
        .forEach(([_themeName, className]) => {
          const classes = classStringToArray(className);
          if (classes.length > 0) {
            parentElement.classList.remove(...classes);
          }
        });

      const newThemeClasses = classStringToArray(
        themes[selectedThemeName as keyof typeof themes],
      );

      if (newThemeClasses.length > 0) {
        parentElement.classList.add(...newThemeClasses);
      }
    }, [themeOverride, selected]);

    return storyFn();
  };
};
