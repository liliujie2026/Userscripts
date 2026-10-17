// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://leetcode.cn/"}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    findSolutionContent,
    getSolutionRoute,
    resolveSolutionSource,
} from "../src/lib/solution-source";

function pageData(value: unknown) {
    const script = document.createElement("script");
    script.id = "__NEXT_DATA__";
    script.type = "application/json";
    script.textContent = JSON.stringify(value);
    document.head.append(script);
}

function setRoute(path: string) {
    history.replaceState({}, "", path);
}

beforeEach(() => {
    document.head.innerHTML = "<title>Two Sum - LeetCode</title>";
    document.body.innerHTML = "";
    setRoute("/problems/two-sum/solutions/434597/liang-shu-zhi-he/");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("solution routes", () => {
    it.each([
        [
            "https://leetcode.com/problems/two-sum/editorial/",
            "editorial",
            undefined,
            undefined,
        ],
        [
            "https://leetcode.cn/problems/two-sum/solutions/434597/my-article/?orderBy=hot",
            "community",
            "434597",
            "my-article",
        ],
        [
            "https://leetcode.cn/problems/two-sum/solution/my-article/",
            "community",
            undefined,
            "my-article",
        ],
        [
            "https://leetcode.com/problems/two-sum/solutions/",
            "list",
            undefined,
            undefined,
        ],
        [
            "https://leetcode.com/problems/two-sum/description/",
            undefined,
            undefined,
            undefined,
        ],
    ])("identifies %s", (url, kind, articleId, articleSlug) => {
        const route = getSolutionRoute(url!);
        expect(route.kind).toBe(kind);
        expect(route.articleId).toBe(articleId);
        expect(route.articleSlug).toBe(articleSlug);
    });
});

describe("rendered article fallback", () => {
    it("uses the invoking pane and excludes hidden panes, problem statements and comments", () => {
        document.body.innerHTML = `
            <section data-track-load="description_content"><div class="markdown-body"><p>Problem</p></div></section>
            <section hidden><div class="markdown-body"><p>Hidden</p></div></section>
            <section id="comments"><div class="markdown-body"><p>Comment</p></div></section>
            <section id="other"><div class="markdown-body"><p>Other article</p></div></section>
            <section id="current"><h1>My solution</h1><div class="markdown-body"><p>Current article</p><pre>code</pre></div></section>`;
        const scope = document.querySelector("#current")!;
        expect(findSolutionContent("community", scope)?.textContent).toContain(
            "Current article",
        );
        expect(
            findSolutionContent(
                "editorial",
                document,
                "https://leetcode.cn/problems/two-sum/description/",
            ),
        ).toBeNull();
    });

    it("does not export a solution listing as an article", () => {
        setRoute("/problems/two-sum/solutions/");
        document.body.innerHTML = `<article><h2><a href="/problems/two-sum/solutions/1/one/">One</a></h2><p>Preview</p></article>`;
        expect(findSolutionContent("community")).toBeNull();
    });

    it("recognizes the current Chinese read-only Slate renderer without selecting an editor", async () => {
        document.body.innerHTML = `<div data-slate-editor="true" contenteditable="true"><p>Draft editor.</p></div><div data-slate-editor="true" data-slate-node="value" contenteditable="false"><div data-node-type="Paragraph"><span>Published rich text.</span></div></div>`;
        const result = await resolveSolutionSource({ kind: "community" });
        expect(result.content?.textContent).toBe("Published rich text.");
        expect(result.source).toBe("dom");
        expect(fetch).toHaveBeenCalled();
    });

    it("identifies the official pane when community and problem panes remain visible", () => {
        setRoute("/problems/two-sum/editorial/");
        document.body.innerHTML = `
            <div class="flexlayout__tab"><section data-track-load="description_content"><div class="markdown-body"><p>Problem</p></div></section></div>
            <div class="flexlayout__tab" role="tabpanel" aria-label="Solutions"><div class="markdown-body"><p>Community</p></div></div>
            <div class="flexlayout__tab"><nav id="editorial-quick-navigation"></nav><div class="markdown-body"><p>Official</p></div></div>`;
        expect(findSolutionContent("editorial")?.textContent).toBe("Official");
        setRoute("/problems/two-sum/solutions/434597/liang-shu-zhi-he/");
        expect(findSolutionContent("community")?.textContent).toBe("Community");
    });

    it("rejects ambiguous visible panes rather than exporting the first article", () => {
        document.body.innerHTML = `<section class="flexlayout__tab"><div class="markdown-body"><p>One</p></div></section><section class="flexlayout__tab"><div class="markdown-body"><p>Two</p></div></section>`;
        expect(findSolutionContent("community")).toBeNull();
    });

    it("falls back to prose when the API is unavailable", async () => {
        document.body.innerHTML = `<h1>Two pointers</h1><div class="markdown-body"><p>Rendered solution.</p></div>`;
        const result = await resolveSolutionSource({ kind: "community" });
        expect(result.source).toBe("dom");
        expect(result.content?.textContent).toBe("Rendered solution.");
        expect(result.title).toBe("Two pointers");
    });

    it("rejects absent content instead of copying an empty string", async () => {
        await expect(
            resolveSolutionSource({ kind: "community" }),
        ).rejects.toThrow("Solution content was not found");
    });
});

describe("page hydration identity", () => {
    it("picks only the exact article and preserves its raw Markdown", async () => {
        pageData({
            props: {
                articles: [
                    {
                        slug: "old-article",
                        title: "Wrong",
                        content: "wrong",
                        topic: { id: "12" },
                    },
                    {
                        slug: "liang-shu-zhi-he",
                        title: "Correct",
                        content: "## Idea\n\n```cpp\nreturn 1;\n```",
                        topic: { id: "434597" },
                    },
                ],
            },
        });
        const result = await resolveSolutionSource({ kind: "community" });
        expect(result.source).toBe("page-data");
        expect(result.title).toBe("Correct");
        expect(result.markdown).toContain("```cpp");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("does not mistake a comment ID for a solution topic ID", async () => {
        pageData({
            comments: [
                { id: "434597", __typename: "CommentNode", content: "Comment" },
            ],
        });
        document.body.innerHTML = `<div class="markdown-body"><p>Actual article.</p></div>`;
        const result = await resolveSolutionSource({ kind: "community" });
        expect(result.source).toBe("dom");
        expect(result.markdown).toBeUndefined();
    });

    it("ignores inaccessible and stale articles", async () => {
        pageData({
            articles: [
                { slug: "old", title: "Old", content: "Old" },
                { slug: "liang-shu-zhi-he", canSee: false, content: "Denied" },
            ],
        });
        document.body.innerHTML = `<div class="markdown-body"><p>Visible content.</p></div>`;
        expect(
            (await resolveSolutionSource({ kind: "community" })).source,
        ).toBe("dom");
    });

    it("uses an editorial only when its enclosing question matches", async () => {
        setRoute("/problems/two-sum/editorial/");
        pageData({
            questions: [
                { titleSlug: "three-sum", solution: { content: "Wrong" } },
                {
                    titleSlug: "two-sum",
                    title: "Two Sum",
                    solution: { content: "Correct editorial" },
                },
            ],
        });
        expect(
            (await resolveSolutionSource({ kind: "editorial" })).markdown,
        ).toBe("Correct editorial");
    });

    it("does not use page-wide data or request the URL article for a different pane", async () => {
        pageData({ slug: "liang-shu-zhi-he", content: "Address bar article" });
        document.body.innerHTML = `<section data-topic-id="900"><h1>Other open pane</h1><div class="markdown-body"><p>Pane article.</p></div></section>`;
        const result = await resolveSolutionSource({
            kind: "community",
            scope: document.querySelector("section")!,
        });
        expect(result.source).toBe("dom");
        expect(result.content?.textContent).toBe("Pane article.");
        expect(fetch).not.toHaveBeenCalled();
    });
});

describe("authenticated same-origin source requests", () => {
    it("resolves the Chinese official article slug before requesting its Markdown", async () => {
        setRoute("/problems/two-sum/editorial/");
        vi.mocked(fetch)
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        data: {
                            questionSolutionOfficialArticle: {
                                solutionSlug: "official-two-sum",
                            },
                        },
                    }),
                ),
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        data: {
                            solutionArticle: {
                                title: "Official",
                                content: "Official Markdown",
                                canSee: true,
                            },
                        },
                    }),
                ),
            );
        const result = await resolveSolutionSource({ kind: "editorial" });
        expect(result.markdown).toBe("Official Markdown");
        expect(
            JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body))
                .variables.slug,
        ).toBe("official-two-sum");
    });

    it("uses the global official-solution query with the exact question slug", async () => {
        const href = "https://leetcode.com/problems/two-sum/editorial/";
        vi.stubGlobal("location", { href, origin: "https://leetcode.com" });
        vi.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: {
                        question: {
                            solution: {
                                content: "Global official Markdown",
                                canSeeDetail: true,
                            },
                        },
                    },
                }),
            ),
        );
        const result = await resolveSolutionSource({ kind: "editorial" });
        expect(result.markdown).toBe("Global official Markdown");
        expect(
            JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))
                .variables.titleSlug,
        ).toBe("two-sum");
    });

    it("requests the exact Chinese slug with CSRF and current-session credentials", async () => {
        document.cookie = "csrftoken=test-token; path=/";
        vi.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: {
                        solutionArticle: {
                            title: "API article",
                            content: "Original **Markdown**",
                            canSee: true,
                        },
                    },
                }),
            ),
        );
        const result = await resolveSolutionSource({ kind: "community" });
        expect(result.source).toBe("graphql");
        expect(result.markdown).toBe("Original **Markdown**");
        const [url, init] = vi.mocked(fetch).mock.calls[0];
        expect(String(url)).toBe("https://leetcode.cn/graphql/");
        expect(init?.credentials).toBe("same-origin");
        expect(init?.headers).toMatchObject({ "X-CSRFToken": "test-token" });
        expect(JSON.parse(String(init?.body)).variables.slug).toBe(
            "liang-shu-zhi-he",
        );
    });

    it("never requests content from a different origin", async () => {
        document.body.innerHTML = `<section><div class="markdown-body"><p>Visible article.</p></div></section>`;
        const result = await resolveSolutionSource({
            kind: "editorial",
            scope: document.querySelector("section")!,
            url: "https://leetcode.com/problems/two-sum/editorial/",
        });
        expect(result.source).toBe("dom");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("falls back on denied GraphQL content", async () => {
        document.body.innerHTML = `<div class="markdown-body"><p>Accessible excerpt.</p></div>`;
        vi.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: {
                        solutionArticle: {
                            content: "Denied content",
                            canSee: false,
                        },
                    },
                }),
            ),
        );
        expect(
            (await resolveSolutionSource({ kind: "community" })).source,
        ).toBe("dom");
    });

    it("serializes the complete published Slate value instead of stale legacy Markdown", async () => {
        document.body.innerHTML = `<div class="solution-markdown_markdown__d2RC0"><p>Current rich text.</p></div>`;
        vi.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: {
                        solutionArticle: {
                            content: "Outdated Markdown",
                            slateValue:
                                '[{"type":"Paragraph","children":[{"text":"Current rich text."}]}]',
                        },
                    },
                }),
            ),
        );
        const result = await resolveSolutionSource({ kind: "community" });
        expect(result.source).toBe("graphql");
        expect(result.markdown).toBe("Current rich text.");
    });

    it("falls back to DOM when the published Slate schema cannot be read", async () => {
        document.body.innerHTML = `<div data-slate-editor="true" contenteditable="false"><p>Visible rich text.</p></div>`;
        vi.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: {
                        solutionArticle: {
                            content: "Outdated Markdown",
                            slateValue: '[{"schemaChanged":true}]',
                        },
                    },
                }),
            ),
        );
        expect(
            (await resolveSolutionSource({ kind: "community" })).source,
        ).toBe("dom");
    });

    it("re-finds prose replaced while the source request is pending", async () => {
        document.body.innerHTML = `<div class="markdown-body"><p>Placeholder.</p></div>`;
        vi.mocked(fetch).mockImplementation(async () => {
            document.body.innerHTML = `<div class="markdown-body"><p>Loaded article.</p></div>`;
            return new Response("{}", { status: 503 });
        });
        const result = await resolveSolutionSource({ kind: "community" });
        expect(result.content?.isConnected).toBe(true);
        expect(result.content?.textContent).toBe("Loaded article.");
    });

    it("aborts a stalled request and still exports the rendered article", async () => {
        vi.useFakeTimers();
        document.body.innerHTML = `<div class="markdown-body"><p>Visible article.</p></div>`;
        vi.mocked(fetch).mockImplementation(
            (_input, init) =>
                new Promise((_resolve, reject) => {
                    init?.signal?.addEventListener("abort", () =>
                        reject(new Error("aborted")),
                    );
                }),
        );
        const resultPromise = resolveSolutionSource({ kind: "community" });
        await vi.advanceTimersByTimeAsync(6000);
        expect((await resultPromise).source).toBe("dom");
        expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true);
    });

    it("rejects a response completed after SPA navigation", async () => {
        vi.mocked(fetch).mockImplementation(async () => {
            setRoute("/problems/two-sum/solutions/900/another/");
            return new Response(
                JSON.stringify({
                    data: { solutionArticle: { content: "Old article" } },
                }),
            );
        });
        await expect(
            resolveSolutionSource({ kind: "community" }),
        ).rejects.toThrow("solution changed");
    });
});
