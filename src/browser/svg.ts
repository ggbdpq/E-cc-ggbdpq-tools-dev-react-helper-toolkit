/** 从 SVG 根元素提取的尺寸和内部标记 */
export interface SvgInfo {
    /** 优先来自 viewBox 的宽度，无法解析时为 `0` */
    width: number;
    /** 优先来自 viewBox 的高度，无法解析时为 `0` */
    height: number;
    /** SVG 根元素内部的原始标记 */
    body: string;
}

const EMPTY_SVG_INFO: SvgInfo = { width: 0, height: 0, body: "" };

/**
 * 解析 SVG 文本的尺寸和根元素内容。
 *
 * 非浏览器环境、无效 XML 或缺少 SVG 根元素时返回宽高为 `0`、内容为空的结果。
 */
export function getSvgInfo(svg: string): SvgInfo {
    if (typeof document === "undefined") return { ...EMPTY_SVG_INFO };
    try {
        const documentNode = new DOMParser().parseFromString(svg, "image/svg+xml");
        if (documentNode.querySelector("parsererror")) return { ...EMPTY_SVG_INFO };
        const element = documentNode.querySelector("svg");
        if (!element) return { ...EMPTY_SVG_INFO };
        let width = 0;
        let height = 0;
        const viewBox = element.getAttribute("viewBox");
        if (viewBox) {
            const parts = viewBox.trim().split(/\s+/);
            if (parts.length >= 4) {
                width = Number.parseFloat(parts[2]) || 0;
                height = Number.parseFloat(parts[3]) || 0;
            }
        }
        if (width === 0 || height === 0) {
            width ||= Number.parseFloat(element.getAttribute("width") ?? "") || 0;
            height ||= Number.parseFloat(element.getAttribute("height") ?? "") || 0;
        }
        return { width, height, body: element.innerHTML || "" };
    } catch {
        return { ...EMPTY_SVG_INFO };
    }
}
