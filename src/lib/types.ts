import type { Snippet } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type IconProps = Omit<SvelteHTMLElements["svg"], "children">;
export interface IconBaseProps extends IconProps {
  iconName: string;
  children: Snippet<[]>;
}

export interface IconContext {
  registerIconInstance: (iconName: string, instance: symbol) => void;
  unregisterIconInstance: (iconName: string, instance: symbol) => void;
  isLeaderInstance: (iconName: string, instance: symbol) => boolean;
}
