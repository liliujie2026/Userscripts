import { GM_setClipboard } from "$";
import { downloadFile } from "$utils/download-file";
import { solutionToMarkdown } from "./solution-markdown";
import {
    resolveSolutionSource,
    type SolutionKind,
    type SolutionSource,
} from "./solution-source";

export function formatSolutionDocument(source: SolutionSource): string {
    const body =
        source.markdown?.trim() ??
        (source.content
            ? solutionToMarkdown(source.content, { baseUrl: source.url }).trim()
            : "");
    if (!body) throw new Error("This solution contains no exportable content.");
    const title = source.title.replace(/[\r\n]+/g, " ").trim();
    return `# ${title || "LeetCode Solution"}\n\n[Source](${source.url})\n\n${body}\n`;
}

export function solutionFilename(title: string): string {
    return (
        title
            .replace(/[<>:"/\\|?*]/g, "_")
            .replace(/\p{Cc}/gu, "_")
            .replace(/[. ]+$/g, "")
            .trim()
            .slice(0, 160) || "LeetCode Solution"
    );
}

/** GM clipboard writes survive the asynchronous article request. Native
 * Clipboard API is a fallback for managers without this capability. */
export async function copySolutionMarkdown(markdown: string): Promise<void> {
    if (typeof GM_setClipboard === "function") {
        try {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(
                    () => reject(new Error("Clipboard write timed out.")),
                    3000,
                );
                try {
                    GM_setClipboard(markdown, "text", () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                } catch (error) {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
            return;
        } catch {
            // Some managers expose this API without supporting the callback.
        }
    }
    if (!navigator.clipboard?.writeText) {
        throw new Error(
            "Clipboard is unavailable. Use Download Markdown instead.",
        );
    }
    await navigator.clipboard.writeText(markdown);
}

export async function exportSolution(
    kind: SolutionKind,
    action: "copy" | "download",
): Promise<void> {
    const url = location.href;
    const source = await resolveSolutionSource({ kind, url });
    const markdown = formatSolutionDocument(source);
    if (location.href !== url) {
        throw new Error(
            "The solution changed while exporting. Please try again.",
        );
    }
    if (action === "copy") {
        await copySolutionMarkdown(markdown);
    } else {
        downloadFile(
            new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
            solutionFilename(source.title),
            "md",
        );
    }
}
