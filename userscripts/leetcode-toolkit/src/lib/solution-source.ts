import { serializeSolutionSlate } from "./solution-slate";

export type SolutionKind = "editorial" | "community";

export interface SolutionRoute {
    kind?: SolutionKind | "list";
    problemSlug?: string;
    articleId?: string;
    articleSlug?: string;
    url: string;
}

export interface SolutionSource {
    markdown?: string;
    content?: HTMLElement;
    title: string;
    url: string;
    source: "page-data" | "graphql" | "dom";
}

interface SourceOptions {
    kind: SolutionKind;
    scope?: ParentNode;
    url?: string;
}

type JsonRecord = Record<string, unknown>;

const BODY_SELECTORS = [
    "[data-solution-content]",
    "[data-editorial-content]",
    "[data-slate-editor='true'][contenteditable='false']",
    "[data-md-root]",
    ".markdown-body",
    ".markdown-content",
    "[class*='solution-markdown_markdown']",
    "[class~='markdown']",
    "[class*='MarkdownContent']",
    "[class*='markdown-content']",
    ".elfjS",
    ".xFUwe",
    ".WRmCx",
    "article",
];

const EXCLUDED_CONTENT = [
    "[data-comment-id]",
    "[data-testid*='comment']",
    "[id='comments']",
    "[id='comment']",
    "[class*='comment-list']",
    "[class*='CommentList']",
    "[data-track-load='description_content']",
    "[contenteditable='true']",
    ".monaco-editor",
    "nav",
    "aside",
].join(",");

function record(value: unknown): JsonRecord | undefined {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as JsonRecord)
        : undefined;
}

function string(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value : undefined;
}

function markdownFromArticle(
    article: JsonRecord | undefined,
    baseUrl?: string,
): string | undefined {
    // New Chinese articles publish Slate instead of the legacy Markdown field.
    // The full source includes inactive language tabs that the DOM may omit.
    const slate = string(article?.slateValue);
    if (slate && slate !== "[]" && slate !== "null") {
        return serializeSolutionSlate(slate, { baseUrl });
    }
    return string(article?.content);
}

/** Parse both current solution URLs and the old Chinese /solution/:slug route. */
export function getSolutionRoute(input: string | URL): SolutionRoute {
    const url = new URL(input, "https://leetcode.com");
    const parts = url.pathname.split("/").filter(Boolean);
    const route: SolutionRoute = { url: url.href };
    if (parts[0] !== "problems" || !parts[1]) return route;
    route.problemSlug = parts[1];
    if (parts[2] === "editorial") route.kind = "editorial";
    if (parts[2] === "solution" && parts[3]) {
        route.kind = "community";
        route.articleSlug = parts[3];
    }
    if (parts[2] === "solutions") {
        route.kind = parts[3] ? "community" : "list";
        if (/^\d+$/.test(parts[3] ?? "")) {
            route.articleId = parts[3];
            route.articleSlug = parts[4];
        } else {
            route.articleSlug = parts[3];
        }
    }
    return route;
}

function isVisible(element: Element): boolean {
    for (
        let current: Element | null = element;
        current;
        current = current.parentElement
    ) {
        if (current.matches("[hidden], [aria-hidden='true']")) return false;
        const style =
            current.ownerDocument.defaultView?.getComputedStyle(current);
        if (style?.display === "none" || style?.visibility === "hidden")
            return false;
    }
    return true;
}

function scopedElements(scope: ParentNode, selector: string): HTMLElement[] {
    const result = Array.from(scope.querySelectorAll<HTMLElement>(selector));
    if (scope instanceof HTMLElement && scope.matches(selector))
        result.unshift(scope);
    return result;
}

function paneKind(element: Element): SolutionKind | undefined {
    const explicit = element.closest(
        "[data-solution-kind], [data-editorial-content], [data-solution-content]",
    );
    if (
        explicit?.getAttribute("data-solution-kind") === "editorial" ||
        explicit?.hasAttribute("data-editorial-content")
    )
        return "editorial";
    if (
        explicit?.getAttribute("data-solution-kind") === "community" ||
        explicit?.hasAttribute("data-solution-content")
    )
        return "community";
    const pane = element.closest(".flexlayout__tab, [role='tabpanel']");
    if (!pane) return undefined;
    if (
        pane.querySelector(
            "#editorial-quick-navigation, [data-testid='editorial-content']",
        )
    )
        return "editorial";
    if (
        pane.querySelector(
            "[data-testid='solution-content'], [data-testid='solution-detail']",
        )
    )
        return "community";
    const labelIds = pane.getAttribute("aria-labelledby")?.split(/\s+/) ?? [];
    const label = [
        pane.getAttribute("aria-label"),
        ...labelIds.map(
            (id) => pane.ownerDocument.getElementById(id)?.textContent,
        ),
    ]
        .filter(Boolean)
        .join(" ");
    if (/\beditorial\b|官方题解/i.test(label)) return "editorial";
    if (/\bsolutions?\b|社区题解|全部题解/i.test(label)) return "community";
    return undefined;
}

/** Find an article body inside the invoking pane, never the page's first div. */
export function findSolutionContent(
    kind: SolutionKind,
    scope: ParentNode = document,
    url = location.href,
): HTMLElement | null {
    const route = getSolutionRoute(url);
    const documentScope = scope === document || scope === document.body;
    if (documentScope && route.kind !== kind) return null;
    const matchingPaneExists = BODY_SELECTORS.some((selector) =>
        scopedElements(scope, selector).some(
            (element) =>
                isVisible(element) &&
                paneKind(element) === kind &&
                !element.closest(EXCLUDED_CONTENT),
        ),
    );
    for (const selector of BODY_SELECTORS) {
        const candidates = scopedElements(scope, selector).filter((element) => {
            if (!isVisible(element) || element.closest(EXCLUDED_CONTENT))
                return false;
            if (element.closest("[data-leetcode-toolkit-toolbar]"))
                return false;
            const ownKind = paneKind(element);
            if (
                (ownKind && ownKind !== kind) ||
                (matchingPaneExists && ownKind !== kind)
            )
                return false;
            if (
                kind === "community" &&
                element.hasAttribute("data-editorial-content")
            )
                return false;
            if (
                kind === "editorial" &&
                element.hasAttribute("data-solution-content")
            )
                return false;
            // Article cards and empty loading placeholders are not solution bodies.
            if (
                element.matches("article") &&
                !element.querySelector("p, pre, table, ol, ul, .katex, .math")
            )
                return false;
            return Boolean(
                element.textContent?.trim() ||
                    element.querySelector("img, iframe, video"),
            );
        });
        if (candidates.length) {
            // Prefer the complete prose root over a nested renderer fragment.
            const roots = candidates.filter(
                (element) =>
                    !candidates.some(
                        (other) => other !== element && other.contains(element),
                    ),
            );
            if (documentScope && roots.length > 1) {
                const panes = new Set(
                    roots.map(
                        (element) =>
                            element.closest(
                                ".flexlayout__tab, [role='tabpanel']",
                            ) ?? element,
                    ),
                );
                if (panes.size > 1) return null;
            }
            return roots[0] ?? null;
        }
    }
    return null;
}

function titleFromDom(scope: ParentNode, content: HTMLElement | null): string {
    const headings = scopedElements(
        scope,
        "h1, [data-solution-title], [data-editorial-title]",
    );
    const heading = headings.find(
        (element) => isVisible(element) && !content?.contains(element),
    );
    return (
        heading?.textContent?.trim() ||
        document.title.replace(/\s*[-–|]\s*(LeetCode|力扣).*$/i, "").trim() ||
        "LeetCode Solution"
    );
}

function scopedRoute(
    kind: SolutionKind,
    scope: ParentNode,
    input: string,
): SolutionRoute | undefined {
    const route = getSolutionRoute(input);
    if (route.kind !== kind || !route.problemSlug) return undefined;
    if (scope === document || scope === document.body) return route;
    if (scope instanceof Element) {
        const scopeKind = paneKind(scope);
        if (scopeKind && scopeKind !== kind) return undefined;
    }
    // Some layouts keep several articles open. A pane's identity must agree with
    // the address bar before page-wide hydration or an API response can be used.
    const identity = scopedElements(
        scope,
        "[data-article-id], [data-topic-id], [data-solution-slug]",
    )[0];
    if (identity) {
        const id =
            identity.getAttribute("data-article-id") ??
            identity.getAttribute("data-topic-id");
        const slug = identity.getAttribute("data-solution-slug");
        if (
            (id && route.articleId && id !== route.articleId) ||
            (slug && route.articleSlug && slug !== route.articleSlug)
        )
            return undefined;
    }
    const currentLinks = scopedElements(
        scope,
        "a[aria-current='page'][href], a[rel='canonical'][href], h1 a[href]",
    );
    for (const link of currentLinks) {
        const ownRoute = getSolutionRoute(
            new URL(link.getAttribute("href")!, input),
        );
        if (!ownRoute.kind || ownRoute.kind === "list") continue;
        if (
            ownRoute.kind !== kind ||
            ownRoute.problemSlug !== route.problemSlug
        )
            return undefined;
        if (
            (ownRoute.articleId &&
                route.articleId &&
                ownRoute.articleId !== route.articleId) ||
            (ownRoute.articleSlug &&
                route.articleSlug &&
                ownRoute.articleSlug !== route.articleSlug)
        )
            return undefined;
    }
    return route;
}

function articleFromPageData(
    value: unknown,
    route: SolutionRoute,
): { markdown: string; title?: string } | undefined {
    const queue: unknown[] = [value];
    // A bounded walk avoids getting trapped in unexpectedly large hydration data.
    for (let index = 0; index < queue.length && index < 30000; index++) {
        const current = queue[index];
        if (Array.isArray(current)) {
            queue.push(...current);
            continue;
        }
        const item = record(current);
        if (!item || item.canSee === false || item.canSeeDetail === false)
            continue;
        if (
            route.kind === "editorial" &&
            item.titleSlug === route.problemSlug
        ) {
            const solution = record(item.solution);
            const content = markdownFromArticle(solution, route.url);
            if (content && solution?.canSeeDetail !== false)
                return {
                    markdown: content,
                    title: string(solution?.title) ?? string(item.title),
                };
        }
        if (route.kind === "community") {
            const topic = record(item.topic);
            const typename = string(item.__typename) ?? "";
            const slugMatches = Boolean(
                route.articleSlug && item.slug === route.articleSlug,
            );
            const idMatches = Boolean(
                route.articleId &&
                    (String(topic?.id ?? "") === route.articleId ||
                        (/Article|Topic/.test(typename) &&
                            String(item.id ?? "") === route.articleId)),
            );
            // Numeric comment IDs must not be confused with the solution topic.
            if (slugMatches || idMatches) {
                const post = record(item.post) ?? record(topic?.post);
                const content =
                    markdownFromArticle(item, route.url) ??
                    markdownFromArticle(post, route.url);
                if (content && post?.canSee !== false)
                    return { markdown: content, title: string(item.title) };
            }
        }
        queue.push(...Object.values(item));
    }
    return undefined;
}

function fromPageData(route: SolutionRoute) {
    for (const script of document.querySelectorAll<HTMLScriptElement>(
        "script#__NEXT_DATA__, script[type='application/json']",
    )) {
        const text = script.textContent;
        if (!text || text.length > 4_000_000) continue;
        try {
            const article = articleFromPageData(JSON.parse(text), route);
            if (article) return article;
        } catch {
            // Other JSON script tags can contain unrelated or incomplete data.
        }
    }
    return undefined;
}

async function fromGraphql(route: SolutionRoute) {
    const url = new URL(route.url);
    if (url.origin !== location.origin) return undefined;
    let query: string;
    let variables: JsonRecord;
    let operationName: string;
    let responseKey:
        | "solutionArticle"
        | "question"
        | "questionSolutionOfficialArticle";
    if (
        url.hostname === "leetcode.cn" &&
        route.articleSlug &&
        route.kind === "community"
    ) {
        // This is the discussTopic operation used by the current Chinese site.
        operationName = "discussTopic";
        query =
            "query discussTopic($slug: String) { solutionArticle(slug: $slug, orderBy: DEFAULT) { slug title content slateValue canSee } }";
        variables = { slug: route.articleSlug };
        responseKey = "solutionArticle";
    } else if (
        url.hostname === "leetcode.cn" &&
        route.kind === "editorial" &&
        route.problemSlug
    ) {
        operationName = "questionSolutionOfficialArticle";
        query =
            "query questionSolutionOfficialArticle($questionSlug: String!) { questionSolutionOfficialArticle(questionSlug: $questionSlug) { solutionSlug } }";
        variables = { questionSlug: route.problemSlug };
        responseKey = "questionSolutionOfficialArticle";
    } else if (
        url.hostname === "leetcode.com" &&
        route.kind === "editorial" &&
        route.problemSlug
    ) {
        operationName = "officialSolution";
        query =
            "query officialSolution($titleSlug: String!) { question(titleSlug: $titleSlug) { solution { content canSeeDetail } } }";
        variables = { titleSlug: route.problemSlug };
        responseKey = "question";
    } else {
        // Global community queries vary; rendered prose remains a supported source.
        return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
        const csrf = document.cookie
            .split(";")
            .map((part) => part.trim())
            .find((part) => part.startsWith("csrftoken="))
            ?.slice("csrftoken=".length);
        const request = async (
            operation: string,
            queryText: string,
            queryVariables: JsonRecord,
        ) => {
            const response = await fetch(new URL("/graphql/", url), {
                method: "POST",
                credentials: "same-origin",
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    ...(csrf
                        ? { "X-CSRFToken": decodeURIComponent(csrf) }
                        : {}),
                },
                body: JSON.stringify({
                    operationName: operation,
                    variables: queryVariables,
                    query: queryText,
                }),
            });
            if (!response.ok) return undefined;
            const payload = record(await response.json());
            return payload?.errors ? undefined : record(payload?.data);
        };
        let result = record(
            (await request(operationName, query, variables))?.[responseKey],
        );
        if (responseKey === "questionSolutionOfficialArticle") {
            const slug = string(result?.solutionSlug);
            if (!slug) return undefined;
            result = record(
                (
                    await request(
                        "discussTopic",
                        "query discussTopic($slug: String) { solutionArticle(slug: $slug, orderBy: DEFAULT) { slug title content slateValue canSee } }",
                        { slug },
                    )
                )?.solutionArticle,
            );
        }
        const article =
            responseKey === "question" ? record(result?.solution) : result;
        if (
            !article ||
            article.canSee === false ||
            article.canSeeDetail === false
        )
            return undefined;
        const markdown = markdownFromArticle(article, route.url);
        return markdown
            ? { markdown, title: string(article.title) }
            : undefined;
    } catch {
        return undefined;
    } finally {
        clearTimeout(timer);
    }
}

/** Resolve the currently viewed article, with authenticated same-origin requests only. */
export async function resolveSolutionSource({
    kind,
    scope = document,
    url = location.href,
}: SourceOptions): Promise<SolutionSource> {
    const startingLocation = location.href;
    const content = findSolutionContent(kind, scope, url);
    const title = titleFromDom(scope, content);
    const route = scopedRoute(kind, scope, url);
    if (route) {
        const hydrated = fromPageData(route);
        if (hydrated)
            return {
                ...hydrated,
                title: hydrated.title ?? title,
                url,
                source: "page-data",
            };
        const remote = await fromGraphql(route);
        // SPA navigation while a request is pending must never export the old page.
        if (location.href !== startingLocation)
            throw new Error(
                "The solution changed while exporting. Please try again.",
            );
        if (remote)
            return {
                ...remote,
                title: remote.title ?? title,
                url,
                source: "graphql",
            };
    }
    // React can replace the prose root without changing the address bar.
    const currentContent = findSolutionContent(kind, scope, url);
    if (currentContent)
        return {
            content: currentContent,
            title: titleFromDom(scope, currentContent),
            url,
            source: "dom",
        };
    throw new Error(
        "Solution content was not found. Open an accessible solution article and wait for it to load.",
    );
}
