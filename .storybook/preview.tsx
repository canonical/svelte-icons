import type { Preview } from "@storybook/svelte-vite";
import { DocsContainer } from "./components/docs/DocsContainer";
import { withThemeByClassName } from "./decorators/class-name.decorator";
import "./styles.css";
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
    withThemeByClassName({
      themes: {
        light: "is-light",
        dark: "is-dark",
        system: "",
      },
    }),
  ],
};

export default preview;
