import { getSolutionRoute, type SolutionKind } from "./solution-source";

type RenderToolbar = (host: HTMLElement, kind: SolutionKind) => () => void;

/** Independent of LeetCode's tab text, generated CSS classes and React roots. */
export function watchSolutionToolbar(
    render: RenderToolbar,
    doc: Document = document,
    win: Window = window,
): () => void {
    let host: HTMLElement | null = null;
    let dispose: (() => void) | undefined;
    let mountedUrl = "";
    const refresh = () => {
        const url = win.location.href;
        const { kind } = getSolutionRoute(url);
        const article = kind === "editorial" || kind === "community";
        if (host?.isConnected && mountedUrl === url && article) return;
        dispose?.();
        dispose = undefined;
        host?.remove();
        host = null;
        mountedUrl = url;
        if (!article) return;
        host = doc.createElement("div");
        host.id = "leetcode-toolkit-solution-export";
        host.setAttribute("data-leetcode-toolkit-toolbar", "true");
        host.style.cssText =
            "position:fixed;right:16px;bottom:16px;z-index:2147483646;";
        doc.documentElement.append(host);
        dispose = render(host, kind);
    };
    // URL polling also covers pushState/replaceState in managers which do not
    // implement Tampermonkey's urlchange event. No page history API is patched.
    const timer = win.setInterval(refresh, 500);
    win.addEventListener("popstate", refresh);
    win.addEventListener("urlchange", refresh);
    refresh();
    return () => {
        win.clearInterval(timer);
        win.removeEventListener("popstate", refresh);
        win.removeEventListener("urlchange", refresh);
        dispose?.();
        host?.remove();
    };
}
