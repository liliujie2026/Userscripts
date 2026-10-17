import { downloadFile } from "$utils/download-file";
import { toaster } from "$lib/toast";
import { solutionToMarkdown } from "./solution-markdown";

/** Export only the article content currently available to the page. */
export async function scrapeEditorial(editorialEl: Element): Promise<string> {
    return solutionToMarkdown(editorialEl);
}

/** Compatibility entry point used by Explore articles. Awaiting this function
 * now waits for the actual download and propagates failures to the caller.
 */
export async function downloadEditorial(
    editorialFinder: () => Promise<Element>,
    titleFinder: () => Promise<string>,
): Promise<void> {
    const toastId = toaster.loading("Exporting article...");
    try {
        const [editorialEl, title] = await Promise.all([
            editorialFinder(),
            titleFinder(),
        ]);
        const editorial = await scrapeEditorial(editorialEl);
        if (!editorial.trim()) {
            throw new Error("The article contains no exportable content.");
        }
        const blob = new Blob([`# ${title}\n\n`, editorial], {
            type: "text/markdown; charset=UTF-8",
        });
        downloadFile(blob, title, "md");
        toaster.success("Article exported. Downloading...");
    } catch (error) {
        toaster.error(
            "Could not export this article. See the browser console for details.",
        );
        throw error;
    } finally {
        toaster.dismiss(toastId);
    }
}
