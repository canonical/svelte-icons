import type { Preview } from "@storybook/svelte-vite";
import { getPreferredColorScheme } from "storybook/theming";
import { withThemeFromSvelteProvider } from "./components/decorators/withThemeFromSvelteProvider.decorator";
import { DocsContainer } from "./components/docs/DocsContainer";
import VanillaFrameworkThemeProvider from "./components/stories/VanillaFrameworkThemeProvider.svelte";
import "./styles.css";
import { DARK_THEME, LIGHT_THEME } from "./theme";
import "./vanillaframework.scss";

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      backgrounds: { disable: true },
    },
    docs: {
      container: DocsContainer,
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  decorators: [
    withThemeFromSvelteProvider({
      themes: {
        light: LIGHT_THEME,
        dark: DARK_THEME,
      },
      defaultTheme: getPreferredColorScheme(),
      Provider: VanillaFrameworkThemeProvider,
    }),
  ],
};

export default preview;
