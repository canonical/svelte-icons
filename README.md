# @canonical/svelte-icons

Canonical's design system icons packaged as Svelte 5 components. This library provides all icons from [Canonical's Pragma design system](https://github.com/canonical/pragma/tree/main/packages/ds-assets) as easy-to-use Svelte components.

> [!WARNING]
> This package is it's experimental stage. It may undergo significant changes before reaching a stable release. It is not recommended for production use at this time.

## Installation

```bash
bun add @canonical/svelte-icons
```

## Usage

### Basic Usage

Import icons individually and use them as components:

```html
<script>
  import { Home, Settings, User } from "@canonical/svelte-icons";
</script>

<Home />
<Settings class="custom-class" />
```

### Styling Icons

Icons by default inherit the current text color and size.

```html
<script>
  import { Search } from "@canonical/svelte-icons";
</script>

<Search style="color: red; width: 2em; height: 2em;" />
```

### Performance Optimization

When using the same icon multiple times, you may use `IconsOptimizationProvider` to deduplicate SVG definitions in the generated markup:

```html
<script>
  import { IconsOptimizationProvider, Home } from "@canonical/svelte-icons";
</script>

<IconsOptimizationProvider>
  <nav>
    <Home />
    <!-- All instances share the same SVG definition -->
    <Home />
    <Home />
  </nav>
</IconsOptimizationProvider>
```

This is especially useful when rendering the same icon many times.

> Check out the [Node tree size comparison](https://main--693121d8204f530975a41c27.chromatic.com?path=/story/advanced-iconsoptimizationprovider--node-tree-size-comparison) story to see the DOM size difference between optimized and non-optimized rendering.

### Custom Icons

You can also create custom icon components using the `IconBase` component:

```html
<script>
  import { IconBase } from "@canonical/svelte-icons";
</script>

<IconBase iconName="my-custom-icon">
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="black" stroke-width="1" fill="red" />
  </svg>
</IconBase>
```

> [!IMPORTANT]
> When using custom icons with `IconsOptimizationProvider`:
>
> - ensure that the `iconName` prop is unique for each custom icon to avoid collisions,
> - modifying the SVG content inside `IconBase` during runtime may lead to unexpected behaviors.
>
> Check out the [Reactivity playground](https://main--693121d8204f530975a41c27.chromatic.com?path=/story/advanced-iconsoptimizationprovider--reactivity-playground) story to learn more.

## Icon Source

All SVG icons are sourced from the [@canonical/ds-assets](https://github.com/canonical/pragma/tree/main/packages/ds-assets) package, which is part of Canonical's Pragma design system.

## Development

```bash
# Install dependencies
bun install

# Build icon components from source
bun run build

# Run Storybook for development
bun run storybook

# Type check
bun run check
```
