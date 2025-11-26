# @canonical/svelte-icons

Canonical's design system icons packaged as Svelte 5 components. This library provides all icons from [Canonical's Pragma design system](https://github.com/canonical/pragma/tree/main/packages/ds-assets) as easy-to-use Svelte components.

## Installation

```bash
bun add @canonical/svelte-icons
```

## Usage

### Basic Usage

Import icons individually and use them as components:

```svelte
<script>
  import { Home, Settings, User } from '@canonical/svelte-icons';
</script>

<Home />
<Settings class="custom-class" />
```

### Styling Icons

Icons by default inherit the current text color and size.

```svelte
<script>
  import { Search } from '@canonical/svelte-icons';
</script>

<Search 
  style="color: red; width: 2em; height: 2em;" 
/>
```

### Performance Optimization

When using the same icon multiple times, you may use `IconsOptimizationProvider` to deduplicate SVG definitions in the generated markup:

```svelte
<script>
  import { IconsOptimizationProvider, Home } from '@canonical/svelte-icons';
</script>

<IconsOptimizationProvider>
  <nav>
    <Home /> <!-- All instances share the same SVG definition -->
    <Home />
    <Home />
  </nav>
</IconsOptimizationProvider>
```

This is especially useful when rendering the same icon many times.

//TODO: Add link to *Node tree size comparison* story

### Custom Icons
You can also create custom icon components using the `BaseIcon` component:

```svelte
<script>
  import { BaseIcon } from '@canonical/svelte-icons';
</script>

<BaseIcon iconName="my-custom-icon">
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="black" stroke-width="1" fill="red" />
  </svg>
</BaseIcon>
```

> [!IMPORTANT]
> When using custom icons with `IconsOptimizationProvider`:
> - ensure that the `iconName` prop is unique for each custom icon to avoid collisions,
> - modifying the SVG content inside `BaseIcon` during runtime may lead to unexpected behaviors.
>
> Check out the *Reactivity playground* story to learn more. //TODO: link to story.

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
