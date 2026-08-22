/** 判断元素是否包含指定 class；非浏览器环境返回 `false` */
export function hasClass(element: Element, name: string): boolean {
    return typeof document !== "undefined" && element.classList.contains(name);
}

/** 为元素添加一个或两个 class；非浏览器环境不执行 */
export function addClass(element: Element, name: string, extraName?: string): void {
    if (typeof document === "undefined") return;
    element.classList.add(name);
    if (extraName) element.classList.add(extraName);
}

/** 从元素移除一个或两个 class；非浏览器环境不执行 */
export function removeClass(element: Element, name: string, extraName?: string): void {
    if (typeof document === "undefined") return;
    element.classList.remove(name);
    if (extraName) element.classList.remove(extraName);
}

/** 按 `enabled` 开关 class，默认操作 `document.body`；非浏览器环境不执行 */
export function toggleClass(enabled: boolean, name: string, element?: Element): void {
    if (typeof document === "undefined") return;
    (element ?? document.body).classList.toggle(name, enabled);
}

/** 返回元素 class：单个返回字符串，多个返回数组，无 class 或非浏览器环境返回空字符串 */
export function getClass(element: Element): string | string[] {
    if (typeof document === "undefined") return "";
    const names = [...element.classList];
    return names.length > 1 ? names : (names[0] ?? "");
}
