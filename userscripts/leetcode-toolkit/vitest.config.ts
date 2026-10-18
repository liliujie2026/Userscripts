import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";

export default defineConfig({
    plugins: [svelte()],
    resolve: {
        conditions: ["browser"],
        alias: {
            $: fileURLToPath(
                new URL("./tests/userscript-api.ts", import.meta.url),
            ),
            $lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
            $utils: fileURLToPath(
                new URL("../../packages/utils/src", import.meta.url),
            ),
            $components: fileURLToPath(
                new URL("../../packages/components/src", import.meta.url),
            ),
        },
    },
    test: {
        environment: "jsdom",
        environmentOptions: {
            jsdom: { url: "https://leetcode.cn/problems/two-sum/description/" },
        },
        include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
        restoreMocks: true,
        clearMocks: true,
    },
});
