export type MouseEventName = "contextmenu" | "selectstart" | "copy";

function preventDefault(event: Event): void {
    event.preventDefault();
}

export function banMouseEvent(events: readonly MouseEventName[]): void {
    if (typeof document === "undefined") return;
    for (const event of events) document.addEventListener(event, preventDefault, { passive: false });
}

export function allowMouseEvent(events: readonly MouseEventName[]): void {
    if (typeof document === "undefined") return;
    for (const event of events) document.removeEventListener(event, preventDefault);
}
