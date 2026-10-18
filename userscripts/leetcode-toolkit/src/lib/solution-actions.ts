import { mount, unmount } from "svelte";
import SolutionExport from "./SolutionExport.svelte";
import { watchSolutionToolbar } from "./solution-toolbar";

let started = false;

export function initSolutionToolbar(): void {
    if (started) return;
    started = true;
    watchSolutionToolbar((host, kind) => {
        const component = mount(SolutionExport, {
            target: host,
            props: { kind },
        });
        return () => {
            void unmount(component);
        };
    });
}
