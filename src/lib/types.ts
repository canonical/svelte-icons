import type { Snippet } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";
import type { IconDefinitionsRegistry } from "./IconDefinitionsRegistry.svelte.js";

export type IconProps = Omit<SvelteHTMLElements["svg"], "children">;
export interface BaseIconProps extends IconProps {
  iconName: string;
  children: Snippet<[]>;
}

export interface IconContext {
  registry: IconDefinitionsRegistry;
}
