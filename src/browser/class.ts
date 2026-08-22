export function hasClass(element: Element, name: string): boolean {
    return typeof document !== "undefined" && element.classList.contains(name);
}

export function addClass(element: Element, name: string, extraName?: string): void {
    if (typeof document === "undefined") return;
    element.classList.add(name);
    if (extraName) element.classList.add(extraName);
}

export function removeClass(element: Element, name: string, extraName?: string): void {
    if (typeof document === "undefined") return;
    element.classList.remove(name);
    if (extraName) element.classList.remove(extraName);
}

export function toggleClass(enabled: boolean, name: string, element?: Element): void {
    if (typeof document === "undefined") return;
    (element ?? document.body).classList.toggle(name, enabled);
}

export function getClass(element: Element): string | string[] {
    if (typeof document === "undefined") return "";
    const names = [...element.classList];
    return names.length > 1 ? names : (names[0] ?? "");
}
