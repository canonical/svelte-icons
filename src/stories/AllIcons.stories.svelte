<script module lang="ts">
  // biome-ignore-all lint/performance/noDynamicNamespaceImportAccess: we need all icons in this story
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Fuse from "fuse.js";
  import { type Component } from "svelte";
  import { VANILLA_THEME_CLASS_MAP } from "../../.storybook/decorators/theme/constants.js";
  import metadata from "../../metadata.json" with { type: "json" };
  import * as icons from "../lib/icons/index.js";
  import { IconsOptimizationProvider } from "../lib/index.js";

  const { Story } = defineMeta({
    tags: ["!autodocs"],
    title: "All Icons",
  });

  let search = $state("");
  let selectedIcon = $state<keyof typeof icons | null>(null);
  let searchElement = $state<HTMLInputElement>();
  const selectedIconMetadata = $derived(
    selectedIcon
      ? metadata[pascalToKebabCase(selectedIcon) as keyof typeof metadata]
      : null,
  );
  const SelectedIconComponent: Component | null = $derived(
    selectedIcon ? icons[selectedIcon] : null,
  );

  let copiedToClipboard = $state(false);

  // theme
  const prefersColorSchemeDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );
  let theme = $state(prefersColorSchemeDark.matches);
  const vanillaThemeClass = $derived(
    VANILLA_THEME_CLASS_MAP[theme ? "dark" : "light"],
  );
  prefersColorSchemeDark.addEventListener("change", () => {
    theme = prefersColorSchemeDark.matches;
  });

  // keyboard shortcuts
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      selectedIcon = null;
    }
  });

  // handlers
  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    search = (event.target as HTMLFormElement).search.value;
  }

  function handleIconSelect(event: MouseEvent, iconName: keyof typeof icons) {
    selectedIcon = iconName;
    (event.currentTarget as HTMLButtonElement).blur();
  }

  function handleCopyToClipboard(iconName: keyof typeof icons) {
    const code = `<${iconName} />`;

    navigator.clipboard.writeText(code);
    copiedToClipboard = true;

    setTimeout(() => {
      copiedToClipboard = false;
    }, 2000);
  }

  function handleTagSelect(tag: string) {
    search = tag;
    selectedIcon = null;
    searchElement?.focus();
  }

  // filtering
  const iconsWithMetadata = (Object.keys(icons) as (keyof typeof icons)[]).map(
    (iconName) => {
      return {
        name: iconName,
        metadata:
          metadata[pascalToKebabCase(iconName) as keyof typeof metadata],
        Component: icons[iconName] as Component,
      };
    },
  );

  const fuse = new Fuse(iconsWithMetadata, {
    keys: ["name", "metadata.file", "metadata.tags"],
    threshold: 0.2,
    ignoreLocation: true,
    findAllMatches: true,
    isCaseSensitive: false,
  });

  let filteredIcons = $derived(
    search
      ? (fuse.search(search).map((result) => result.item) ?? [])
      : iconsWithMetadata,
  );

  // utils
  function pascalToKebabCase(str: string): string {
    const kebab = str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
    const iconName = kebab.startsWith("-") ? kebab.slice(1) : kebab;
    return iconName.replace(/-icon$/, "");
  }
</script>

<Story name="All Icons" asChild tags={["!dev"]}>
  <IconsOptimizationProvider>
    <div class={["icons-explorer", vanillaThemeClass]}>
      <form class="p-search-box" onsubmit={handleSubmit}>
        <label class="u-off-screen" for="search">Search</label>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="search"
          id="search"
          class="p-search-box__input"
          name="search"
          placeholder={`Search ${Object.keys(icons).length} icons...`}
          required
          autocomplete="on"
          autofocus
          bind:value={search}
          bind:this={searchElement}
        />
        <button type="submit" class="p-search-box__button"
          ><icons.SearchIcon /></button
        >
      </form>
      <div class="icons-grid">
        {#each filteredIcons as icon (icon)}
          <button
            class={[
              "icon-button",
              "p-button--base",
              "is-dense",
              "is-small",
              "p-tooltip p-tooltip--btm-center",
              vanillaThemeClass,
            ]}
            onclick={(event) => handleIconSelect(event, icon.name)}
          >
            <icon.Component />
            <span
              class="p-tooltip__message"
              role="tooltip"
              style="z-index: 1000;">{pascalToKebabCase(icon.name)}</span
            >
          </button>
        {/each}
      </div>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    {#if selectedIcon && SelectedIconComponent}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="p-modal"
        onclick={(e) => {
          e.target === e.currentTarget && (selectedIcon = null);
        }}
      >
        <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
        <section
          class="p-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="Use Icon"
        >
          <header class="p-modal__header">
            <h2 class="p-modal__title">Icon Details</h2>
            <button
              class="p-modal__close"
              aria-label="Close active modal"
              aria-controls="modal"
              onclick={() => (selectedIcon = null)}>Close</button
            >
          </header>
          <div class="modal-content">
            <div class="icon-preview">
              <div class="grid-background"></div>
              <SelectedIconComponent />
            </div>
            <div class="icon-info">
              <div>
                <h3>
                  {pascalToKebabCase(selectedIcon)}
                </h3>
                <span>
                  <code>
                    {`<${selectedIcon} />`}
                  </code>
                </span>
              </div>
              {#if selectedIconMetadata}
                <div class="icon-tags">
                  {#each selectedIconMetadata.tags as tag}
                    <button
                      class="p-chip is-dense"
                      onclick={() => handleTagSelect(tag)}
                    >
                      <span class="p-chip__value">{tag}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <footer class="p-modal__footer">
            <button
              class="u-no-margin--bottom"
              aria-controls="modal"
              onclick={() =>
                handleCopyToClipboard(selectedIcon as keyof typeof icons)}
              disabled={copiedToClipboard}
            >
              {#if copiedToClipboard}
                Copied to clipboard
              {:else}
                Copy
              {/if}
            </button>
          </footer>
        </section>
      </div>
    {/if}

    <style>
      :root {
        --icon-button-size: 1.5rem;
        --icon-button-padding: 1rem;
        --icon-preview-size: 13rem;
        --icon-preview-padding: 2rem;
      }

      .icons-explorer {
        min-height: 32rem;
        overflow-x: hidden;
        .icons-grid {
          /* SB is lagging when there is no inline margin */
          margin: 1rem 1px 0;
          /* extra space for tooltip of last row, otherwise overflow is triggered due to SB dynamic canvas height */
          padding: 0 0 3rem;
          display: grid;
          grid-template-columns: repeat(
            auto-fill,
            minmax(
              calc(var(--icon-button-size) + var(--icon-button-padding) * 2),
              1fr
            )
          );
          gap: 1em;
        }

        .icon-button {
          display: inline-flex;
          align-items: center;
          font-size: var(--icon-button-size);
          padding: var(--icon-button-padding);
          aspect-ratio: 1/1;

          /* vanilla framework button reset */
          margin: 0;
        }
      }
      .p-modal {
        .modal-content {
          align-items: center;
          display: flex;
          flex-direction: row;
          gap: 1rem;
          margin: 1rem;
          width: 41rem;

          .icon-preview {
            align-items: center;
            display: flex;
            padding: var(--icon-preview-padding);
            font-size: var(--icon-preview-size);
            min-width: var(--icon-preview-size);
            min-height: var(--icon-preview-size);
            aspect-ratio: 1/1;
            isolation: isolate;
            justify-content: center;
            overflow: hidden;
            position: relative;

            .grid-background {
              background-image: linear-gradient(
                  var(--vf-color-border-low-contrast) 1px,
                  transparent 1px
                ),
                linear-gradient(
                  90deg,
                  var(--vf-color-border-low-contrast) 1px,
                  transparent 1px
                );
              background-size: 0.79rem 0.79rem;
              position: absolute;
              inset: -5px;

              z-index: -1;
            }
          }
          .icon-info {
            align-self: stretch;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            margin: 1rem 0;

            .icon-tags {
              display: inline-flex;
              flex-wrap: wrap;
              gap: 0.2rem;
              max-height: 4rem;
              overflow-y: auto;

              .p-chip {
                /* vanilla framework chip reset */
                margin: 0;
              }
            }
          }
        }
      }
    </style>
  </IconsOptimizationProvider>
</Story>
