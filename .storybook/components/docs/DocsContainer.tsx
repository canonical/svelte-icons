import type { DocsContainerProps } from "@storybook/addon-docs/blocks";
import { DocsContainer as BaseContainer } from "@storybook/addon-docs/blocks";
import { useEffect, useState } from "react";
import { DARK_THEME, LIGHT_THEME, type ThemeName } from "../../theme";

export const DocsContainer = (props: DocsContainerProps) => {
  const prefersColorSchemeDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );
  const [theme, setTheme] = useState<ThemeName>(
    prefersColorSchemeDark.matches ? "dark" : "light",
  );

  useEffect(() => {
    prefersColorSchemeDark.addEventListener("change", () => {
      setTheme(prefersColorSchemeDark.matches ? "dark" : "light");
    });
    return () => {
      prefersColorSchemeDark.removeEventListener("change", () => {});
    };
  }, []);

  return (
    <BaseContainer
      {...props}
      context={props.context}
      theme={theme === "dark" ? DARK_THEME : LIGHT_THEME}
    />
  );
};
