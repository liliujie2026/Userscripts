import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    download: vi.fn(),
    loading: vi.fn(() => "loading-id"),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
}));

vi.mock("$utils/download-file", () => ({ downloadFile: mocks.download }));
vi.mock("$lib/toast", () => ({ toaster: mocks }));

import { downloadEditorial } from "./editorial-saver";

describe("downloadEditorial compatibility entry point", () => {
    it("waits for the actual export before resolving and dismisses loading", async () => {
        let resolveArticle!: (element: Element) => void;
        const pending = new Promise<Element>((resolve) => {
            resolveArticle = resolve;
        });
        const task = downloadEditorial(
            () => pending,
            async () => "Example",
        );
        expect(mocks.download).not.toHaveBeenCalled();
        const element = document.createElement("article");
        element.innerHTML = "<p>Explanation</p>";
        resolveArticle(element);
        await task;
        expect(mocks.download).toHaveBeenCalledWith(
            expect.any(Blob),
            "Example",
            "md",
        );
        expect(mocks.success).toHaveBeenCalledOnce();
        expect(mocks.error).not.toHaveBeenCalled();
        expect(mocks.dismiss).toHaveBeenCalledWith("loading-id");
    });

    it("propagates export failure and dismisses loading without downloading", async () => {
        await expect(
            downloadEditorial(
                async () => {
                    throw new Error("Article unavailable");
                },
                async () => "Example",
            ),
        ).rejects.toThrow("Article unavailable");
        expect(mocks.download).not.toHaveBeenCalled();
        expect(mocks.error).toHaveBeenCalledOnce();
        expect(mocks.success).not.toHaveBeenCalled();
        expect(mocks.dismiss).toHaveBeenCalledWith("loading-id");
    });

    it("does not create a successful empty Markdown download", async () => {
        await expect(
            downloadEditorial(
                async () => document.createElement("article"),
                async () => "Empty",
            ),
        ).rejects.toThrow("no exportable content");
        expect(mocks.download).not.toHaveBeenCalled();
        expect(mocks.error).toHaveBeenCalledOnce();
        expect(mocks.dismiss).toHaveBeenCalledWith("loading-id");
    });
});
