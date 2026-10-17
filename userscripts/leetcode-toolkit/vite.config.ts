import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import monkey, { cdn } from "vite-plugin-monkey";
import tsconfigPaths from "vite-tsconfig-paths";
import { readFileSync } from "node:fs";

const projectLicense = readFileSync(
    new URL("../../LICENSE", import.meta.url),
    "utf8",
);
export default defineConfig({
    build: {
        minify: false,
        rollupOptions: {
            output: {
                banner: `/*
${projectLicense}

Modified version maintained by liliujie2026.
Upstream: https://github.com/eclipher/Userscripts

Bundled dependencies:
- svelte@5.38.6: https://www.npmjs.com/package/svelte
- remeda@2.30.0: https://www.npmjs.com/package/remeda
- toast-rack@0.2.1: https://www.npmjs.com/package/toast-rack
- @joplin/turndown-plugin-gfm@1.0.63:
  https://www.npmjs.com/package/@joplin/turndown-plugin-gfm
- @sec-ant/gm-fetch@1.2.3:
  https://www.npmjs.com/package/@sec-ant/gm-fetch
*/`,
            },
        },
    },
    plugins: [
        svelte(),
        tsconfigPaths(),
        monkey({
            entry: "src/main.ts",
            build: {
                externalGlobals: {
                    compressorjs: cdn.jsdelivr("Compressor"),
                    turndown: cdn.jsdelivr(
                        "TurndownService",
                        "lib/turndown.browser.umd.js",
                    ),
                },
            },
            userscript: {
                // version is fetched from package.json
                name: {
                    "": "LeetCode Toolkit",
                    "zh-CN": "LeetCode工具箱",
                },
                description: {
                    "": "Copy or download official and community solutions as Markdown, export problems as Jupyter Notebook, format code, enable IntelliSense and display problem ratings.",
                    "zh-CN":
                        "复制/下载官方及社区题解 Markdown | 题目导出 Jupyter Notebook | 保存时格式化 | 自动补全 | 题目评分",
                },
                author: "eclipher; liliujie2026",
                // Keep this independent project's identity stable across releases.
                namespace:
                    "https://github.com/liliujie2026/Userscripts/leetcode-toolkit",
                homepage:
                    "https://github.com/liliujie2026/Userscripts/tree/main/userscripts/leetcode-toolkit",
                supportURL:
                    "https://github.com/liliujie2026/Userscripts/issues",
                include: [
                    /https?:\/\/leetcode\.com\/problems\/.*/,
                    /https?:\/\/leetcode\.cn\/problems\/.*/,
                    /https?:\/\/leetcode\.com\/explore\/.*\/card\/.*/,
                ],
                // don't activate script on solution submission page
                exclude: [
                    "*://leetcode.com/problems/*/post-solution/*",
                    "*://leetcode.cn/problems/*/post-solution/*", // untested
                ],
                license: "MIT",
                icon: "https://www.google.com/s2/favicons?sz=64&domain=leetcode.com",
                resource: {
                    editorials:
                        "https://raw.githubusercontent.com/akhilkammila/leetcode-screenshotter/refs/heads/main/ReadMe.md",
                    ratings:
                        "https://raw.githubusercontent.com/zerotrac/leetcode_problem_rating/refs/heads/main/ratings.txt",
                },
                connect: ["assets.leetcode.com", "*"],
                grant: ["GM_xmlhttpRequest", "GM_setClipboard"],
            },
        }),
    ],
});
