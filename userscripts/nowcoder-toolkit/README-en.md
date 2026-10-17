# NowCoder Toolkit

[简体中文](./README.md) · [Project home](../../README-en.md) · [Report an issue](https://github.com/liliujie2026/Userscripts/issues)

A browser userscript for NowCoder programming practice pages. It adds buttons for copying problem descriptions as Markdown and exporting Jupyter Notebooks. The current package version is **1.0.0**.

This script is maintained independently in [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts), originating from [eclipher/Userscripts](https://github.com/eclipher/Userscripts). Use the current repository for releases, issue reports, and future maintenance; the original project remains credited as the source.

## Features

| Feature            | Behavior                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Copy description   | Converts the current problem description to Markdown and writes it to the clipboard.                                                               |
| Formula conversion | Reads TeX from KaTeX `annotation` elements when available, handling inline formulas, centered display formulas, and selected indentation patterns. |
| Image handling     | Requests images through the userscript manager and attempts to compress and embed them as Data URLs; a failed image request may interrupt export.  |
| Notebook export    | Organizes the title, source link, Markdown description, and current code into an `.ipynb` file.                                                    |

Notebook code comes from the **Download** link in the page toolbar, and the language comes from an attribute on the page's Monaco element. These controls must be loaded and accessible. The script does not provide local language kernels or execute exported code.

## URL scope and requirements

- Matches `http://www.nowcoder.com/practice/*` and `https://www.nowcoder.com/practice/*`.
- Requires a browser with a userscript manager, such as [Tampermonkey](https://www.tampermonkey.net/).
- Buttons are mounted in the problem description area; course pages, contest pages, and other NowCoder domains are not matched.
- Uses `GM_xmlhttpRequest` to download description images; the built script may also load dependencies from a CDN.
- To adapt to the page's event listener modifications, the script obtains a native method from a temporary iframe and replaces the page's `EventTarget.prototype.addEventListener`. This affects event registration across the page. If page interactions behave unexpectedly, disable the script, reload, and compare.

## Installation

### Use a build published by this project

1. Install and enable a userscript manager.
2. Open this project's [GitHub Releases](https://github.com/liliujie2026/Userscripts/releases) and look for a `nowcoder-v*` release.
3. If a release is available, download `nowcoder-toolkit.user.js` from Assets and import its complete contents into the manager, or paste them into a new script and save.
4. Disable duplicate older installations and refresh a NowCoder practice page.

If this repository has not published the artifact yet, build from source below. The original author's Greasy Fork entry is not an installation or update channel for this maintained version. An independent listing will be announced in this repository when its URL is available.

### Build from source

Run from the repository root. Prepare Node.js and pnpm using the [root development instructions](../../README-en.md#getting-started-from-source):

```sh
pnpm install --frozen-lockfile
pnpm --filter nowcoder-toolkit build
```

Import the complete generated `userscripts/nowcoder-toolkit/dist/nowcoder-toolkit.user.js` file into your userscript manager. `dist` contains build output and does not need to be committed to Git.

## Usage and acceptance checks

1. Open an accessible NowCoder practice problem and wait for its description and code editor to load.
2. Click “复制描述” (Copy description), paste into a text editor, and check the body, examples, formulas, and tables.
3. Click “保存为 Jupyter Notebook” (Save as Jupyter Notebook) and locate the `.ipynb` file in your browser's download directory.
4. Verify that the title, source, description, and code match the current page.
5. Open the file in a Notebook client and separately verify file compatibility and the required language kernel.

The existing Notebook builder writes `nbformat: 5` and `nbformat_minor: 10`. This documentation does not claim verified compatibility with Jupyter or VS Code. If your client rejects a file, preserve its error message and the exported file when reporting an issue; Markdown copying remains usable separately. The implementation is in [`packages/utils/src/jupyter.ts`](../../packages/utils/src/jupyter.ts).

## Development

Run all commands from the repository root:

```sh
# Start Vite and follow its output to install the development script
pnpm --filter nowcoder-toolkit dev

# Check Svelte and TypeScript
pnpm --filter nowcoder-toolkit check

# Build the installable script
pnpm --filter nowcoder-toolkit build
```

| Path                                                                     | Responsibility                                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [`src/main.ts`](./src/main.ts)                                           | Applies the event listener adaptation and initializes the practice page.      |
| [`src/routes/practice`](./src/routes/practice)                           | Mounts buttons, converts descriptions, copies content, and exports Notebooks. |
| [`src/lib/correct-event-listner.ts`](./src/lib/correct-event-listner.ts) | Adapts page event listeners.                                                  |
| [`vite.config.ts`](./vite.config.ts)                                     | Userscript metadata, URL scope, and external dependencies.                    |
| [`../../packages/utils`](../../packages/utils)                           | Shared Markdown, image, clipboard, and Notebook tools.                        |

This package has no dedicated automated test script. Passing `check` and `build` confirms static checks and compilation; page behavior still needs browser acceptance checks. The [NowCoder release workflow](../../.github/workflows/nowcoder-toolkit-release.yml) builds the script when a `nowcoder-v*` tag is pushed and attaches `dist` files to a GitHub Release in the current repository. It does not publish to Greasy Fork automatically.

## Troubleshooting and limitations

| Symptom                                                       | What to check                                                                                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Buttons are missing                                           | Check manager permissions, the matched URL, and whether the description has loaded; reload and try again.                                |
| Buttons disappear or content is wrong after changing problems | Mounting depends on the page DOM and does not include a complete remounting mechanism for in-page navigation; reload the target problem. |
| Clipboard content is missing                                  | Paste to verify the actual clipboard and inspect the console; do not use the success notification as the sole acceptance check.          |
| Export is slow or fails on image-heavy content                | Check image URLs and network requests; the current prefetch may stop after a single failed image.                                        |
| Notebook code is missing or export keeps waiting              | Confirm the editor and Download control exist, and verify that the page's download link is accessible.                                   |
| Notebook cannot be opened or executed                         | Check file format compatibility and local kernels separately; the file does not include an execution environment.                        |
| Page clicks behave unexpectedly                               | Disable the script and reload to check whether the event listener adaptation is involved.                                                |

When reporting an issue, include the page URL, browser and manager versions, script version, reproduction steps, and console errors. Do not include credentials, cookies, or other sensitive information.

## Origin and license

- Original project: [eclipher/Userscripts](https://github.com/eclipher/Userscripts). Credit to the original author for the implementation and documentation foundation.
- Current maintenance: [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts). This project independently decides changes and releases without depending on synchronization with the original project.
- Code is provided under the [MIT license](../../LICENSE), preserving the original copyright and license notice. Third-party dependencies retain their respective licenses.
