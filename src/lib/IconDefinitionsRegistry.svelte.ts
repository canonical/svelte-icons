import { onMount, type Snippet, untrack } from "svelte";
import { SvelteMap } from "svelte/reactivity";

export class IconDefinitionsRegistry {
  private readonly _definitions = new SvelteMap<string, IconDefinition>();
  private isMounted = $state(false);
  public readonly definitions = $derived(
    this.isMounted
      ? // If mounted, only return definitions that are currently in use
        Array.from(this._definitions.entries()).filter(
          ([_, entry]) => entry.mountedCount > 0,
        )
      : Array.from(this._definitions.entries()),
  );

  constructor() {
    onMount(() => {
      this.isMounted = true;
    });
  }

  register(stampId: string, definition: Snippet<[]>) {
    const existing = untrack(() => this._definitions.get(stampId));

    if (existing) existing.definition = definition;
    else this._definitions.set(stampId, new IconDefinition(definition));
  }

  notifyMounted(stampId: string) {
    untrack(() => {
      const entry = this._definitions.get(stampId);
      if (entry) entry.mountedCount++;
    });
  }

  notifyUnmounted(stampId: string) {
    const entry = this._definitions.get(stampId);
    if (entry) {
      entry.mountedCount--;
      if (entry.mountedCount <= 0) this._definitions.delete(stampId);
    }
  }
}

class IconDefinition {
  definition: Snippet<[]>;
  mountedCount = $state(0);

  constructor(definition: Snippet<[]>) {
    this.definition = $state(definition);
  }
}
