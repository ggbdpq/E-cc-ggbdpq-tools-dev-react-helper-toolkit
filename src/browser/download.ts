import { dataURLtoBlob, urlToBase64 } from "./base64Conver";
import { openLink } from "./link";

/**
 * 将在线图片异步转换为 Base64 后触发下载。
 *
 * 函数立即返回，不提供下载完成状态；转换失败会形成被拒绝的异步任务。
 */
export function downloadByOnlineUrl(
    url: string,
    filename: string,
    mime?: string,
    bom?: BlobPart,
): void {
    void urlToBase64(url).then((base64) => downloadByBase64(base64, filename, mime, bom));
}

/**
 * 将 Base64 data URL 转换为 Blob 后触发浏览器下载。
 *
 * 输入不是合法 data URL 时会抛出解码异常。
 */
export function downloadByBase64(buffer: string, filename: string, mime?: string, bom?: BlobPart): void {
    downloadByData(dataURLtoBlob(buffer), filename, mime, bom);
}

/**
 * 使用临时 Object URL 和隐藏链接下载二进制数据。
 *
 * 临时链接和 Object URL 会在触发点击后立即清理；非浏览器环境不执行。
 */
export function downloadByData(data: BlobPart, filename: string, mime?: string, bom?: BlobPart): void {
    if (typeof document === "undefined") return;
    const blob = new Blob(bom === undefined ? [data] : [bom, data], { type: mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.style.display = "none";
    anchor.href = url;
    anchor.download = filename;
    if (typeof anchor.download === "undefined") anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

/**
 * 直接通过链接触发下载，并为不支持 `download` 的浏览器回退到打开链接。
 *
 * @returns 非浏览器环境返回 `undefined`，iOS 不支持时返回 `false`，已触发操作时返回 `true`
 */
export function downloadByUrl(url: string, fileName: string, target = "_self"): boolean | undefined {
    if (typeof document === "undefined") return undefined;
    const userAgent = navigator.userAgent.toLowerCase();
    if (/(iP)/g.test(navigator.userAgent)) {
        console.error("Your browser does not support download!");
        return false;
    }
    if (userAgent.includes("chrome") || userAgent.includes("safari")) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = target;
        if (anchor.download !== undefined) anchor.download = fileName || url.substring(url.lastIndexOf("/") + 1);
        anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        return true;
    }
    openLink(url.includes("?") ? url : `${url}?download`, target);
    return true;
}
