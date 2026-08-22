export interface SvgInfo {
    width: number;
    height: number;
    body: string;
}

const EMPTY_SVG_INFO: SvgInfo = { width: 0, height: 0, body: "" };

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
