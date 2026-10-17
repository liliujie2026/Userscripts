import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, tick, unmount } from "svelte";
import SolutionExport from "../src/lib/SolutionExport.svelte";

const mocks = vi.hoisted(() => ({ export: vi.fn() }));
vi.mock("../src/lib/solution-export", () => ({ exportSolution: mocks.export }));
vi.mock("$lib/toast", () => ({ toaster: {} }));

let component: ReturnType<typeof mount> | undefined;
afterEach(async () => {
    if (component) await unmount(component);
    component = undefined;
    document.body.innerHTML = "";
    mocks.export.mockReset();
});

describe("solution controls", () => {
    it("disables duplicate exports until the clipboard operation completes", async () => {
        let resolve: (() => void) | undefined;
        mocks.export.mockImplementation(
            () =>
                new Promise<void>((done) => {
                    resolve = done;
                }),
        );
        component = mount(SolutionExport, {
            target: document.body,
            props: { kind: "community" },
        });
        flushSync();
        const [copy, download] = document.querySelectorAll("button");
        copy.click();
        flushSync();
        expect(copy.disabled).toBe(true);
        expect(download.disabled).toBe(true);
        expect(
            document.querySelector("[role='status']")?.textContent,
        ).toContain("正在导出");
        resolve?.();
        await tick();
        flushSync();
        expect(copy.disabled).toBe(false);
        expect(
            document.querySelector("[role='status']")?.textContent,
        ).toContain("已复制");
    });

    it("shows an error and permits a download retry after copying fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        mocks.export
            .mockRejectedValueOnce(new Error("denied"))
            .mockResolvedValueOnce(undefined);
        component = mount(SolutionExport, {
            target: document.body,
            props: { kind: "editorial" },
        });
        flushSync();
        const [copy, download] = document.querySelectorAll("button");
        copy.click();
        await tick();
        flushSync();
        expect(copy.disabled).toBe(false);
        expect(
            document.querySelector("[role='status']")?.textContent,
        ).toContain("导出失败");
        download.click();
        await tick();
        flushSync();
        expect(mocks.export).toHaveBeenLastCalledWith("editorial", "download");
        expect(
            document.querySelector("[role='status']")?.textContent,
        ).toContain("已开始下载");
    });
});
