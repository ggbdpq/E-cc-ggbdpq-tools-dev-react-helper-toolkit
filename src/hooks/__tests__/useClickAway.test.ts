import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useClickAway } from "../useClickAway";

describe("useClickAway", () => {
    afterEach(cleanup);

    it("点击外部区域应触发回调", () => {
        const handler = vi.fn();
        const { result } = renderHook(() => useClickAway(handler));

        const inside = document.createElement("div");
        document.body.appendChild(inside);

        // 模拟 ref 赋值
        Object.defineProperty(result.current, "current", {
            value: inside,
            writable: true,
        });

        // 点击外部
        act(() => {
            document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(handler).toHaveBeenCalledTimes(1);

        document.body.removeChild(inside);
    });

    it("点击内部区域不应触发回调", () => {
        const handler = vi.fn();
        const { result } = renderHook(() => useClickAway(handler));

        const inside = document.createElement("div");
        document.body.appendChild(inside);

        Object.defineProperty(result.current, "current", {
            value: inside,
            writable: true,
        });

        // 点击内部
        act(() => {
            inside.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(handler).not.toHaveBeenCalled();

        document.body.removeChild(inside);
    });

    it("卸载后不应再触发", () => {
        const handler = vi.fn();
        const { unmount } = renderHook(() => useClickAway(handler));

        unmount();

        act(() => {
            document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(handler).not.toHaveBeenCalled();
    });
});
