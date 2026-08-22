export type LinkTarget = "_blank" | "_self" | "_parent" | "_top" | string;

export function openLink(href: string, target: LinkTarget = "_blank"): void {
    if (typeof document === "undefined") return;
    document.getElementById("external")?.remove();
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = target;
    anchor.rel = "noreferrer noopener";
    anchor.id = "external";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}
