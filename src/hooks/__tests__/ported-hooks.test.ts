import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard, useCopyToClipboard } from "../useCopyToClipboard";
import { useDark } from "../useDark";
import { useLoader } from "../useLoader";
import { useResizeObserver } from "../useResizeObserver";
import { useScrollTo } from "../useScrollTo";

afterEach(() => {
    cleanup();
    document.documentElement.className = "";
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe("useCopyToClipboard", () => {
    it("复制文本并更新响应状态", () => {
        Object.defineProperty(document, "execCommand", { configurable: true, value: vi.fn(() => true) });
        expect(copyTextToClipboard("hello")).toBe(true);
        const { result } = renderHook(() => useCopyToClipboard("fallback"));
        act(() => result.current.update("hello"));
        expect(result.current.clipboardValue).toBe("hello");
        expect(result.current.copied).toBe(true);
        act(() => result.current.update("  "));
        expect(result.current.clipboardValue).toBe("  ");
        expect(result.current.copied).toBe(true);
    });
});

describe("useDark", () => {
    it("监听 class 并切换暗色状态", async () => {
        const { result } = renderHook(() => useDark());
        expect(result.current.isDark).toBe(false);
        act(() => result.current.toggleDark());
        await act(async () => Promise.resolve());
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(result.current.isDark).toBe(true);
    });
});

describe("useLoader", () => {
    it("加载 CSS 和脚本并在卸载时清理", async () => {
        const { result, unmount } = renderHook(() => useLoader());
        let cssPromise: Promise<unknown[]>;
        act(() => {
            cssPromise = result.current.loadCss({ src: "/app.css" })!;
        });
        const link = document.querySelector('link[href="/app.css"]') as HTMLLinkElement;
        act(() => link.dispatchEvent(new Event("load")));
        await expect(cssPromise!).resolves.toEqual([{ src: "/app.css", message: "加载成功" }]);

        let scriptPromise: Promise<unknown[]>;
        act(() => {
            scriptPromise = result.current.loadScript({ src: "/app.js" })!;
        });
        const script = document.querySelector('script[src="/app.js"]') as HTMLScriptElement;
        act(() => script.dispatchEvent(new Event("load")));
        await expect(scriptPromise!).resolves.toEqual([{ src: "/app.js", message: "加载成功" }]);
        unmount();
        expect(document.querySelector('link[href="/app.css"]')).toBeNull();
        expect(document.querySelector('script[src="/app.js"]')).toBeNull();
    });
});

describe("useResizeObserver", () => {
    let observe: ReturnType<typeof vi.fn>;
    let disconnect: ReturnType<typeof vi.fn>;
    let callback: ResizeObserverCallback;

    beforeEach(() => {
        observe = vi.fn();
        disconnect = vi.fn();
        class ResizeObserverMock {
            constructor(next: ResizeObserverCallback) {
                callback = next;
            }
            observe = observe;
            disconnect = disconnect;
        }
        vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    });

    it("观察目标并支持 stop/restart", () => {
        vi.useFakeTimers();
        const element = document.createElement("div");
        document.body.appendChild(element);
        const handler = vi.fn();
        const { result, unmount } = renderHook(() => useResizeObserver(element, handler, { immediate: false, time: 0 }));
        expect(observe).toHaveBeenCalledWith(element, { box: "content-box" });
        act(() => {
            callback([], {} as ResizeObserver);
            vi.advanceTimersByTime(0);
        });
        expect(handler).toHaveBeenCalledOnce();
        act(() => result.current.stop());
        expect(disconnect).toHaveBeenCalled();
        act(() => result.current.restart());
        expect(observe).toHaveBeenCalledTimes(2);
        unmount();
        expect(disconnect).toHaveBeenCalled();
    });
});

describe("useScrollTo", () => {
    it("立即滚动、回调并可停止", () => {
        const element = document.createElement("div");
        Object.defineProperties(element, {
            scrollHeight: { configurable: true, value: 500 },
            clientHeight: { configurable: true, value: 100 },
            scrollTop: { configurable: true, writable: true, value: 0 },
        });
        const callback = vi.fn();
        const { result } = renderHook(() =>
            useScrollTo({ el: element, to: 200, directions: "scrollTop", duration: 0, callback }),
        );
        act(() => result.current.start());
        expect(element.scrollTop).toBe(200);
        expect(callback).toHaveBeenCalledWith("滚动完毕");
        act(() => result.current.stop());
    });
});
