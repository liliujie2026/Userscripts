<script lang="ts">
    import { exportSolution } from "./solution-export";
    import { globalState } from "./state";
    import type { SolutionKind } from "./solution-source";
    import FindEditorialScreenshot from "../routes/problems/editorial/find-editorial-screenshot.svelte";
    import ReadSavedEditorial from "./read-saved-editorial.svelte";

    let { kind }: { kind: SolutionKind } = $props();
    const cn = globalState.site === "cn";
    let busy = $state(false);
    let message = $state("");
    let failed = $state(false);

    async function run(action: "copy" | "download") {
        if (busy) return;
        busy = true;
        failed = false;
        message = cn ? "正在导出当前题解…" : "Exporting the current solution…";
        try {
            await exportSolution(kind, action);
            message =
                action === "copy"
                    ? cn
                        ? "已复制 Markdown"
                        : "Markdown copied"
                    : cn
                      ? "已开始下载 Markdown"
                      : "Markdown download started";
        } catch (error) {
            failed = true;
            console.error("[LeetCode Toolkit] Solution export failed", error);
            message = cn
                ? "导出失败：请打开可访问的题解正文并等待加载；复制失败时可尝试下载。"
                : "Export failed. Open an accessible solution and wait for it to load; try Download if copying fails.";
        } finally {
            busy = false;
        }
    }
</script>

<section aria-label={cn ? "题解导出" : "Solution export"}>
    <div class="actions">
        <span class="label"
            >{cn
                ? kind === "editorial"
                    ? "官方题解"
                    : "当前题解"
                : kind === "editorial"
                  ? "Editorial"
                  : "Solution"}</span
        >
        <button disabled={busy} onclick={() => run("copy")}>
            {cn ? "复制 Markdown" : "Copy Markdown"}
        </button>
        <button disabled={busy} onclick={() => run("download")}>
            {cn ? "下载 Markdown" : "Download Markdown"}
        </button>
        {#if kind === "editorial" && !cn}
            <details>
                <summary>{cn ? "更多" : "More"}</summary>
                <div class="extra">
                    <FindEditorialScreenshot /><ReadSavedEditorial />
                </div>
            </details>
        {/if}
    </div>
    {#if message}
        <p role="status" class:error={failed}>{message}</p>
    {/if}
</section>

<style>
    section {
        box-sizing: border-box;
        max-width: min(560px, calc(100vw - 32px));
        padding: 10px 12px;
        border: 1px solid #64748b;
        border-radius: 10px;
        color: #f8fafc;
        background: #172033;
        box-shadow: 0 4px 18px #0003;
        font:
            13px/1.5 system-ui,
            sans-serif;
    }
    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }
    .label {
        font-weight: 600;
    }
    button {
        border: 1px solid #94a3b8;
        border-radius: 5px;
        padding: 5px 10px;
        color: #fff;
        background: #334155;
        cursor: pointer;
        font: inherit;
    }
    button:hover {
        background: #475569;
    }
    button:focus-visible,
    summary:focus-visible {
        outline: 2px solid #93c5fd;
        outline-offset: 2px;
    }
    button:disabled {
        opacity: 0.6;
        cursor: wait;
    }
    summary {
        cursor: pointer;
    }
    .extra {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
    }
    p {
        margin: 7px 0 0;
        overflow-wrap: anywhere;
    }
    .error {
        color: #fda4af;
    }
</style>
