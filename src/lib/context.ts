import { getContext, setContext } from "svelte";
import type { IconContext } from "./types.js";

const key = Symbol("icons");

export function setIconsContext(context: IconContext) {
  setContext<IconContext>(key, context);
}

export function getIconsContext() {
  return getContext<IconContext | undefined>(key);
}
