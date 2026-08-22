import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useEventListener } from "../useEventListener";

describe("useEventListener", () => {
    afterEach(cleanup);

    it("应监听 window 上的事件", () => {
        const handler = vi.fn();
        renderHook(() => useEventListener("click", handler));

        act(() => {
            window.dispatchEvent(new MouseEvent("click"));
        });

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("卸载后不应再触发", () => {
        const handler = vi.fn();
        const { unmount } = renderHook(() => useEventListener("click", handler));

        unmount();

        act(() => {
            window.dispatchEvent(new MouseEvent("click"));
        });

        expect(handler).not.toHaveBeenCalled();
    });

    it("应支持 target 为 DOM 元素", () => {
        const handler = vi.fn();
        const div = document.createElement("div");
        document.body.appendChild(div);

        renderHook(() => useEventListener("click", handler, { target: div }));

        act(() => {
            div.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(handler).toHaveBeenCalledTimes(1);

        document.body.removeChild(div);
    });

    it("应始终使用最新的 handler", () => {
        let version = 0;
        const handler1 = vi.fn(() => (version = 1));
        const handler2 = vi.fn(() => (version = 2));

        const { rerender } = renderHook(({ handler }) => useEventListener("click", handler), {
            initialProps: { handler: handler1 },
        });

        rerender({ handler: handler2 });

        act(() => {
            window.dispatchEvent(new MouseEvent("click"));
        });

        expect(version).toBe(2);
    });
});
