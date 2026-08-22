/** 可以在 `document` 上统一禁止或恢复的鼠标相关事件 */
export type MouseEventName = "contextmenu" | "selectstart" | "copy";

function preventDefault(event: Event): void {
    event.preventDefault();
}

/**
 * 在 `document` 上阻止指定事件的默认行为。
 *
 * 非浏览器环境不执行；注册是全局性的，不再需要时应通过 `allowMouseEvent` 恢复同一组事件。
 */
export function banMouseEvent(events: readonly MouseEventName[]): void {
    if (typeof document === "undefined") return;
    for (const event of events) document.addEventListener(event, preventDefault, { passive: false });
}

/**
 * 移除由 `banMouseEvent` 注册的指定全局事件拦截器。
 *
 * 非浏览器环境不执行；只恢复 `events` 中列出的事件。
 */
export function allowMouseEvent(events: readonly MouseEventName[]): void {
    if (typeof document === "undefined") return;
    for (const event of events) document.removeEventListener(event, preventDefault);
}
