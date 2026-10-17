import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { watchSolutionToolbar } from "../src/lib/solution-toolbar";

describe("solution toolbar lifecycle", () => {
    let stop: (() => void) | undefined;
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = "";
        history.replaceState(null, "", "/problems/two-sum/description/");
    });
    afterEach(() => {
        stop?.();
        vi.useRealTimers();
    });

    it("appears on a solution reached by pushState and disappears on the list", () => {
        const dispose = vi.fn();
        const render = vi.fn(() => dispose);
        stop = watchSolutionToolbar(render);
        expect(render).not.toHaveBeenCalled();
        history.pushState(
            null,
            "",
            "/problems/two-sum/solutions/434597/example/",
        );
        vi.advanceTimersByTime(500);
        expect(render).toHaveBeenCalledOnce();
        expect(render.mock.calls[0][1]).toBe("community");
        vi.advanceTimersByTime(2000);
        expect(render).toHaveBeenCalledOnce();
        history.pushState(null, "", "/problems/two-sum/solutions/");
        window.dispatchEvent(new PopStateEvent("popstate"));
        expect(dispose).toHaveBeenCalledOnce();
        expect(
            document.querySelector("[data-leetcode-toolkit-toolbar]"),
        ).toBeNull();
    });

    it("recreates controls for each article and survives removal by the host", () => {
        history.replaceState(null, "", "/problems/two-sum/editorial/");
        const render = vi.fn(() => vi.fn());
        stop = watchSolutionToolbar(render);
        expect(render.mock.calls[0][1]).toBe("editorial");
        history.replaceState(
            null,
            "",
            "/problems/two-sum/solutions/12/second/",
        );
        vi.advanceTimersByTime(500);
        expect(render).toHaveBeenCalledTimes(2);
        document.querySelector("[data-leetcode-toolkit-toolbar]")?.remove();
        vi.advanceTimersByTime(500);
        expect(render).toHaveBeenCalledTimes(3);
        expect(
            document.querySelectorAll("[data-leetcode-toolkit-toolbar]"),
        ).toHaveLength(1);
    });

    it("releases its timer and mounted component on cleanup", () => {
        history.replaceState(null, "", "/problems/two-sum/editorial/");
        const dispose = vi.fn();
        stop = watchSolutionToolbar(() => dispose);
        stop();
        stop = undefined;
        expect(dispose).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });
});
