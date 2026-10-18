import TurndownService from "turndown";
import { tables } from "@joplin/turndown-plugin-gfm";

export interface SolutionMarkdownOptions {
    baseUrl?: string;
}

function absoluteUrl(value: string | null, baseUrl: string, image = false) {
    if (!value?.trim()) return "";
    try {
        const url = new URL(value.trim(), baseUrl);
        if (["http:", "https:"].includes(url.protocol)) return url.href;
        if (!image && ["mailto:", "tel:"].includes(url.protocol)) {
            return url.href;
        }
        if (image && /^data:image\//i.test(url.href)) return url.href;
    } catch {
        // A malformed URL must not prevent the rest of the article exporting.
    }
    return "";
}

function languageName(value: string) {
    const language = value.trim().toLowerCase();
    const aliases: Record<string, string> = {
        "c++": "cpp",
        "c#": "csharp",
        python3: "python",
        py: "python",
        js: "javascript",
        ts: "typescript",
        mysql: "sql",
    };
    return aliases[language] ?? language.replace(/[^\w+#.-]/g, "");
}

function codeLanguage(element: Element) {
    for (const candidate of [
        element,
        ...element.querySelectorAll(
            "code, [class*='language-'], [class*='lang-']",
        ),
    ]) {
        const explicit =
            candidate.getAttribute("data-language") ??
            candidate.getAttribute("data-lang");
        if (explicit) return languageName(explicit);
        const match = candidate.className?.match?.(
            /(?:^|\s)(?:language|lang)-([^\s]+)/,
        );
        if (match) return languageName(match[1]);
    }
    return "";
}

function codeText(element: Element): string {
    const copy = element.cloneNode(true) as Element;
    copy.querySelectorAll(
        ".line-numbers-rows, .linenumber, .line-number",
    ).forEach((node) => node.remove());
    const read = (node: Node): string => {
        if (node.nodeType === 3) return node.textContent ?? "";
        if (node.nodeType !== 1) return "";
        const el = node as Element;
        if (el.tagName === "BR") return "\n";
        const text = [...el.childNodes].map(read).join("");
        return /^(DIV|LI)$/.test(el.tagName) && !text.endsWith("\n")
            ? text + "\n"
            : text;
    };
    return read(copy)
        .replace(/\r\n?/g, "\n")
        .replace(/^\n/, "")
        .replace(/\n+$/, "");
}

function fencedCode(code: string, language = "") {
    const longest = Math.max(
        0,
        ...Array.from(code.matchAll(/`+/g), (match) => match[0].length),
    );
    const fence = "`".repeat(Math.max(3, longest + 1));
    return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
}

/** The CN Slate renderer uses div wrappers for headings, list items and code
 * tabs. Normalize its public DOM markers before applying ordinary HTML rules.
 */
function normalizeSlate(root: Element) {
    for (const heading of root.querySelectorAll(
        '[data-node-type^="Heading"]',
    )) {
        const level = heading
            .getAttribute("data-node-type")
            ?.match(/^Heading([1-6])$/)?.[1];
        if (!level) continue;
        const replacement = root.ownerDocument.createElement(`h${level}`);
        replacement.append(...heading.childNodes);
        heading.replaceWith(replacement);
    }

    for (const wrapper of root.querySelectorAll(
        '[data-node-type="BlockQuote"]',
    )) {
        const quote = wrapper.querySelector("blockquote");
        if (quote) {
            wrapper.replaceWith(quote);
        } else {
            const replacement = root.ownerDocument.createElement("blockquote");
            replacement.append(...wrapper.childNodes);
            wrapper.replaceWith(replacement);
        }
    }

    for (const wrapper of root.querySelectorAll(
        '[data-node-type="BulletedList"], [data-node-type="OrderedList"], [data-node-type="ListItem"]',
    )) {
        const tag =
            wrapper.getAttribute("data-node-type") === "ListItem"
                ? "li"
                : wrapper.getAttribute("data-node-type") === "OrderedList"
                  ? "ol"
                  : "ul";
        const list = wrapper.querySelector(tag);
        if (!list) continue;
        if (tag === "li") {
            const marker = list.firstElementChild;
            if (marker?.getAttribute("contenteditable") === "false")
                marker.remove();
        }
        wrapper.replaceWith(list);
    }

    for (const block of root.querySelectorAll('[data-node-type="CodeBlock"]')) {
        const toolbar = block.querySelector(
            ':scope > [data-slate-node="element"] > [contenteditable="false"]',
        );
        if (!toolbar) continue;
        const labels = [...(toolbar.firstElementChild?.children ?? [])].map(
            (label) => label.textContent?.trim() ?? "",
        );
        const tabs = block.querySelectorAll('[data-node-type="CodeTab"]');
        tabs.forEach((tab, index) => {
            const pre = tab.querySelector("pre");
            if (pre && labels[index]) {
                pre.setAttribute("data-language", labels[index]);
            }
        });
        toolbar.remove();
    }
    root.querySelectorAll("[data-slate-zero-width]").forEach((element) =>
        element.remove(),
    );
}

function replaceMath(root: Element) {
    const document = root.ownerDocument;
    const replace = (element: Element, source: string, display: boolean) => {
        const replacement = document.createElement(display ? "div" : "span");
        replacement.setAttribute(
            "data-solution-math",
            display ? "block" : "inline",
        );
        replacement.textContent = source;
        element.replaceWith(replacement);
    };

    // MathJax 2 keeps the authoritative TeX in a script beside its rendered DOM.
    root.querySelectorAll('script[type^="math/tex"]').forEach((script) => {
        const previous = script.previousElementSibling;
        if (previous?.matches(".MathJax, .MathJax_Display, mjx-container")) {
            const preview = previous.previousElementSibling;
            if (preview?.matches(".MathJax_Preview")) preview.remove();
            previous.remove();
        }
        replace(
            script,
            script.textContent?.trim() ?? "",
            /mode\s*=\s*display/i.test(script.getAttribute("type") ?? ""),
        );
    });

    const selector = [
        ".katex-display",
        ".katex",
        "mjx-container",
        ".MathJax_Display",
        ".MathJax",
        "math",
        ".math",
        ".maths",
        ".math-tex",
        "[data-tex]",
        "[data-latex]",
        '[data-node-type="LatexBlock"]',
        '[data-node-type="Latex"]',
    ].join(", ");
    for (const element of root.querySelectorAll(selector)) {
        // Replacing the outer formula also removes its alternative renderings.
        if (!root.contains(element) || element.closest("pre, code")) continue;
        const annotation = element.querySelector(
            'annotation[encoding="application/x-tex"], annotation[encoding="application/x-latex"]',
        );
        let source =
            element.getAttribute("data-tex") ??
            element.getAttribute("data-latex") ??
            annotation?.textContent ??
            element.textContent ??
            "";
        source = source.trim();
        if (!source) continue;
        let display =
            element.matches(
                '.katex-display, .MathJax_Display, div.math, div.maths, div.math-tex, [data-node-type="LatexBlock"]',
            ) ||
            element.getAttribute("display") === "block" ||
            element.getAttribute("display") === "true";
        if (source.startsWith("$$") && source.endsWith("$$")) {
            display = true;
            source = source.slice(2, -2).trim();
        } else if (source.startsWith("\\[") && source.endsWith("\\]")) {
            display = true;
            source = source.slice(2, -2).trim();
        } else if (source.startsWith("\\(") && source.endsWith("\\)")) {
            source = source.slice(2, -2).trim();
        } else if (source.startsWith("$") && source.endsWith("$")) {
            source = source.slice(1, -1).trim();
        }
        replace(element, source, display);
    }
}

function prepareIframes(source: Element, copy: Element, baseUrl: string) {
    const originals = source.matches("iframe")
        ? [source as HTMLIFrameElement]
        : [...source.querySelectorAll("iframe")];
    copy.querySelectorAll("iframe").forEach((iframe, index) => {
        const original = originals[index] as HTMLIFrameElement;
        const container = copy.ownerDocument.createElement("div");
        const url = absoluteUrl(
            original.getAttribute("src") || original.getAttribute("data-src"),
            baseUrl,
        );
        if (url) {
            const link = copy.ownerDocument.createElement("a");
            link.href = url;
            link.textContent =
                original.title ||
                (url.includes("playground")
                    ? "LeetCode Playground"
                    : "Embedded content");
            const paragraph = copy.ownerDocument.createElement("p");
            paragraph.append(link);
            container.append(paragraph);
        }

        // Read only documents already available to this page. Never wait for a
        // load event, navigate frames, or click a language/slide control.
        try {
            const frameDocument = original.contentDocument;
            if (
                frameDocument?.body &&
                (frameDocument.URL !== "about:blank" ||
                    original.hasAttribute("srcdoc"))
            ) {
                const seen = new Set<string>();
                const blocks = frameDocument.querySelectorAll(
                    "pre, textarea[name='lc-codemirror']",
                );
                const codeBlocks = blocks.length
                    ? [...blocks]
                    : [
                          ...frameDocument.querySelectorAll(
                              ".CodeMirror-code, .view-lines",
                          ),
                      ];
                for (const block of codeBlocks) {
                    const value =
                        block.tagName === "TEXTAREA"
                            ? (block as HTMLTextAreaElement).value
                            : codeText(block);
                    if (!value || seen.has(value)) continue;
                    seen.add(value);
                    const pre = copy.ownerDocument.createElement("pre");
                    const code = copy.ownerDocument.createElement("code");
                    const language = codeLanguage(block);
                    if (language) code.className = `language-${language}`;
                    code.textContent = value;
                    pre.append(code);
                    container.append(pre);
                }
            }
        } catch {
            // Cross-origin and sandboxed frames remain a usable source link.
        }
        if (!container.childNodes.length) {
            container.textContent =
                original.title || "Embedded content unavailable";
        }
        iframe.replaceWith(container);
    });
}

function prepareImages(source: Element, copy: Element, baseUrl: string) {
    const originals = source.matches("img")
        ? [source as HTMLImageElement]
        : [...source.querySelectorAll("img")];
    copy.querySelectorAll("img").forEach((image, index) => {
        const original = originals[index] as HTMLImageElement;
        const src =
            original.getAttribute("data-src") ||
            original.getAttribute("data-original") ||
            original.getAttribute("data-lazy-src") ||
            original.currentSrc ||
            original.getAttribute("src") ||
            (original.getAttribute("srcset") ?? "")
                .split(",")[0]
                .trim()
                .split(/\s+/)[0];
        image.setAttribute("src", absoluteUrl(src, baseUrl, true));
    });
}

function markdownDestination(url: string) {
    return url.replace(/[\\()]/g, "\\$&");
}

/** Convert the currently available article DOM without changing the live page.
 * Images retain absolute URLs; conversion never performs a network request.
 */
export function solutionToMarkdown(
    source: Element,
    { baseUrl = source.ownerDocument.baseURI }: SolutionMarkdownOptions = {},
): string {
    // An inert document has no browsing context. Normalizing image/frame URLs
    // here also avoids starting resource loads in the user's live document.
    const document = source.ownerDocument.implementation.createHTMLDocument("");
    const copy = document.createElement("div");
    copy.append(document.importNode(source, true));
    prepareIframes(source, copy, baseUrl);
    prepareImages(source, copy, baseUrl);
    normalizeSlate(copy);
    replaceMath(copy);
    copy.querySelectorAll(
        'script, style, template, noscript, button, svg, [role="button"], [aria-hidden="true"], [data-skip-me-turndown="true"]',
    ).forEach((element) => element.remove());

    // GFM requires a header. Add an empty header when the source has only data
    // cells, preserving the first data row instead of turning it into a title.
    copy.querySelectorAll("table").forEach((table) => {
        const firstRow = table.querySelector("tr");
        if (!firstRow || firstRow.querySelector("th")) return;
        const header = copy.ownerDocument.createElement("thead");
        const row = copy.ownerDocument.createElement("tr");
        for (const cell of firstRow.children) {
            const th = copy.ownerDocument.createElement("th");
            th.colSpan = (cell as HTMLTableCellElement).colSpan || 1;
            row.append(th);
        }
        header.append(row);
        table.prepend(header);
    });

    const turndown = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        emDelimiter: "*",
        bulletListMarker: "-",
    });
    turndown.use(tables);
    turndown.addRule("solution-headings", {
        filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
        replacement: (content, node) => {
            const level = Number(node.nodeName.slice(1));
            return `\n\n${"#".repeat(level)} ${content.trim().replace(/\n+/g, " ")}\n\n`;
        },
    });
    turndown.addRule("solution-code", {
        filter: "pre",
        replacement: (_content, node) => {
            const element = node as Element;
            const code = element.querySelector("code") ?? element;
            return fencedCode(codeText(code), codeLanguage(element));
        },
    });
    turndown.addRule("solution-math", {
        filter: (node) => (node as Element).hasAttribute("data-solution-math"),
        replacement: (_content, node) => {
            const tex = node.textContent ?? "";
            return (node as Element).getAttribute("data-solution-math") ===
                "block"
                ? `\n\n$$\n${tex}\n$$\n\n`
                : `$${tex}$`;
        },
    });
    turndown.addRule("solution-images", {
        filter: "img",
        replacement: (_content, node) => {
            const element = node as Element;
            const src = element.getAttribute("src");
            const alt = (element.getAttribute("alt") ?? "")
                .replace(/\n/g, " ")
                .replace(/[\\[\]]/g, "\\$&");
            return src ? `![${alt}](${markdownDestination(src)})` : alt;
        },
    });
    turndown.addRule("solution-links", {
        filter: "a",
        replacement: (content, node) => {
            const element = node as Element;
            const url = absoluteUrl(element.getAttribute("href"), baseUrl);
            const label = content || element.getAttribute("title") || url;
            return url ? `[${label}](${markdownDestination(url)})` : content;
        },
    });
    turndown.addRule("solution-summary", {
        filter: "summary",
        replacement: (_content, node) => {
            const title = (node.textContent ?? "Details")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            return `\n<summary>${title}</summary>\n\n`;
        },
    });
    turndown.addRule("solution-details", {
        filter: "details",
        replacement: (content, node) =>
            `\n\n<details${(node as Element).hasAttribute("open") ? " open" : ""}>\n${content.trim()}\n\n</details>\n\n`,
    });
    turndown.addRule("solution-strikethrough", {
        filter: ["del", "s"],
        replacement: (content) => `~~${content}~~`,
    });
    turndown.addRule("solution-script-position", {
        filter: ["sup", "sub"],
        replacement: (content, node) => {
            const tag = node.nodeName.toLowerCase();
            return `<${tag}>${content}</${tag}>`;
        },
    });
    return turndown.turndown(copy).trim();
}
