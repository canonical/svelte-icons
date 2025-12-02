import { addons } from "storybook/manager-api";
import CustomTheme from "./CustomTheme";
import "./styles.css";

addons.setConfig({
  sidebar: {
    collapsedRoots: ["icons"],
  },
  theme: CustomTheme,
});
