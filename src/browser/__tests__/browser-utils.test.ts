import { afterEach, describe, expect, it, vi } from "vitest";
import { allowMouseEvent, banMouseEvent } from "../banMouseEvent";
import { dataURLtoBlob } from "../base64Conver";
import { addClass, getClass, hasClass, removeClass, toggleClass } from "../class";
import { deviceDetection, getBrowserInfo } from "../device";
import { downloadByBase64, downloadByData, downloadByUrl } from "../download";
import { openLink } from "../link";
import { getPerformance } from "../performance";
import { storageLocal, storageSession } from "../storage";
import { getSvgInfo } from "../svg";

afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe("DOM browser utils", () => {
    it("禁止并恢复指定鼠标事件", () => {
        banMouseEvent(["contextmenu"]);
        const blocked = new MouseEvent("contextmenu", { cancelable: true });
        document.dispatchEvent(blocked);
        expect(blocked.defaultPrevented).toBe(true);
        allowMouseEvent(["contextmenu"]);
        const allowed = new MouseEvent("contextmenu", { cancelable: true });
        document.dispatchEvent(allowed);
        expect(allowed.defaultPrevented).toBe(false);
    });

    it("操作元素 class", () => {
        const element = document.createElement("div");
        addClass(element, "first", "second");
        expect(hasClass(element, "first")).toBe(true);
        expect(getClass(element)).toEqual(["first", "second"]);
        removeClass(element, "first");
        expect(getClass(element)).toBe("second");
        toggleClass(true, "active", element);
        expect(hasClass(element, "active")).toBe(true);
    });

    it("创建安全外链", () => {
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
        expect(openLink("https://example.com")).toBeUndefined();
        expect(click).toHaveBeenCalledOnce();
        expect(document.getElementById("external")).toBeNull();
    });
});

describe("binary and download utils", () => {
    it("将 data URL 转为 Blob", async () => {
        const blob = dataURLtoBlob("data:text/plain;base64,dGVzdA==");
        expect(blob.type).toBe("text/plain");
        const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsText(blob);
        });
        expect(content).toBe("test");
    });

    it("下载 Blob、Base64 和 URL", () => {
        const createObjectURL = vi.fn(() => "blob:test");
        const revokeObjectURL = vi.fn();
        Object.defineProperties(window.URL, {
            createObjectURL: { configurable: true, value: createObjectURL },
            revokeObjectURL: { configurable: true, value: revokeObjectURL },
        });
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
        downloadByData("test", "test.txt", "text/plain");
        downloadByBase64("data:text/plain;base64,dGVzdA==", "test.txt");
        expect(createObjectURL).toHaveBeenCalledTimes(2);
        expect(revokeObjectURL).toHaveBeenCalledTimes(2);
        expect(downloadByUrl("https://example.com/test.txt", "test.txt")).toBe(true);
    });
});

describe("storage, environment and SVG utils", () => {
    it("读写本地和会话 Storage", () => {
        const local = storageLocal();
        local.setItem("user", { id: 1 });
        expect(local.getItem<{ id: number }>("user")).toEqual({ id: 1 });
        local.removeItem("user");
        expect(local.getItem("user")).toBeNull();
        const session = storageSession();
        session.setItem("value", 1);
        expect(session.getItem<number>("value")).toBe(1);
    });

    it("检测设备和浏览器", () => {
        expect(typeof deviceDetection()).toBe("boolean");
        expect(getBrowserInfo()).toEqual(expect.objectContaining({ browser: expect.any(String), version: expect.any(String) }));
    });

    it("解析 SVG 尺寸和主体", () => {
        expect(getSvgInfo('<svg viewBox="0 0 24 12"><path d="M0 0" /></svg>')).toEqual({
            width: 24,
            height: 12,
            body: '<path d="M0 0"/>',
        });
        expect(getSvgInfo("invalid")).toEqual({ width: 0, height: 0, body: "" });
    });

    it("读取页面性能计时", async () => {
        vi.useFakeTimers();
        Object.defineProperty(window.performance, "timing", {
            configurable: true,
            value: {
                domainLookupStart: 0,
                domainLookupEnd: 100,
                connectStart: 100,
                connectEnd: 300,
                responseStart: 300,
                responseEnd: 700,
                domInteractive: 700,
                domComplete: 1200,
                navigationStart: 0,
            },
        });
        const result = getPerformance();
        await vi.advanceTimersByTimeAsync(500);
        await expect(result).resolves.toEqual({ dns: 0.1, tcp: 0.2, request: 0.4, dom: 0.5, whiteScreen: 1.2 });
    });
});
