# Shared UI Components

[Project home](../../README-en.md) · [简体中文](README.md) | English

`@userscripts/components` provides shared Svelte 5 buttons for LeetCode Toolkit and NowCoder Toolkit. It is an internal workspace package compiled together with the consuming userscript. It requires no separate installation and is not published as a public npm package.

## Components and entry points

| File                                               | Responsibility                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`src/Button.svelte`](src/Button.svelte)           | A button or link with color variants and a loading indicator for asynchronous button actions |
| [`src/ButtonGroup.svelte`](src/ButtonGroup.svelte) | Arranges buttons in a wrapping `inline-flex` layout                                          |
| [`src/index.ts`](src/index.ts)                     | Exports `Button` and `ButtonGroup`                                                           |

Both toolkits map `$components/*` to this directory's `src/*` in their own `tsconfig.json` files, and Vite loads the source. The imports below depend on the consuming project's aliases and cannot be copied into an arbitrary standalone project without configuration.

```svelte
<script lang="ts">
    import Button from "$components/Button.svelte";
    import ButtonGroup from "$components/ButtonGroup.svelte";

    async function copyExample() {
        try {
            await navigator.clipboard.writeText("Example");
        } catch (error) {
            console.error("Copy failed", error);
            // Show an error in the consumer and let the handler finish normally.
        }
    }
</script>

<ButtonGroup aria-label="Export actions">
    <Button variant="green" onclick={copyExample}>Copy</Button>
    <Button href="https://github.com/liliujie2026/Userscripts">
        Project home
    </Button>
</ButtonGroup>
```

## Button API

| Property         | Default    | Behavior                                                                   |
| ---------------- | ---------- | -------------------------------------------------------------------------- |
| `variant`        | `"purple"` | Accepts `"purple"`, `"green"`, or `"orange"`                               |
| `type`           | `"button"` | Passed to the button element                                               |
| `href`           | Unset      | Renders a link when provided; opens a new tab by default                   |
| `onclick`        | Unset      | Called in button mode; a returned Promise activates the loading state      |
| `ref`            | `null`     | Use `bind:ref` to obtain the actual button or link element                 |
| Children         | Empty      | Rendered through a Svelte 5 children snippet                               |
| Other attributes | —          | Forwarded to the actual element, such as `class`, `title`, or `aria-label` |

Button and link modes use different event paths: link mode does not run the component's `onclick` wrapper or provide asynchronous loading behavior. Use a button for actions and `href` for navigation.

The asynchronous button currently clears its loading state after a Promise **resolves**; it does not yet use `finally` for rejected Promises. Consumers need to catch failures inside their asynchronous handlers and display appropriate feedback, so an exception does not leave the button loading indefinitely. The component does not implement copying, downloading, notifications, or retries.

The loading indicator uses the host page's `animate-spin` CSS class. Without that class, the icon remains visible but may not rotate. An independent consumer should provide the corresponding animation styles.

## ButtonGroup API

`ButtonGroup` accepts children and ordinary `HTMLDivElement` attributes. It only supplies `inline-flex`, wrapping, and spacing. It does not track selection or manage child buttons' disabled and loading states.

## Development and validation

This package has no independent `dev`, `build`, `check`, or `test` scripts. After installing dependencies from the repository root, validate through the toolkits that consume it:

```powershell
pnpm --filter leetcode-toolkit check
pnpm --filter leetcode-toolkit test
pnpm --filter leetcode-toolkit build
pnpm --filter nowcoder-toolkit check
pnpm --filter nowcoder-toolkit build
```

Shared component changes may affect both toolkits. After type checks and builds, use a browser to check button layout, link behavior, and state recovery after successful and failed actions. The existing LeetCode tests cover their current cases; they do not replace full component interaction acceptance testing.

Keep site routing, article selectors, solution export state, and notification policies in [`userscripts`](../../userscripts), outside these two basic components.

## Maintenance and origins

This package is independently maintained as part of [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts). Send reports and proposed changes to [this project's Issues](https://github.com/liliujie2026/Userscripts/issues).

The project originated from [eclipher/Userscripts](https://github.com/eclipher/Userscripts) and retains the original copyright notice and [MIT license](../../LICENSE). The button appearance was adapted from [Uiverse's blue-dodo-17](https://uiverse.io/krlozCJ/blue-dodo-17); its attribution remains in the source.
