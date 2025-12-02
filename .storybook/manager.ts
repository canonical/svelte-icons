import { addons } from "storybook/manager-api";
import CustomTheme from "./CustomTheme";
// @ts-expect-error
import "./styles.css";

addons.setConfig({
  sidebar: {
    collapsedRoots: ["icons"],
  },
  theme: CustomTheme,
});
