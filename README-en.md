# Userscripts

[简体中文](./README.md) | **English**

A collection of browser userscripts for coding practice and developer tools: export LeetCode problems and solutions and NowCoder problems, improve the editing experience, and redirect npm pages to npmx.

This project is independently maintained by [liliujie2026](https://github.com/liliujie2026). Development, issue tracking and releases are managed in [this repository](https://github.com/liliujie2026/Userscripts). The original project's attribution and copyright are preserved below.

[Releases](https://github.com/liliujie2026/Userscripts/releases) · [Report an issue](https://github.com/liliujie2026/Userscripts/issues) · [MIT license](./LICENSE)

## Available scripts

| Script           | Target pages                                                                       | Main features                                                                                                                    | Usage and development                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| LeetCode Toolkit | Problem / solution pages on `leetcode.cn` and `leetcode.com`; global Explore cards | Problem copying and Notebook export, official and community solution Markdown export, editor enhancements and difficulty ratings | [中文](./userscripts/leetcode-toolkit/README.md) / [English](./userscripts/leetcode-toolkit/README-en.md) |
| NowCoder Toolkit | `www.nowcoder.com/practice/*`                                                      | Copy problem statements as Markdown, convert formulas, export statements and current code as Notebooks                           | [中文](./userscripts/nowcoder-toolkit/README.md) / [English](./userscripts/nowcoder-toolkit/README-en.md) |
| Redirect to npmx | `npmjs.com` and `www.npmjs.com`                                                    | Redirect the current page to `npmx.dev`, preserving its path and query                                                           | [中文](./userscripts/redirect-to-npmx/README.md) / [English](./userscripts/redirect-to-npmx/README-en.md) |

Install and enable each script separately. Its documentation describes the exact URL scope, site differences and limitations.

## Installation and usage

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) and allow it to run userscripts on the target sites.
2. Select the relevant script version in [this project's Releases](https://github.com/liliujie2026/Userscripts/releases) and download the `.user.js` asset. If a matching release asset is not available, build it from source as described below.
3. Import the `.user.js` into your manager, or create a script and paste the complete file before saving. When updating, verify its identity and version. When migrating from the original project, disable duplicate older scripts.
4. Refresh the target website and check the features described in the script's documentation.

Install the complete built `.user.js`, not `src/main.ts` or an individual Svelte component. Release and installation links maintained in this repository identify this project's builds. Original-project listings are historical references and may not include these changes.

## Getting started from source

### Requirements

- Git.
- Node.js 22.12+ within the 22.x line, or Node.js 24.x. Release workflows use Node.js 22.
- pnpm 10.
- A browser and userscript manager for acceptance checks.

If Corepack is available in your environment, replace `pnpm` below with `corepack pnpm@10.34.7` to use a specific pnpm version without relying on a global installation.

### Clone and install dependencies

```sh
git clone https://github.com/liliujie2026/Userscripts.git
cd Userscripts
pnpm install --frozen-lockfile
```

Install dependencies at the repository root. The [pnpm workspace](./pnpm-workspace.yaml) links scripts and shared packages. For an existing checkout, use its repository root; in a Git worktree, this is the working directory containing `pnpm-workspace.yaml`.

### Development and builds

For LeetCode Toolkit:

```sh
pnpm --filter leetcode-toolkit dev
pnpm --filter leetcode-toolkit build
```

After starting the development server, follow the Vite / vite-plugin-monkey terminal instructions to install the development script in your manager, then open the target site. For production, install the `.user.js` generated in the script's `dist/` directory.

Use the same filtering pattern for the other scripts:

```sh
pnpm --filter nowcoder-toolkit dev
pnpm --filter nowcoder-toolkit build
pnpm --filter redirect-to-npmx dev
pnpm --filter redirect-to-npmx build
```

You can also enter an individual script directory and run `pnpm dev` or `pnpm build`. The former starts a development server; the latter generates release files.

## Repository structure

```text
Userscripts/
├── userscripts/
│   ├── leetcode-toolkit/     # LeetCode enhancements and content export
│   ├── nowcoder-toolkit/     # NowCoder practice problem export
│   └── redirect-to-npmx/    # npm website redirect
├── packages/
│   ├── components/          # Shared Svelte button components
│   └── utils/               # DOM, Markdown, image, download and Notebook tools
├── .github/workflows/       # GitHub Releases triggered by script-specific tags
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── LICENSE
```

This is a pnpm monorepo. Scripts are built with TypeScript, Vite and vite-plugin-monkey. The LeetCode and NowCoder interfaces use Svelte 5. Shared packages are consumed as workspace source; they are neither separately installed browser scripts nor published public npm packages.

- [Shared components](./packages/components/README-en.md)
- [Shared utilities](./packages/utils/README-en.md)

Every documented directory uses `README.md` for Chinese and `README-en.md` for its English counterpart.

## Validation and quality checks

Run from the repository root:

```sh
pnpm --filter leetcode-toolkit test
pnpm --filter leetcode-toolkit check
pnpm --filter leetcode-toolkit lint
pnpm --filter leetcode-toolkit build
```

LeetCode Toolkit tests cover article sources, rich-text and DOM conversion, copy / download coordination and toolbar lifecycle. The default suite does not contact live websites. Public API integration tests require explicit opt-in; see [LeetCode development checks](./userscripts/leetcode-toolkit/README-en.md#development-and-validation).

NowCoder provides `pnpm --filter nowcoder-toolkit check`. The npm redirect script runs TypeScript checking as part of `build`. These scripts currently do not have the same dedicated regression coverage as LeetCode Toolkit.

Builds, type checks and simulated DOM tests do not replace browser acceptance checks. Before releasing, install the production artifact and inspect target pages, copied / downloaded content, navigation and recovery after failures.

## Releases and versioning

Each script reads its version from its own `package.json`. Current automated release entry points are:

| Script           | Git tag pattern                         | Release process                                                               |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| LeetCode Toolkit | `leetcode-v<version>`                   | [LeetCode Release workflow](./.github/workflows/leetcode-toolkit-release.yml) |
| NowCoder Toolkit | `nowcoder-v<version>`                   | [NowCoder Release workflow](./.github/workflows/nowcoder-toolkit-release.yml) |
| Redirect to npmx | No dedicated tag-triggered workflow yet | Build locally; maintainers can publish the artifact as needed                 |

Release sequence: update the script version and documentation, run checks and browser acceptance, commit to this repository, push the matching version tag, and inspect Actions and the Release artifact. The tag version should match the package version.

`node_modules/` and `dist/` are excluded from source commits. Existing workflows only build and publish GitHub Releases; they do not update Greasy Fork automatically. For Greasy Fork, publish the complete `.user.js` from the same version and maintain the installation link in this project's documentation.

## Contributing and reporting issues

Report problems in [this repository's Issues](https://github.com/liliujie2026/Userscripts/issues), or open a Pull Request targeting this repository's `main` branch.

Include the script version, browser and manager versions, page URL, reproduction steps, expected and actual behavior. For export problems, identify the missing paragraph, code or formula and include the relevant console error.

Before submitting changes, run checks appropriate to their scope, preserve the behavior of other scripts, and update both language versions of the documentation. Put new scripts in `userscripts/` and reusable capabilities in `packages/`. Keep site-specific DOM and content adapters within their scripts.

## Dependencies and third-party data

Independent maintenance means this repository controls its own features, versions and releases without obtaining updates from the original project. It still uses third-party libraries such as Vite, Svelte and Turndown. Some built scripts load libraries through jsDelivr `@require` directives.

LeetCode difficulty ratings and screenshot lookup also use these separate data projects:

- [LeetCode Problem Rating](https://github.com/zerotrac/leetcode_problem_rating)
- [LeetCode Screenshotter](https://github.com/akhilkammila/leetcode-screenshotter)

Availability of these datasets and CDNs, data changes and target-site structure changes can affect related features. See each script's documentation for the specific boundaries.

## Origin and license

This repository originated from [eclipher/Userscripts](https://github.com/eclipher/Userscripts) and is now independently maintained by liliujie2026. The original author eclipher's contributions, copyright notice and project attribution are retained. Original-project links document the history and acknowledge its work; issue tracking and releases for this project take place here.

This project retains the [MIT license](./LICENSE). Preserve applicable copyright and license notices when distributing source or built artifacts. Third-party libraries and datasets remain subject to their own licenses and terms.
