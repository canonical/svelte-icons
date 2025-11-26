<script lang="ts">
  import { type Snippet } from "svelte";
  import { SvelteMap, SvelteSet } from "svelte/reactivity";
  import { setIconsContext } from "./context.js";

  const { children }: { children: Snippet<[]> } = $props();

  const registry: SvelteMap<string, SvelteSet<symbol>> = new SvelteMap();

  setIconsContext({
    registerIconInstance: (iconName: string, instanceId: symbol) => {
      const instances = registry.get(iconName);
      if (instances) {
        instances.add(instanceId);
      } else {
        registry.set(iconName, new SvelteSet([instanceId]));
      }
    },
    unregisterIconInstance: (iconName: string, instanceId: symbol) => {
      registry.get(iconName)?.delete(instanceId);
    },
    isLeaderInstance: (iconName: string, instanceId: symbol) => {
      return (
        registry.get(iconName)?.values().next().value === instanceId || false
      );
    },
  });
</script>

{@render children()}
