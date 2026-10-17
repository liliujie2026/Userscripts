# LeetCode Toolkit

[简体中文](README.md) | **English** · [Project home](../../README-en.md)

A browser userscript for [LeetCode China](https://leetcode.cn) and [LeetCode Global](https://leetcode.com), with problem organization, solution export to Markdown, and code editor enhancements. Built with TypeScript, Svelte, and Vite.

Independently maintained by [liliujie2026](https://github.com/liliujie2026). The code originated in [eclipher/Userscripts](https://github.com/eclipher/Userscripts), with the original attribution and MIT license retained. Updates, releases, and issue tracking belong to [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts).

## Features and site support

| Feature                                                   | China     | Global    | Notes                                                                                 |
| --------------------------------------------------------- | --------- | --------- | ------------------------------------------------------------------------------------- |
| Copy problem title and Markdown description               | Supported | Supported | Buttons added to the description pane                                                 |
| Export a problem as Jupyter Notebook                      | Supported | Supported | Includes the title, description, and current editor code                              |
| Copy / download official editorials as Markdown           | Supported | Supported | Use the bottom-right toolbar after opening an accessible article                      |
| Copy / download community solutions as Markdown           | Supported | Supported | Available on detail pages; hidden on solution lists                                   |
| Solution navigation and browser back / forward            | Supported | Supported | The toolbar follows the article URL to avoid exporting a previous article             |
| Problem difficulty rating                                 | Supported | Supported | Shown when a rating exists; dynamic updates require the manager's `urlchange` API     |
| Format with `Ctrl + S`, completion, and hover suggestions | Supported | Supported | Adjusts the site's Monaco options; results depend on its editor and language services |
| Export Explore Card articles                              | —         | Supported | Downloads the current article's readable content                                      |
| Find editorial screenshots and open an external reader    | —         | Retained  | Available under `More` on official editorials; depends on external projects           |

“Supported” describes the implemented compatibility scope, not completed live testing of every page, account, or browser combination. Site changes may break element detection. Current solution export uses a shared toolbar; the older button layouts in the screenshots below are for feature reference only.

## Installation

A browser userscript manager is required. [Tampermonkey](https://www.tampermonkey.net/) is recommended. Other managers may differ in clipboard APIs and navigation events.

### Install a release

1. Install and enable a userscript manager, and grant the browser permissions it requires to run userscripts.
2. Open [this repository's Releases](https://github.com/liliujie2026/Userscripts/releases) and choose a release containing `leetcode-toolkit.user.js`. LeetCode release tags use the `leetcode-v*` prefix.
3. Download `leetcode-toolkit.user.js` from Assets and import it into the manager, or create a script and paste the complete file. If no release asset is available, build locally as described below.
4. Disable duplicate LeetCode Toolkit scripts and refresh any LeetCode tabs already open.

A Greasy Fork URL for this independently maintained version has not been confirmed in the repository. The original project's Greasy Fork entry does not distribute this repository's modifications. Check that the installed script's homepage points to `liliujie2026/Userscripts`.

### Build from source

Use Node.js 22.12+ (22.x) or 24.x, together with pnpm 10, from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter leetcode-toolkit build
```

Install the generated `userscripts/leetcode-toolkit/dist/leetcode-toolkit.user.js`. The `dist` directory is generated and excluded from Git. See the [root README](../../README-en.md) for workspace setup and the overall development workflow.

## Usage

### Problems and the editor

Open a problem's description pane and use the added buttons to copy its title, copy its Markdown description, or export an `.ipynb` file. The notebook includes problem content and the current Monaco editor code. Export reads the editor and does not execute the code.

Use a client that reads `.ipynb`, such as [VS Code with Jupyter support](https://code.visualstudio.com/docs/datascience/jupyter-notebooks). Running code requires a separate runtime and kernel for the selected language. Compatibility of generated files with each notebook client requires practical verification; solution export tests do not cover this feature.

Ratings come from [LeetCode Problem Rating](https://github.com/zerotrac/leetcode_problem_rating). Problems without a rating record do not receive a displayed score. If the manager lacks `urlchange` support, refresh after navigating between problems to update the rating.

### Official and community solutions

1. Open the complete article for an official editorial or community solution you can access, and wait for its content to load.
2. Use **Copy Markdown** or **Download Markdown** in the bottom-right toolbar. The document contains the article title, a `Source` link, and its body.
3. Paste copied text into an editor to inspect it, or open the downloaded `.md` file. Buttons are temporarily disabled during export and recover after success or failure.
4. After navigating to another solution, including browser back / forward, export again. The toolbar is hidden on solution lists.

The Chinese site supports both the old `/solution/article/` and current `/solutions/id/article/` routes. Official Chinese articles may use a regular solution detail URL, so the toolbar label can identify the article simply as the current solution. If the URL changes during export, the pending output is cancelled; retry once the new article has loaded.

For Global official editorials, `More` retains two auxiliary actions: `Find Screenshot` searches an external screenshot index, and `Read Saved Editorial` opens the configured [external reader](https://leetcode-editorial-reader.vercel.app). These content services are not hosted by this repository; availability and article coverage depend on their operators.

## How export works and its limits

The exporter first looks for page data matching the current article. On the Chinese site, it can query the current site's read-only GraphQL operations for original Markdown or published Slate rich text. Global official editorials also attempt an original-content query; Global community solutions use page data or rendered content. If original content is unavailable, the exporter converts the currently visible article DOM.

- **Structure and code:** conversion covers headings, paragraphs, lists, tables, fenced code, formulas, and details blocks. Slate source data can include inactive language tabs. The DOM fallback can only process content already loaded and readable by the page.
- **Images:** references are retained rather than downloading every image during solution export. DOM conversion resolves valid links to absolute URLs; original Markdown keeps its existing syntax, so not every image URL is necessarily normalized. Linked images usually require network access.
- **Math:** conversion attempts to preserve the original TeX. Preview behavior depends on the reader's support for math and related HTML.
- **Embedded content:** the DOM fallback reads already loaded, same-origin iframe code. Cross-origin iframes and recognizable video URLs become links. It does not download videos, switch language tabs, or click through slides.
- **Access conditions:** authentication, article permissions, site verification, API changes, or incomplete loading may affect extraction. The script works with content accessible to the current page.
- **Clipboard:** the manager's `GM_setClipboard` is preferred, with the browser Clipboard API as a fallback. Retry or use file download if copying fails.

Article API requests go to the current LeetCode site and do not upload article text to external services. The toolkit still uses third-party dependency CDNs, rating data, a screenshot index, and image requests for problem exports. Independent maintenance does not mean that every runtime resource is bundled for offline use.

## Source layout

```text
leetcode-toolkit/
├── src/
│   ├── main.ts                    # Initialize the matching page type
│   ├── lib/
│   │   ├── solution-source.ts     # Routes, page data, same-origin queries, article lookup
│   │   ├── solution-slate.ts      # Published rich-text serialization
│   │   ├── solution-markdown.ts   # DOM to Markdown conversion
│   │   ├── solution-export.ts     # Document formatting, clipboard, file download
│   │   ├── solution-toolbar.ts    # Toolbar lifecycle and navigation
│   │   ├── SolutionExport.svelte  # Actions, progress, and error feedback
│   │   └── editorial-saver.ts     # Explore article export adapter
│   └── routes/
│       ├── problems/             # Description, ratings, editor, editorial helpers
│       └── explore/              # Global Explore Cards
├── tests/                        # Sources, conversion, interaction, optional live checks
├── assets/                       # Original project screenshots
├── vite.config.ts                # Build and userscript metadata
└── package.json
```

Some conversion tests live in `src/lib/*.test.ts`. Shared buttons and browser utilities are in [`packages/components`](../../packages/components) and [`packages/utils`](../../packages/utils).

## Development and validation

After installing dependencies, run from the repository root:

```sh
pnpm --filter leetcode-toolkit dev
```

Follow the terminal instructions to connect the development userscript to your manager. Before submitting changes, run:

```sh
pnpm --filter leetcode-toolkit test
pnpm --filter leetcode-toolkit check
pnpm --filter leetcode-toolkit lint
pnpm --filter leetcode-toolkit build
git diff --check
```

Normal tests are offline by default. They cover source identification, Slate / DOM conversion, toolbar navigation, clipboard completion, and failure recovery. Optional live tests visit a small set of public Chinese articles and are skipped by default. Enable them explicitly in PowerShell:

```powershell
$env:LEETCODE_LIVE = '1'
try {
    pnpm --filter leetcode-toolkit test
} finally {
    Remove-Item Env:LEETCODE_LIVE
}
```

Live tests depend on connectivity, public articles, and API availability. A pass establishes only that the articles and paths exercised in that run worked. It does not replace actual clicks in Tampermonkey or establish compatibility with the Global site, every article format, or every account state.

After updating the script, browser acceptance should cover at least:

- Copy and download both an official and a community article; check titles, source links, the end of the body, code, math, and tables.
- Navigate between articles and use back / forward; verify that articles do not get mixed up, toolbars are not duplicated, and list pages hide the toolbar.
- Confirm that buttons recover after a copy failure and downloaded files contain readable content.
- Separately verify problem pages, the editor, notebooks, or Explore Cards whenever a change affects those features.

## Troubleshooting

| Symptom                                       | Checks and next steps                                                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No toolbar appears                            | Confirm the script is enabled and browser permissions are granted; refresh; open an article rather than a list or submission page; disable duplicate scripts     |
| Copy fails or produces no content             | Wait for the article to load, check login and site verification, try downloading, and inspect `[LeetCode Toolkit] Solution export failed` in the browser console |
| Title or body belongs to the previous article | Retry after the current article loads; report navigation steps, the URL, and exported results in an Issue                                                        |
| TeX exists but is not rendered                | Inspect Markdown source and confirm that the reader supports math                                                                                                |
| Images are unavailable offline                | Most exports retain online references; reconnect and check whether the original URLs remain accessible                                                           |
| Language tabs, videos, or slides are missing  | Check whether the DOM fallback was used and whether content was loaded and readable; see the export limitations                                                  |
| A rating does not update                      | Check the manager's `urlchange` support and refresh; the problem may also have no rating record                                                                  |

## Screenshots

These five screenshots are retained from the original project to illustrate existing features. **They show an older interface and do not describe the current solution toolbar's location or appearance.** Follow the usage instructions above for current article export.

| Problem organization                                                          | Editorial helpers (older layout)                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ![Copy title, copy description, and notebook export](assets/screenshot-1.png) | ![Older official editorial helper buttons](assets/screenshot-2.png) |

| Notebook example                                                        | Editor suggestions                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ![Read problems and edit notebooks in VS Code](assets/screenshot-3.png) | ![Monaco completion and hover suggestions](assets/screenshot-4.png) |

![Explore Card article export button](assets/screenshot-5.png)

## Contributing, attribution, and license

Report problems and suggestions in [this repository's Issues](https://github.com/liliujie2026/Userscripts/issues). Read the [root contribution guidance](../../README-en.md#contributing-and-reporting-issues) before opening a pull request. For export issues, include the site, a reproducible page URL, script and manager versions, steps, and the expected / actual content difference. Do not include cookies, tokens, or private article text.

This project develops independently from [eclipher/Userscripts](https://github.com/eclipher/Userscripts), retaining the original author's contributions. Ongoing maintenance does not depend on upstream updates or releases. The original version also drew on these projects, whose contributions remain acknowledged:

- [Leetcode Screenshotter](https://github.com/akhilkammila/leetcode-screenshotter): official editorial screenshot index.
- [LeetCode Problem Rating](https://github.com/zerotrac/leetcode_problem_rating): rating data.
- [LeetCode Problem to Markdown](https://greasyfork.org/en/scripts/448601).
- [leetcode enhanced code editor](https://greasyfork.org/en/scripts/502740-leetcode-enhanced-code-editor).
- [Leetcode: format on save](https://greasyfork.org/en/scripts/481927-leetcode-format-on-save).
- [leetcode-difficulty-rating-extension](https://github.com/boenshao/leetcode-difficulty-rating-extension).

Project code is distributed under the [MIT license](../../LICENSE). Retain the existing copyright and license notices when redistributing it. LeetCode problems, articles, images, and third-party data remain subject to their respective rights holders' terms; the code's MIT license does not relicense that content. This is a community-maintained browser userscript and is not affiliated with LeetCode.
