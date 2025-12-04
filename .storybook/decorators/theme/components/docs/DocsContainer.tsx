import type { DocsContainerProps } from "@storybook/addon-docs/blocks";
import { DocsContainer as BaseContainer } from "@storybook/addon-docs/blocks";
import { type PropsWithChildren, useEffect, useState } from "react";
import { DARK_THEME, LIGHT_THEME, type ThemeName } from "../../../../theme";
import { VANILLA_THEME_CLASS_MAP } from "../../constants";

export const DocsContainer = ({
  context,
  children,
  ...props
}: PropsWithChildren<DocsContainerProps>) => {
  const isMDXStory = context?.componentStories().length === 0;
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
      context={context}
      theme={theme === "dark" ? DARK_THEME : LIGHT_THEME}
    >
      <div className={isMDXStory ? VANILLA_THEME_CLASS_MAP[theme] : undefined}>
        {children}
      </div>
    </BaseContainer>
  );
};
