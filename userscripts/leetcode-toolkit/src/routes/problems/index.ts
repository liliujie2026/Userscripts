import { problemState } from "./state";
import { initDescriptionTab } from "./description";
import { initSolutionToolbar } from "$lib/solution-actions";

async function main() {
    initSolutionToolbar();
    // A missing editor or description pane must not disable solution exports.
    const results = await Promise.allSettled([
        problemState.patchMonacoEditor(),
        initDescriptionTab(),
    ]);
    for (const result of results) {
        if (result.status === "rejected") console.warn(result.reason);
    }
}

export { main as problemPage };
