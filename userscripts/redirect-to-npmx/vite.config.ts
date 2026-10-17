import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        monkey({
            entry: "src/main.ts",
            userscript: {
                name: "Redirect to npmx",
                description:
                    "A simple userscript that redirects npmjs.com to npmx.dev for a better experience.",
                author: "eclipher; liliujie2026",
                namespace:
                    "https://github.com/liliujie2026/Userscripts/redirect-to-npmx",
                homepage:
                    "https://github.com/liliujie2026/Userscripts/tree/main/userscripts/redirect-to-npmx",
                supportURL:
                    "https://github.com/liliujie2026/Userscripts/issues",
                match: ["*://npmjs.com/*", "*://www.npmjs.com/*"],
                "run-at": "document-start",
                license: "MIT",
            },
        }),
    ],
});
