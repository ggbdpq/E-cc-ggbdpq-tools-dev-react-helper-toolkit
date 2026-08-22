import { dataURLtoBlob, urlToBase64 } from "./base64Conver";
import { openLink } from "./link";

export function downloadByOnlineUrl(
    url: string,
    filename: string,
    mime?: string,
    bom?: BlobPart,
): void {
    void urlToBase64(url).then((base64) => downloadByBase64(base64, filename, mime, bom));
}

export function downloadByBase64(buffer: string, filename: string, mime?: string, bom?: BlobPart): void {
    downloadByData(dataURLtoBlob(buffer), filename, mime, bom);
}

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
