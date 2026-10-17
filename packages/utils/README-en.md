# Shared Browser Utilities

[Project home](../../README-en.md) · [简体中文](README.md) | English

`@userscripts/utils` provides browser utilities for waiting for DOM content, converting HTML to Markdown and images to Data URLs, building notebooks, copying text, and downloading files. It is an internal workspace package built with its consuming userscripts, not a separately published npm package.

## Usage and runtime

LeetCode Toolkit and NowCoder Toolkit map `$utils/*` to `packages/utils/src/*` in their own `tsconfig.json` files and compile the source through Vite. There is no central `index.ts`; import individual modules:

```typescript
import { findElement } from "$utils/elementFinder";
import { htmlToMd } from "$utils/htmlToMd";
import { copyText } from "$utils/copy";

async function copyArticle() {
    const article = await findElement<HTMLElement>("article", {
        timeout: 3000,
    });
    const markdown = await htmlToMd(article, { convertImage: false });
    await copyText(markdown);
}
```

These aliases belong to the toolkits' build configuration; they are not public module paths. Most utilities require browser APIs such as the DOM, Blob, and clipboard. Image requests and simulated clicks also rely on the userscript environment, so these modules cannot be used directly as ordinary Node.js utilities.

## Module index

| Module                                       | Input and output                                                                                    | Notes                                                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`elementFinder.ts`](src/elementFinder.ts)   | `find(finderFn, config)` → `Promise<T>`; `findElement(selector, options?)` → `Promise<Element>`     | Queries immediately, then waits with `MutationObserver`; supports CSS, XPath, a parent node, and an additional predicate |
| [`htmlToMd.ts`](src/htmlToMd.ts)             | `createTurndownService()` → an extensible converter; `htmlToMd(node, options?)` → `Promise<string>` | Basic code block, paragraph, superscript, image, and GFM table rules                                                     |
| [`data-url.ts`](src/data-url.ts)             | `convertSrcToDataURL(src)` → `Promise<string>`                                                      | Downloads an image with a GM request and produces a Data URL; existing `data:` URLs are returned unchanged               |
| [`compress-image.ts`](src/compress-image.ts) | `compressImage(File \| Blob)` → `Promise<File \| Blob>`                                             | An asynchronous wrapper around CompressorJS                                                                              |
| [`jupyter.ts`](src/jupyter.ts)               | `NotebookBuilder` → a notebook object or `.ipynb` download                                          | Chains titles, sections, Markdown, code, and language information                                                        |
| [`copy.ts`](src/copy.ts)                     | `copyText(text)` → `Promise<void>`                                                                  | Calls `navigator.clipboard.writeText` and throws on failure                                                              |
| [`download-file.ts`](src/download-file.ts)   | `downloadFile(blob, filename, extension)` → `void`                                                  | Creates a temporary Object URL and triggers a download, appending the extension                                          |
| [`click.ts`](src/click.ts)                   | `simulateMouseClickReact(element)` → `void`                                                         | Dispatches `mousedown`, `mouseup`, and `click` using `unsafeWindow`                                                      |
| [`elementIndex.ts`](src/elementIndex.ts)     | `getElementIndex(element)` → `number`                                                               | Returns the zero-based index among its immediate parent's element children; throws without a parent                      |
| [`declaration.d.ts`](src/declaration.d.ts)   | Type declarations                                                                                   | Supplies TypeScript declarations for the GFM table plugin                                                                |

## Conversion and permission boundaries

### Waiting for DOM content

`find` defaults to a 5000 ms timeout and requires its second configuration argument; pass `{}` to use the defaults. `findElement` defaults to 500 ms. For either function, `timeout: 0` means waiting indefinitely. A timeout rejects the Promise; consumers should handle failure instead of assuming the page region exists.

The default observer watches only child node changes. Use `find`'s `observerOption` for requirements involving attribute or text changes. These utilities do not manage SPA routing lifecycles or component unmounting.

### Markdown and images

`htmlToMd` enables `convertImage: true` by default, downloading all `<img>` elements before converting and embedding them as Data URLs. `convertImage: false` skips image downloads. Provide a `turndownService` to add rules in the consuming project.

Image requests use `@sec-ant/gm-fetch`; the consuming userscript needs the relevant GM request permissions and allowed domains. GIF and SVG images bypass compression; other formats are passed to CompressorJS. Conversion errors propagate to the caller.

The current implementation uses a module-level image cache and `Promise.all`: a single image failure rejects the entire prefetch, the error path does not clear the cache, and concurrent conversions are not isolated. Explicitly use `convertImage: false` for stable exports with online image links; do not treat an image failure as a successful article conversion.

The basic converter does not understand site-specific solution data, rendered math structures, or multilingual editors. The new LeetCode solution export uses the toolkit's own [`solution-*` modules](../../userscripts/leetcode-toolkit/src/lib), while NowCoder's math rules live in [`scrape-description.ts`](../../userscripts/nowcoder-toolkit/src/routes/practice/scrape-description.ts). Start with the corresponding toolkit when changing these site features.

### Notebooks

```typescript
import { NotebookBuilder } from "$utils/jupyter";

const notebook = new NotebookBuilder()
    .addTitle("Example", "https://example.com/problem")
    .addMarkdown("Problem description")
    .addCode("print('Hello')")
    .setLanguage("python");

const content = notebook.build();
// Download example.ipynb in the browser:
notebook.download("example");
```

`build()` only assembles JSON data. It does not execute code, install kernels, or validate the exported notebook schema. The current implementation writes `nbformat: 5` and `nbformat_minor: 10`. Check reading compatibility in the target notebook client instead of inferring it from TypeScript types. `setLanguage` sets only `language_info.name`; it does not create a complete kernel configuration.

### Clipboard, downloads, and simulated clicks

`copyText` has no GM clipboard fallback. Consumers should `await` it, catch failures, and then show success or error feedback. Browser permissions, secure context requirements, and user activation may affect writing. LeetCode's solution export implements its GM fallback in the consuming script.

`downloadFile` returns after triggering the browser download; it cannot confirm that a file was saved to disk. `simulateMouseClickReact` dispatches synthetic events, does not create real user activation, and cannot guarantee that the website will accept those events.

## Development and validation

This package has no independent build or test commands. After installing dependencies from the repository root, run checks through its consumers:

```powershell
pnpm --filter leetcode-toolkit check
pnpm --filter leetcode-toolkit test
pnpm --filter leetcode-toolkit build
pnpm --filter nowcoder-toolkit check
pnpm --filter nowcoder-toolkit build
```

The existing tests do not establish complete coverage of every shared utility. After a change, validate the affected behavior through the consuming script: real page DOM, image request failures, clipboard rejection, file content, and reading in the target notebook client. See the [project home](../../README-en.md) for environment setup and script commands.

## Maintenance and origins

This package is independently maintained as part of [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts). Use [this project's Issues](https://github.com/liliujie2026/Userscripts/issues) for reports.

The project originated from [eclipher/Userscripts](https://github.com/eclipher/Userscripts) and retains the original copyright notice and [MIT license](../../LICENSE). Third-party libraries and their licenses remain with their respective projects.
