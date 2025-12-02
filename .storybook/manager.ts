import { addons } from "storybook/manager-api";
import "./styles.css";
import { DARK_THEME, LIGHT_THEME } from "./theme";

function getThemeFromUrl(): "light" | "dark" | null {
  const params = new URLSearchParams(window.location.search);
  const globals = params.get("globals");
  if (globals?.includes("theme:dark")) return "dark";
  if (globals?.includes("theme:light")) return "light";
  return null;
}

function setupThemeListeners() {
  const prefersColorSchemeDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );

  function updateTheme() {
    const urlTheme = getThemeFromUrl();
    if (urlTheme) {
      addons.setConfig({
        theme: urlTheme === "dark" ? DARK_THEME : LIGHT_THEME,
      });
    } else {
      addons.setConfig({
        theme: prefersColorSchemeDark.matches ? DARK_THEME : LIGHT_THEME,
      });
    }
  }

  updateTheme();

  prefersColorSchemeDark.addEventListener("change", () => {
    updateTheme();
  });

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = (...args) => {
    originalPushState(...args);
    updateTheme();
  };

  history.replaceState = (...args) => {
    originalReplaceState(...args);
    updateTheme();
  };
}

function setupFavicon() {
  const link = document.createElement("link");
  link.setAttribute("rel", "shortcut icon");
  link.setAttribute("href", "/cof_square.svg");
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
