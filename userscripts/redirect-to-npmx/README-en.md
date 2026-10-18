# Redirect to npmx

[简体中文](./README.md) · [Project home](../../README-en.md) · [Report an issue](https://github.com/liliujie2026/Userscripts/issues)

A browser userscript dedicated to redirection: when opening `npmjs.com` or `www.npmjs.com`, it changes the URL hostname to `npmx.dev`. The current package version is **1.0.0**.

This script is maintained independently in [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts), originating from [eclipher/Userscripts](https://github.com/eclipher/Userscripts). Use the current repository for installation, issue reports, and future releases.

## Behavior and URL scope

Matches these URLs:

```text
*://npmjs.com/*
*://www.npmjs.com/*
```

At `document-start`, the script attempts to stop the original page from loading, parses its address with `URL`, replaces only `hostname`, and redirects with `location.replace()`. The original protocol, port, path, query parameters, and fragment are preserved. The current page is replaced without adding a separate history entry for the original page.

For example:

```text
https://www.npmjs.com/package/typescript?activeTab=readme#readme
→ https://npmx.dev/package/typescript?activeTab=readme#readme
```

This illustrates the URL transformation, not a guarantee that the destination supports every original path, parameter, or fragment. The script does not validate the destination or automatically fall back if it fails. It does not run on other websites, rewrite their npm links in advance, or change the npm CLI registry configuration.

## Installation

1. Install and enable a userscript manager, such as [Tampermonkey](https://www.tampermonkey.net/).
2. Build the `.user.js` file from source as described below, then import its complete contents into the manager or paste them into a new script and save.
3. If this project's [GitHub Releases](https://github.com/liliujie2026/Userscripts/releases) later provides an artifact for this script, you may install the complete `.user.js` file from that release instead.
4. Disable duplicate redirection scripts, visit an npm package page, and check that its address changes to `npmx.dev`.

This repository currently has no automatic release workflow for this script. The original author's Greasy Fork entry is not an installation or update channel for this maintained version. An independent listing will be announced in this repository when its URL is available.

## Build from source and development

Run from the repository root. Prepare Node.js and pnpm using the [root development instructions](../../README-en.md#getting-started-from-source):

```sh
# Install workspace dependencies
pnpm install --frozen-lockfile

# Check TypeScript and build the userscript
pnpm --filter redirect-to-npmx build

# Start Vite and follow its output to install the development script
pnpm --filter redirect-to-npmx dev
```

The production artifact is `userscripts/redirect-to-npmx/dist/redirect-to-npmx.user.js`. The package's `build` command runs `tsc && vite build`; there is no separate `test` or `check` command.

| Path                                 | Responsibility                                          |
| ------------------------------------ | ------------------------------------------------------- |
| [`src/main.ts`](./src/main.ts)       | Stops loading, replaces the hostname, and redirects.    |
| [`vite.config.ts`](./vite.config.ts) | Userscript URL matches, execution timing, and metadata. |
| [`package.json`](./package.json)     | Package version, dependencies, and build commands.      |

`dist` contains build output and does not need to be committed to Git. Independent releases use this repository's script homepage, issue tracker, and namespace. Avoid enabling older redirection scripts from other sources at the same time.

## Usage and acceptance checks

1. Enable only this script and visit `https://www.npmjs.com/package/typescript`.
2. Verify that the address changes to `https://npmx.dev/package/typescript` and check that the destination renders correctly.
3. Try an npm URL containing query parameters or a fragment, and verify that the redirected address retains them.
4. Open another website containing an npm link and confirm that the link is not rewritten in advance. Redirection starts after clicking through to a matched npm URL.
5. To view the original npm website, disable the script and open the original address again.

A successful build confirms TypeScript and bundling only. Destination availability and path compatibility require an actual browser check.

## Troubleshooting and limitations

| Symptom                                    | What to check                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| The browser stays on the npm page          | Check that the manager is enabled, permissions allow execution, and the hostname is matched.                             |
| The destination is an error page           | Check `npmx.dev` availability and whether it supports the original npm path; the script has no path mapping or fallback. |
| The original npm website cannot be reached | Temporarily disable the script and reopen the original address manually.                                                 |
| Redirect loops or conflicting behavior     | Disable other npm redirection scripts or related browser extensions and try again.                                       |

## Related approach

[wolfcreative/npmx-link-router](https://github.com/wolfcreative/npmx-link-router), referenced in the original project's documentation, is another approach focused on rewriting npm links in pages before navigation. This script changes the address only after entering a matched npm page. Their execution scope and timing differ. This project does not depend on that alternative; consult its repository for current functionality and permissions.

## Origin and license

- Original project: [eclipher/Userscripts](https://github.com/eclipher/Userscripts), credited as the implementation source.
- Current maintenance: [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts), independently deciding changes and releases without depending on synchronization with the original project.
- Provided under the [MIT license](../../LICENSE), preserving the original copyright and license notice. Third-party dependencies retain their respective licenses.
