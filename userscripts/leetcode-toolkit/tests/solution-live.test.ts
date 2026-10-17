// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://leetcode.cn/"}

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { resolveSolutionSource } from "../src/lib/solution-source";
import { formatSolutionDocument } from "../src/lib/solution-export";

// Opt-in smoke checks against public articles. Normal tests remain offline.
describe.skipIf(process.env.LEETCODE_LIVE !== "1")(
    "public CN article integration",
    () => {
        beforeAll(() => {
            // Node fetch requires its own AbortSignal, rather than jsdom's DOM
            // implementation. Browser production code uses matching native APIs.
            vi.stubGlobal(
                "AbortController",
                transferableAbortController().constructor,
            );
        });
        afterAll(() => vi.unstubAllGlobals());
        it("exports an official article through the current same-origin API", async () => {
            history.replaceState(null, "", "/problems/two-sum/editorial/");
            const source = await resolveSolutionSource({ kind: "editorial" });
            const document = formatSolutionDocument(source);
            expect(source.source).toBe("graphql");
            expect(document.length).toBeGreaterThan(500);
            expect(document).toMatch(/```(?:c\+\+|cpp|java|python)/i);
            expect(document).toContain("[Source](https://leetcode.cn/");
        }, 15000);

        it("exports a published rich-text community article without a rendered page", async () => {
            history.replaceState(
                null,
                "",
                "/problems/two-sum/solution/malloc-freede-shi-yong-by-xfq-e80j/",
            );
            const source = await resolveSolutionSource({ kind: "community" });
            const document = formatSolutionDocument(source);
            expect(source.source).toBe("graphql");
            expect(document).toContain("```c");
            expect(document).toContain("malloc");
            expect(document).not.toContain("slateId");
            expect(document).not.toContain("activeTabIndex");
        }, 15000);
    },
);
