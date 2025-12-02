import { create } from "storybook/theming";

export default create({
  base: "light" as const,
  brandImage: "/cof_square.svg",
  brandTitle: "Svelte Icons",
  fontBase: "var(--font-ubuntu-sans)",
  fontCode: "var(--font-ubuntu-sans-mono)",

  colorPrimary: "#E95420",
  colorSecondary: "#4F4F4F",

  buttonBg: "#E95420",

  // UI
  appBg: "#f3f3f3",
  appContentBg: "#f3f3f3",
  appPreviewBg: "#f7f7f7",
  appBorderColor: "rgba(0, 0, 0, 0.2)",
  appBorderRadius: 0,
  inputBorderRadius: 0,
  // Text colors
  textColor: "#000",
  textInverseColor: "#FFF",

  // Toolbar default and active colors
  barTextColor: "#000",
  barSelectedColor: "#E95420",
  barHoverColor: "#000",
  barBg: "#f3f3f3",

  textMutedColor: "#000",
});
