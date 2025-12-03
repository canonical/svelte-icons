<script module lang="ts">
  // biome-ignore-all lint/performance/noDynamicNamespaceImportAccess: we need all icons in this story
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Fuse from "fuse.js";
  import { type Component } from "svelte";
  import { VANILLA_THEME_CLASS_MAP } from "../../.storybook/components/stories/constants.js";
  import metadata from "../../metadata.json" with { type: "json" };
  import * as icons from "../lib/icons/index.js";

  const { Story } = defineMeta({
    tags: ["!autodocs"],
    title: "All Icons",
  });

  let search = $state("");
  let selectedIcon = $state<keyof typeof icons | null>(null);
  let pascalCaseIconName = $derived(
    selectedIcon ? pascalToKebabCase(selectedIcon) : "",
  );
  let selectedIconMetadata = $derived(
    metadata[
      (pascalCaseIconName
        ? `${pascalCaseIconName}.svg`
        : "") as keyof typeof metadata
    ],
  );
  let SelectedIconComponent: Component | null = $derived(
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

  // filtering
  const iconsWithMetadata = (Object.keys(icons) as (keyof typeof icons)[]).map(
    (iconName) => {
      const svgFileName = `${pascalToKebabCase(iconName)}.svg`;
      return {
        name: iconName,
        svgFileName,
        metadata: metadata[svgFileName as keyof typeof metadata] || {
          tags: [],
        },
        Component: icons[iconName] as Component,
      };
    },
  );

  const fuse = new Fuse(iconsWithMetadata, {
    keys: ["name", "svgFileName", "metadata.tags"],
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
      />
      <button type="reset" class="p-search-box__reset"
        ><icons.CloseIcon />
      </button>
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
          <span class="p-tooltip__message" role="tooltip"
            >{pascalToKebabCase(icon.name)}</span
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
          <h2 class="p-modal__title">
            Use Icon <code>{pascalCaseIconName}</code>
          </h2>
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
          {#if selectedIconMetadata}
            <div class="icon-tags">
              {#each selectedIconMetadata.tags as tag}
                <span class="p-chip is-readonly is-dense">
                  <span class="p-chip__value">{tag}</span>
                </span>
              {/each}
            </div>
          {/if}
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

      .icons-grid {
        margin: 1rem 0.5rem;
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
        margin: 1rem;
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: end;
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
            inset: -1px;

            z-index: -1;
          }
        }

        .icon-tags {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0.15rem;

          .p-chip {
            /* vanilla framework chip reset */
            margin: 0;
          }
        }
      }
    }
  </style>
</Story>
