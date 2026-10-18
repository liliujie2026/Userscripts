import { describe, expect, it } from "vitest";
import { serializeSolutionSlate } from "../src/lib/solution-slate";

const text = (value: string, marks = {}) => ({ text: value, ...marks });
const block = (type: string, children: unknown[], attributes = {}) => ({
    type,
    children,
    ...attributes,
});

describe("published CN Slate serialization", () => {
    it("keeps headings, marked text, inline code and literal Markdown characters", () => {
        const markdown = serializeSolutionSlate([
            block("Heading1", [text("思路")]),
            block("Heading2", [text("Details")]),
            block("Paragraph", [
                text("literal *x* "),
                text("bold", { bold: true }),
                text(" "),
                text("italic", { italic: true }),
                text(" "),
                text("x`y", { inlineCode: true }),
            ]),
        ]);
        expect(markdown).toContain("# 思路\n\n## Details");
        expect(markdown).toContain("literal \\*x\\* **bold** *italic* ``x`y``");
    });

    it("preserves real source link titles when the Slate children are empty", () => {
        const markdown = serializeSolutionSlate([
            block("BlockQuote", [
                text("Problem: "),
                block("Link", [text("")], {
                    href: "https://leetcode.cn/problems/two-sum/description/",
                    title: "1. 两数之和",
                }),
            ]),
        ]);
        expect(markdown).toBe(
            "> Problem: [1. 两数之和](<https://leetcode.cn/problems/two-sum/description/>)",
        );
    });

    it("keeps marked whitespace outside Markdown emphasis delimiters", () => {
        expect(
            serializeSolutionSlate([
                block("Paragraph", [
                    text("Before"),
                    text(" strong ", { bold: true }),
                    text("after"),
                ]),
            ]),
        ).toBe("Before **strong** after");
    });

    it("retains every language tab with exact code and an adequate fence", () => {
        const markdown = serializeSolutionSlate([
            block(
                "CodeBlock",
                [
                    block(
                        "CodeTab",
                        [text('return "```";\n  // keep indentation')],
                        { language: "c++", name: "", activeTabIndex: 0 },
                    ),
                    block("CodeTab", [text("print('hello')\n")], {
                        language: "python3",
                        name: "example.py",
                    }),
                ],
                { activeTabIndex: 0 },
            ),
        ]);
        expect(markdown).toContain(
            '````cpp\nreturn "```";\n  // keep indentation\n````',
        );
        expect(markdown).toContain(
            "**example.py**\n\n```python\nprint('hello')\n```",
        );
        expect(markdown).not.toContain("activeTabIndex");
    });

    it("serializes actual nested list and Latex nodes without UI text", () => {
        const markdown = serializeSolutionSlate([
            block("BulletedList", [
                block("ListItem", [
                    text("时间复杂度: "),
                    block("Latex", [text("")], { tex: "O(n^2) " }),
                ]),
                block("ListItem", [
                    text("Space"),
                    block("NumberedList", [
                        block("ListItem", [text("Nested")]),
                    ]),
                ]),
            ]),
            block("LatexBlock", [text("")], { tex: "x^2 + y^2" }),
        ]);
        expect(markdown).toContain("- 时间复杂度: $O(n^2)$");
        expect(markdown).toContain("- Space\n  \n  1. Nested");
        expect(markdown).toContain("$$\nx^2 + y^2\n$$");
    });

    it("resolves images and rejects executable links while keeping their text", () => {
        const markdown = serializeSolutionSlate(
            [
                block("Image", [text("")], {
                    src: "/images/chart.png",
                    alt: "Diagram",
                }),
                block("Paragraph", [
                    block("Link", [text("read me")], {
                        href: "javascript:alert(1)",
                    }),
                ]),
            ],
            { baseUrl: "https://leetcode.cn/problems/two-sum/" },
        );
        expect(markdown).toContain(
            "![Diagram](<https://leetcode.cn/images/chart.png>)",
        );
        expect(markdown).toContain("read me");
        expect(markdown).not.toContain("javascript:");
    });

    it("keeps child text and known descendants in future wrapper types", () => {
        const markdown = serializeSolutionSlate([
            block("FutureContainer", [
                block("Paragraph", [text("Important new content")]),
                block("Heading3", [text("Subheading")]),
            ]),
        ]);
        expect(markdown).toBe("Important new content\n\n### Subheading");
    });

    it("serializes the confirmed Table/Row/Cell/Content schema with all rows and alignment", () => {
        const cell = (value: string, align = "left") =>
            block(
                "TableCell",
                [block("TableContent", [block("Paragraph", [text(value)])])],
                { align },
            );
        const markdown = serializeSolutionSlate([
            block("Table", [
                block("TableRow", [cell("Algorithm"), cell("Cost", "right")]),
                block("TableBody", [
                    block("TableRow", [cell("A | B"), cell("O(n)", "right")]),
                ]),
            ]),
        ]);
        expect(markdown).toBe(
            "| Algorithm | Cost |\n| :--- | ---: |\n| A \\| B | O(n) |",
        );
    });

    it("declines merged table cells so source resolution can use the DOM", () => {
        const value = [
            block("Table", [
                block("TableRow", [
                    block(
                        "TableCell",
                        [
                            block("TableContent", [
                                block("Paragraph", [text("Merged")]),
                            ]),
                        ],
                        { colSpan: 2 },
                    ),
                ]),
            ]),
        ];
        expect(serializeSolutionSlate(value)).toBeUndefined();
    });

    it("keeps inline linked images, galleries and public video URLs", () => {
        const markdown = serializeSolutionSlate([
            block("Paragraph", [
                text("See "),
                block("InlineImage", [text("")], {
                    src: "/a.png",
                    alt: "Image",
                    outHref: "https://example.com/large",
                }),
            ]),
            block("Gallery", [text("")], { images: ["/b.png", "/c.png"] }),
            block("Video", [text("")], {
                src: "https://www.youtube.com/watch?v=example",
                title: "Explanation",
            }),
        ]);
        expect(markdown).toContain(
            "See [![Image](<https://leetcode.cn/a.png>)](<https://example.com/large>)",
        );
        expect(markdown).toContain("![Image 1](<https://leetcode.cn/b.png>)");
        expect(markdown).toContain("![Image 2](<https://leetcode.cn/c.png>)");
        expect(markdown).toContain(
            "[Explanation](<https://www.youtube.com/watch?v=example>)",
        );
    });

    it("declines opaque video identifiers and unknown payload-only widgets", () => {
        expect(
            serializeSolutionSlate([
                block("Paragraph", [text("Intro")]),
                block("Video", [text("")], { src: "opaque-video-uuid" }),
            ]),
        ).toBeUndefined();
        expect(
            serializeSolutionSlate([
                block("FutureWidget", [text("")], {
                    payload: "Important content",
                }),
            ]),
        ).toBeUndefined();
    });

    it("supports the official code, underline, strikethrough and highlight marks", () => {
        const markdown = serializeSolutionSlate([
            block("Paragraph", [
                text("x", { code: true }),
                text(" "),
                text("under", { underline: true }),
                text(" "),
                text("old", { strikethrough: true }),
                text(" "),
                text("highlight", { highlight: true }),
            ]),
        ]);
        expect(markdown).toBe(
            "`x` <u>under</u> ~~old~~ <mark>highlight</mark>",
        );
    });

    it.each([
        undefined,
        "",
        "{invalid",
        "[]",
        "null",
        "{}",
        '[{"text":"not an element"}]',
        '[{"type":"Paragraph"}]',
        '[{"type":"Paragraph","children":[null]}]',
    ])("returns undefined for an unreadable tree: %s", (value) => {
        expect(serializeSolutionSlate(value)).toBeUndefined();
    });
});
