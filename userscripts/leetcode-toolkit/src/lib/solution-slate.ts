interface SlateNode {
    type?: string;
    text?: string;
    children?: SlateNode[];
    [key: string]: unknown;
}

export interface SlateMarkdownOptions {
    baseUrl?: string;
}

const INLINE_TYPES = new Set(["Link", "Latex", "InlineCode", "InlineImage"]);

function escapeText(text: string): string {
    return text.replace(/([\\`*_{}[\]<>#$~|])/g, "\\$1");
}

function inlineCode(text: string): string {
    const longest = Math.max(
        0,
        ...Array.from(text.matchAll(/`+/g), (match) => match[0].length),
    );
    const fence = "`".repeat(longest + 1);
    const padding =
        text.startsWith("`") ||
        text.endsWith("`") ||
        (/^ .* $/.test(text) && text.trim())
            ? " "
            : "";
    return `${fence}${padding}${text}${padding}${fence}`;
}

function codeBlock(text: string, language: unknown): string {
    const aliases: Record<string, string> = {
        "c++": "cpp",
        "c#": "csharp",
        python3: "python",
        py: "python",
        js: "javascript",
        ts: "typescript",
    };
    const value =
        typeof language === "string" ? language.trim().toLowerCase() : "";
    const normalized = aliases[value] ?? value.replace(/[^\w+#.-]/g, "");
    const longest = Math.max(
        2,
        ...Array.from(text.matchAll(/`+/g), (match) => match[0].length),
    );
    const fence = "`".repeat(longest + 1);
    return `${fence}${normalized}\n${text.replace(/\r\n?/g, "\n").replace(/\n$/, "")}\n${fence}`;
}

function rawText(node: SlateNode): string {
    return typeof node.text === "string"
        ? node.text
        : (node.children ?? []).map(rawText).join("");
}

function validTree(value: unknown): value is SlateNode[] {
    if (!Array.isArray(value) || !value.length) return false;
    let count = 0;
    const visit = (node: unknown, depth: number): boolean => {
        if (
            ++count > 50000 ||
            depth > 100 ||
            !node ||
            typeof node !== "object" ||
            Array.isArray(node)
        )
            return false;
        const item = node as SlateNode;
        if (typeof item.text === "string") return true;
        return (
            typeof item.type === "string" &&
            Array.isArray(item.children) &&
            item.children.every((child) => visit(child, depth + 1))
        );
    };
    return value.every(
        (node) =>
            node &&
            typeof node === "object" &&
            typeof node.type === "string" &&
            visit(node, 0),
    );
}

/** Serialize the published CN Slate value, including every code tab rather than
 * only the active tab. An unrecognized tree shape falls back to rendered DOM.
 */
export function serializeSolutionSlate(
    value: unknown,
    { baseUrl = "https://leetcode.cn/" }: SlateMarkdownOptions = {},
): string | undefined {
    let nodes: unknown = value;
    if (typeof value === "string") {
        try {
            nodes = JSON.parse(value);
        } catch {
            return undefined;
        }
    }
    if (!validTree(nodes)) return undefined;
    let unsupportedContent = false;

    const safeUrl = (value: unknown, image = false): string => {
        if (typeof value !== "string" || !value.trim()) return "";
        try {
            const url = new URL(value, baseUrl);
            if (
                ["http:", "https:"].includes(url.protocol) ||
                (!image && ["mailto:", "tel:"].includes(url.protocol)) ||
                (image && /^data:image\//i.test(url.href))
            )
                return url.href.replace(/</g, "%3C").replace(/>/g, "%3E");
        } catch {
            // Preserve a malformed link's text without creating a broken URL.
        }
        return "";
    };

    const isInline = (node: SlateNode) =>
        typeof node.text === "string" || INLINE_TYPES.has(node.type ?? "");
    const flow = (children: SlateNode[]): string => {
        const parts: string[] = [];
        let pending = "";
        const flush = () => {
            if (pending.trim()) parts.push(pending.trim());
            pending = "";
        };
        for (const child of children) {
            if (isInline(child)) pending += render(child);
            else {
                flush();
                const result = render(child);
                if (result.trim()) parts.push(result.trim());
            }
        }
        flush();
        return parts.join("\n\n");
    };

    const list = (node: SlateNode, ordered: boolean): string =>
        (node.children ?? [])
            .map((item, index) => {
                const start = typeof node.start === "number" ? node.start : 1;
                const marker = ordered ? `${start + index}. ` : "- ";
                const text =
                    item.type === "ListItem"
                        ? flow(item.children ?? [])
                        : render(item);
                const lines = text.split("\n");
                return (
                    marker +
                    (lines.shift() ?? "") +
                    lines
                        .map((line) => `\n${" ".repeat(marker.length)}${line}`)
                        .join("")
                );
            })
            .join("\n");

    const image = (node: SlateNode): string => {
        const src = safeUrl(node.src, true);
        const alt = typeof node.alt === "string" ? node.alt : rawText(node);
        const result = src
            ? `![${escapeText(alt)}](<${src}>)`
            : escapeText(alt);
        const href = safeUrl(node.outHref);
        return href && result ? `[${result}](<${href}>)` : result;
    };

    const table = (node: SlateNode): string => {
        const rows = (node.children ?? []).flatMap((child) =>
            child.type === "TableBody" ? (child.children ?? []) : [child],
        );
        if (
            !rows.length ||
            rows.some(
                (row) =>
                    row.type !== "TableRow" ||
                    !row.children?.length ||
                    row.children.some((cell) => cell.type !== "TableCell"),
            )
        ) {
            unsupportedContent = true;
            return "";
        }
        const cells = rows.map((row) => row.children!);
        if (
            cells
                .flat()
                .some((cell) =>
                    [
                        cell.colSpan,
                        cell.rowSpan,
                        cell.colspan,
                        cell.rowspan,
                    ].some(
                        (span) =>
                            (typeof span === "number" ||
                                typeof span === "string") &&
                            Number(span) > 1,
                    ),
                )
        ) {
            unsupportedContent = true;
            return "";
        }
        const width = Math.max(...cells.map((row) => row.length));
        const line = (row: SlateNode[]) =>
            `| ${Array.from({ length: width }, (_, index) =>
                flow(row[index]?.children ?? [])
                    .replace(/(?<!\\)\|/g, "\\|")
                    .replace(/\n+/g, "<br>"),
            ).join(" | ")} |`;
        const alignments = Array.from({ length: width }, (_, index) => {
            switch (cells[0][index]?.align) {
                case "center":
                    return ":---:";
                case "right":
                    return "---:";
                default:
                    return ":---";
            }
        });
        return [
            line(cells[0]),
            `| ${alignments.join(" | ")} |`,
            ...cells.slice(1).map(line),
        ].join("\n");
    };

    const render = (node: SlateNode): string => {
        if (typeof node.text === "string") {
            if (!node.text) return "";
            const hasMarks =
                node.bold ||
                node.italic ||
                node.strikethrough ||
                node.strike ||
                node.underline ||
                node.highlight;
            const leading = hasMarks
                ? (node.text.match(/^\s*/)?.[0] ?? "")
                : "";
            const trailing = hasMarks
                ? (node.text.match(/\s*$/)?.[0] ?? "")
                : "";
            const markedText = hasMarks
                ? node.text.slice(
                      leading.length,
                      node.text.length - trailing.length,
                  )
                : node.text;
            if (!markedText) return node.text;
            let text =
                node.inlineCode || node.code
                    ? inlineCode(markedText)
                    : escapeText(markedText);
            if (node.bold) text = `**${text}**`;
            if (node.italic) text = `*${text}*`;
            if (node.strikethrough || node.strike) text = `~~${text}~~`;
            if (node.underline) text = `<u>${text}</u>`;
            if (node.highlight) text = `<mark>${text}</mark>`;
            return leading + text + trailing;
        }
        const children = node.children ?? [];
        const inline = () => children.map(render).join("");
        const type = node.type ?? "";
        const heading = type.match(/^Heading([1-6])$/);
        if (heading)
            return `${"#".repeat(Number(heading[1]))} ${inline().trim()}`;
        switch (type) {
            case "Paragraph":
                return flow(children);
            case "BlockQuote":
                return flow(children)
                    .split("\n")
                    .map((line) => (line ? `> ${line}` : ">"))
                    .join("\n");
            case "Link": {
                const title =
                    inline() ||
                    (typeof node.title === "string"
                        ? escapeText(node.title)
                        : "");
                const href = safeUrl(node.href ?? node.url);
                return href
                    ? `[${title || escapeText(href)}](<${href}>)`
                    : title;
            }
            case "InlineCode":
                return inlineCode(rawText(node));
            case "Latex":
                return typeof node.tex === "string" && node.tex.trim()
                    ? `$${node.tex.trim()}$`
                    : inline();
            case "LatexBlock":
                return typeof node.tex === "string" && node.tex.trim()
                    ? `$$\n${node.tex.trim()}\n$$`
                    : flow(children);
            case "BulletedList":
                return list(node, false);
            case "NumberedList":
            case "OrderedList":
                return list(node, true);
            case "ListItem":
                return flow(children);
            case "CodeBlock":
                return children.some((child) => child.type === "CodeTab")
                    ? children
                          .map((child) =>
                              child.type === "CodeTab"
                                  ? render(child)
                                  : codeBlock(rawText(child), node.language),
                          )
                          .join("\n\n")
                    : codeBlock(rawText(node), node.language);
            case "CodeTab": {
                const code = codeBlock(rawText(node), node.language);
                const name =
                    typeof node.name === "string" &&
                    node.name.trim() &&
                    node.name.toLowerCase() !==
                        String(node.language ?? "").toLowerCase()
                        ? `**${escapeText(node.name)}**\n\n`
                        : "";
                return name + code;
            }
            case "Image":
            case "InlineImage":
                return image(node);
            case "Gallery": {
                if (
                    !Array.isArray(node.images) ||
                    node.images.some(
                        (src) => typeof src !== "string" || !safeUrl(src, true),
                    )
                ) {
                    unsupportedContent = true;
                    return "";
                }
                return node.images
                    .map((src, index) =>
                        image({ src, alt: `Image ${index + 1}` }),
                    )
                    .join("\n\n");
            }
            case "Video": {
                const src =
                    typeof node.src === "string" &&
                    /^(https?:\/\/|\/\/|\/|\.\.?\/)/i.test(node.src)
                        ? safeUrl(node.src)
                        : "";
                if (!src) {
                    // Some CN videos use an opaque player UUID, not a public URL.
                    unsupportedContent = true;
                    return "";
                }
                const title =
                    typeof node.title === "string" ? node.title : "Video";
                return `[${escapeText(title)}](<${src}>)`;
            }
            case "Table":
                return table(node);
            case "TableBody":
            case "TableRow":
            case "TableCell":
            case "TableContent":
                return flow(children);
            case "Divider":
            case "HorizontalRule":
                return "---";
            default: {
                // Future wrappers retain all text and nested semantic elements.
                const result = flow(children);
                if (
                    !result.trim() &&
                    Object.keys(node).some(
                        (key) => !["type", "children", "slateId"].includes(key),
                    )
                )
                    unsupportedContent = true;
                return result;
            }
        }
    };

    const markdown = flow(nodes).trim();
    return unsupportedContent ? undefined : markdown || undefined;
}
