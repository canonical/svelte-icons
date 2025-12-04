import { addons } from "storybook/manager-api";
import "./styles.css";
import { DARK_THEME, LIGHT_THEME } from "./theme";

function setupThemeListeners() {
  const prefersColorSchemeDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );

  function updateTheme() {
    addons.setConfig({
      theme: prefersColorSchemeDark.matches ? DARK_THEME : LIGHT_THEME,
    });
  }

  updateTheme();

  prefersColorSchemeDark.addEventListener("change", () => {
    updateTheme();
  });
}

function setupFavicon() {
  const link = document.createElement("link");
  link.setAttribute("rel", "icon");
  link.setAttribute("href", "/cof_square.svg");
  link.setAttribute("type", "image/svg+xml");
  document.head.appendChild(link);
}

function setup() {
  addons.setConfig({
    sidebar: {
      collapsedRoots: ["icons"],
    },
  });
  setupFavicon();
  setupThemeListeners();
}

setup();
