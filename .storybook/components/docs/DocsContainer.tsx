import type { DocsContainerProps } from "@storybook/addon-docs/blocks";
import { DocsContainer as BaseContainer } from "@storybook/addon-docs/blocks";
import { DARK_THEME, LIGHT_THEME } from "../../theme";

export const DocsContainer = (props: DocsContainerProps) => {
  // biome-ignore lint/suspicious/noExplicitAny: no types available for context
  const theme = (props.context as any).store.userGlobals?.globals?.theme;
  const prefersColorSchemeDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );

  const currentTheme = ["dark", "light"].includes(theme)
    ? theme
    : prefersColorSchemeDark.matches
      ? "dark"
      : "light";

  return (
    <BaseContainer
      {...props}
      context={props.context}
      theme={currentTheme === "dark" ? DARK_THEME : LIGHT_THEME}
    />
  );
};
