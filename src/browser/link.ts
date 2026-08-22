/** 浏览器链接的标准目标或自定义浏览上下文名称 */
export type LinkTarget = "_blank" | "_self" | "_parent" | "_top" | string;

/**
 * 通过一次性链接打开地址，并固定添加 `noreferrer noopener`。
 *
 * 非浏览器环境不执行；调用结束后临时链接会被移除。
 */
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
