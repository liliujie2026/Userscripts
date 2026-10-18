import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    copySolutionMarkdown,
    exportSolution,
    formatSolutionDocument,
    solutionFilename,
} from "../src/lib/solution-export";

const mocks = vi.hoisted(() => ({
    clipboard: vi.fn(),
    source: vi.fn(),
    download: vi.fn(),
}));
vi.mock("$", () => ({ GM_setClipboard: mocks.clipboard }));
vi.mock("../src/lib/solution-source", () => ({
    resolveSolutionSource: mocks.source,
}));
vi.mock("$utils/download-file", () => ({ downloadFile: mocks.download }));

beforeEach(() => {
    history.replaceState(null, "", "/problems/two-sum/solutions/1/example/");
    mocks.clipboard.mockReset();
    mocks.clipboard.mockImplementation((_text, _type, done) => done());
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
});

describe("solution document", () => {
    it("preserves raw Markdown, adds article title and source", () => {
        const markdown = "## Approach\n\n```python\nprint('ok')\n```\n\n$x^2$";
        const result = formatSolutionDocument({
            markdown,
            title: "Two Sum",
            url: location.href,
            source: "graphql",
        });
        expect(result).toContain(markdown);
        expect(result).toContain(`# Two Sum\n\n[Source](${location.href})`);
    });
    it("rejects an empty article and sanitizes download filenames", () => {
        expect(() =>
            formatSolutionDocument({
                markdown: " ",
                title: "empty",
                url: location.href,
                source: "graphql",
            }),
        ).toThrow();
        expect(solutionFilename("A/B: C?")).toBe("A_B_ C_");
    });
});

describe("export completion", () => {
    it("waits for the manager clipboard acknowledgement", async () => {
        let done: (() => void) | undefined;
        mocks.clipboard.mockImplementation((_text, _type, callback) => {
            done = callback;
        });
        const completed = vi.fn();
        const task = copySolutionMarkdown("# Article").then(completed);
        await Promise.resolve();
        expect(completed).not.toHaveBeenCalled();
        done?.();
        await task;
        expect(completed).toHaveBeenCalledOnce();
    });
    it("falls back to native clipboard and propagates permission failure", async () => {
        mocks.clipboard.mockImplementation(() => {
            throw new Error("unsupported");
        });
        await copySolutionMarkdown("text");
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("text");
        vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
            new Error("denied"),
        );
        await expect(copySolutionMarkdown("text")).rejects.toThrow("denied");
    });
    it("does not copy or download a stale article after navigation", async () => {
        mocks.source.mockImplementation(async () => {
            history.pushState(null, "", "/problems/two-sum/solutions/2/next/");
            return {
                markdown: "old",
                title: "old",
                url: "old",
                source: "graphql",
            };
        });
        await expect(exportSolution("community", "copy")).rejects.toThrow(
            "changed",
        );
        expect(mocks.clipboard).not.toHaveBeenCalled();
        expect(mocks.download).not.toHaveBeenCalled();
    });
    it("downloads a Markdown blob with a safe filename", async () => {
        mocks.source.mockResolvedValue({
            markdown: "answer",
            title: "A/B",
            url: location.href,
            source: "graphql",
        });
        await exportSolution("community", "download");
        expect(mocks.download).toHaveBeenCalledWith(
            expect.any(Blob),
            "A_B",
            "md",
        );
    });
});
