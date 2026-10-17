import { afterEach, describe, expect, it, vi } from "vitest";
import { solutionToMarkdown } from "./solution-markdown";

const pageUrl = "https://leetcode.cn/problems/two-sum/solutions/42/example/";

function article(html: string) {
    const element = document.createElement("article");
    element.innerHTML = html;
    return element;
}

function markdown(html: string) {
    return solutionToMarkdown(article(html), { baseUrl: pageUrl });
}

afterEach(() => vi.unstubAllGlobals());

describe("solutionToMarkdown", () => {
    it("preserves article structure, links, lists, and inline formatting", () => {
        const result = markdown(`
            <h2>Approach</h2>
            <p>Use <strong>a map</strong> and <code>nums[i]</code>.</p>
            <ol><li>Read input</li><li>Find the <em>pair</em></li></ol>
            <blockquote>One pass</blockquote>
            <a href="/problems/two-sum/">Problem</a>
            <a href="#complexity">Complexity</a>
            <a href="javascript:alert(1)">Text only</a>
        `);
        expect(result).toContain("## Approach");
        expect(result).toContain("**a map**");
        expect(result).toContain("`nums[i]`");
        expect(result).toContain("1.  Read input");
        expect(result).toContain("*pair*");
        expect(result).toContain("> One pass");
        expect(result).toContain(
            "[Problem](https://leetcode.cn/problems/two-sum/)",
        );
        expect(result).toContain(`[Complexity](${pageUrl}#complexity)`);
        expect(result).toContain("Text only");
        expect(result).not.toContain("javascript:");
    });

    it("extracts KaTeX source once and preserves inline and display delimiters", () => {
        const result = markdown(String.raw`
            <p>Cost <span class="katex"><span class="katex-mathml"><math><semantics>
                <mi>rendered duplicate</mi><annotation encoding="application/x-tex">O(n_1)</annotation>
            </semantics></math></span><span class="katex-html" aria-hidden="true">visual duplicate</span></span>.</p>
            <span class="katex-display"><span class="katex"><math><semantics>
                <annotation encoding="application/x-tex">\sum_{i=0}^{n} i</annotation>
            </semantics></math></span></span>
        `);
        expect(result).toContain("Cost $O(n_1)$.");
        expect(result).toContain("$$\n\\sum_{i=0}^{n} i\n$$");
        expect(result.match(/O\(n_1\)/g)).toHaveLength(1);
        expect(result).not.toContain("duplicate");
        expect(result).not.toContain("annotation");
    });

    it("handles MathJax 2 scripts, MathJax 3 annotations, and raw TeX spans", () => {
        const result = markdown(String.raw`
            <span class="MathJax_Preview">preview</span><span class="MathJax">rendered</span><script type="math/tex">x_i + y</script>
            <mjx-container display="true"><mjx-assistive-mml><math><semantics><annotation encoding="application/x-tex">\frac{a}{b}</annotation></semantics></math></mjx-assistive-mml></mjx-container>
            <span class="math-tex">\(a_b\)</span>
            <div class="math">\[x^2\]</div>
        `);
        expect(result).toContain("$x_i + y$");
        expect(result).toContain("$$\n\\frac{a}{b}\n$$");
        expect(result).toContain("$a_b$");
        expect(result).toContain("$$\nx^2\n$$");
        expect(result).not.toMatch(/preview|rendered/);
    });

    it("normalizes current CN Slate headings, list wrappers, and display math", () => {
        const result = markdown(String.raw`
            <div data-node-type="Heading2"><div data-slate-node="element"><span>Steps</span></div></div>
            <div data-node-type="BlockQuote"><div data-slate-node="element"><span>One pass</span></div></div>
            <div data-node-type="OrderedList"><ol>
                <div data-node-type="ListItem"><li><span contenteditable="false">1.</span><span>Read input</span></li></div>
                <div data-node-type="ListItem"><li><span contenteditable="false">2.</span><span>Return result</span></li></div>
            </ol></div>
            <div data-node-type="LatexBlock"><div><span class="katex"><math><semantics>
                <annotation encoding="application/x-tex">a_b + c</annotation>
            </semantics></math></span></div></div>
        `);
        expect(result).toContain("## Steps");
        expect(result).toContain("> One pass");
        expect(result).toContain("1.  Read input");
        expect(result).toContain("2.  Return result");
        expect(result).not.toMatch(/1\.\s+1\./);
        expect(result).toContain("$$\na_b + c\n$$");
    });

    it("exports all loaded Slate code tabs with their language labels", () => {
        const result = markdown(`
            <div data-node-type="CodeBlock"><div data-slate-node="element">
                <div contenteditable="false"><div><div>C++</div><div>Python3</div></div><div class="CODEBLOCK_COPY_BUTTON">Copy</div></div>
                <div data-node-type="CodeTab"><div data-slate-node="element"><div><pre><span data-slate-string="true">  return 1;</span></pre></div></div></div>
                <div data-node-type="CodeTab" style="display:none"><div data-slate-node="element"><div><pre><span data-slate-string="true">  return 2</span></pre></div></div></div>
            </div></div>
        `);
        expect(result).toContain("```cpp\n  return 1;\n```");
        expect(result).toContain("```python\n  return 2\n```");
        expect(result).not.toContain("Copy");
        expect(result).not.toContain("C++");
    });

    it("preserves code indentation and dynamically lengthens backtick fences", () => {
        const result = markdown(
            '<pre><code class="highlight language-Python3">def run():\n    print("```nested```")\n\n    return 1\n</code></pre>',
        );
        expect(result).toBe(
            '````python\ndef run():\n    print("```nested```")\n\n    return 1\n````',
        );
    });

    it("preserves line breaks represented by br and div in code blocks", () => {
        expect(
            markdown(
                '<pre data-language="C++"><div>  a;</div><div>  b;<br>  c;</div></pre>',
            ),
        ).toBe("```cpp\n  a;\n  b;\n  c;\n```");
    });

    it("converts header tables and preserves data-only first rows", () => {
        const headed = markdown(
            "<table><thead><tr><th>Time</th><th>Space</th></tr></thead><tbody><tr><td>O(n)</td><td>O(n)</td></tr></tbody></table>",
        );
        expect(headed).toMatch(/\| Time \| Space \|/);
        expect(headed).toMatch(/\| --- \| --- \|/);
        expect(headed).toContain("| O(n) | O(n) |");
        const unheaded = markdown(
            "<table><tbody><tr><td>first</td><td>1</td></tr><tr><td>second</td><td>2</td></tr></tbody></table>",
        );
        expect(unheaded).toMatch(/\| first\s*\| 1\s*\|/);
        expect(unheaded).toMatch(/\| second\s*\| 2\s*\|/);
    });

    it("keeps details readable with Markdown code and absolute image URLs inside", () => {
        const result = markdown(
            '<details open><summary>Proof &amp; code</summary><p>Reason</p><pre><code class="language-js">return 1;</code></pre><img src="/proof.png" alt="proof"></details>',
        );
        expect(result).toContain("<details open>");
        expect(result).toContain("<summary>Proof &amp; code</summary>");
        expect(result).toContain("Reason");
        expect(result).toContain("```javascript\nreturn 1;\n```");
        expect(result).toContain("![proof](https://leetcode.cn/proof.png)");
        expect(result).toContain("</details>");
    });

    it("exports images without fetching, even when the network would fail", () => {
        const fetch = vi.fn(() => {
            throw new Error("Network unavailable");
        });
        vi.stubGlobal("fetch", fetch);
        const result = markdown(
            '<p>Before</p><img src="/missing.png" alt="missing"><img src="data:image/png;base64,AA==" data-src="//assets.leetcode.com/lazy.png" alt="lazy"><img alt="no URL"><p>After</p>',
        );
        expect(result).toContain("![missing](https://leetcode.cn/missing.png)");
        expect(result).toContain(
            "![lazy](https://assets.leetcode.com/lazy.png)",
        );
        expect(result).toContain("no URL");
        expect(result).toContain("After");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("preserves the visible slide without clicking carousel controls", () => {
        const element = article(
            '<div><img alt="Current" src="/slide-3.png"><button>Next</button><span>3 / 8</span></div>',
        );
        const click = vi.fn();
        element.querySelector("button")!.addEventListener("click", click);
        expect(solutionToMarkdown(element, { baseUrl: pageUrl })).toContain(
            "![Current](https://leetcode.cn/slide-3.png)",
        );
        expect(click).not.toHaveBeenCalled();
    });

    it("degrades inaccessible or unloaded iframes to source links immediately", () => {
        const element = article(
            '<p>Explanation</p><iframe src="https://external.example/video" title="Video"></iframe><iframe src="/playground/abc"></iframe>',
        );
        Object.defineProperty(
            element.querySelector("iframe"),
            "contentDocument",
            {
                get() {
                    throw new DOMException("Blocked", "SecurityError");
                },
            },
        );
        const result = solutionToMarkdown(element, { baseUrl: pageUrl });
        expect(result).toContain("[Video](https://external.example/video)");
        expect(result).toContain(
            "[LeetCode Playground](https://leetcode.cn/playground/abc)",
        );
        expect(result).toContain("Explanation");
        expect(result).not.toContain("iframe");
    });

    it("captures already readable iframe code without changing languages", () => {
        const element = article('<iframe src="/playground/abc"></iframe>');
        const frameDocument = document.implementation.createHTMLDocument();
        Object.defineProperty(frameDocument, "URL", {
            value: "https://leetcode.cn/playground/abc",
        });
        frameDocument.body.innerHTML =
            '<button>Java</button><textarea name="lc-codemirror" data-language="Python3"></textarea>';
        frameDocument.querySelector("textarea")!.value = "  print(1)\n";
        Object.defineProperty(
            element.querySelector("iframe"),
            "contentDocument",
            { value: frameDocument },
        );
        const click = vi.fn();
        frameDocument.querySelector("button")!.addEventListener("click", click);
        const result = solutionToMarkdown(element, { baseUrl: pageUrl });
        expect(result).toContain("```python\n  print(1)\n```");
        expect(result).toContain("[LeetCode Playground]");
        expect(click).not.toHaveBeenCalled();
    });

    it("does not mutate the source DOM or retain state across exports", () => {
        const element = article(
            '<h2><a aria-hidden="true" href="#heading">#</a>Heading</h2><details><summary>More</summary><p></p><img src="/first.png"></details><script>alert(1)</script>',
        );
        const before = element.outerHTML;
        const first = solutionToMarkdown(element, { baseUrl: pageUrl });
        const second = markdown('<img src="/second.png"><p>Second</p>');
        const repeated = solutionToMarkdown(element, { baseUrl: pageUrl });
        expect(element.outerHTML).toBe(before);
        expect(first).toBe(repeated);
        expect(first).not.toContain("alert(1)");
        expect(second).not.toContain("first.png");
        expect(second).toContain("second.png");
    });

    it("accepts a code, image, or math element as the root", () => {
        const container = article(
            '<pre><code>  value</code></pre><img src="/root.png"><span class="math-tex">x_i</span>',
        );
        expect(
            solutionToMarkdown(container.children[0], { baseUrl: pageUrl }),
        ).toBe("```\n  value\n```");
        expect(
            solutionToMarkdown(container.children[1], { baseUrl: pageUrl }),
        ).toBe("![](https://leetcode.cn/root.png)");
        expect(
            solutionToMarkdown(container.children[2], { baseUrl: pageUrl }),
        ).toBe("$x_i$");
    });
});
