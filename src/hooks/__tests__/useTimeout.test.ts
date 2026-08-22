import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useTimeout } from "../useTimeout";

describe("useTimeout", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it("应在指定延迟后执行回调", () => {
        const fn = vi.fn();
        renderHook(() => useTimeout(fn, 200));

        expect(fn).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("delay 为 null 时不应执行", () => {
        const fn = vi.fn();
        renderHook(() => useTimeout(fn, null));

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(fn).not.toHaveBeenCalled();
    });

    it("delay 为 undefined 时不应执行", () => {
        const fn = vi.fn();
        renderHook(() => useTimeout(fn, undefined));

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(fn).not.toHaveBeenCalled();
    });

    it("卸载后不应执行回调", () => {
        const fn = vi.fn();
        const { unmount } = renderHook(() => useTimeout(fn, 200));

        unmount();

        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(fn).not.toHaveBeenCalled();
    });

    it("应始终使用最新的 fn", () => {
        let version = 0;
        const fn1 = vi.fn(() => (version = 1));
        const fn2 = vi.fn(() => (version = 2));

        const { rerender } = renderHook(({ fn }) => useTimeout(fn, 200), {
            initialProps: { fn: fn1 },
        });

        rerender({ fn: fn2 });

        act(() => {
            vi.advanceTimersByTime(200);
        });

        expect(version).toBe(2);
    });
});
