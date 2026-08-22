import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useDebounceFn } from "../useDebounceFn";

describe("useDebounceFn", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it("应在 wait 时间后执行", () => {
        const fn = vi.fn();
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 200 }));

        act(() => {
            result.current("hello");
        });
        expect(fn).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(fn).toHaveBeenCalledWith("hello");
    });

    it("多次调用应合并为最后一次", () => {
        const fn = vi.fn();
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 200 }));

        act(() => {
            result.current("a");
            result.current("b");
            result.current("c");
        });

        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith("c");
    });

    it("cancel 应取消待执行的调用", () => {
        const fn = vi.fn();
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 200 }));

        act(() => {
            result.current("a");
            result.current.cancel();
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(fn).not.toHaveBeenCalled();
    });

    it("卸载时应自动 cancel", () => {
        const fn = vi.fn();
        const { result, unmount } = renderHook(() => useDebounceFn(fn, { wait: 200 }));

        act(() => {
            result.current("a");
        });

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

        const { result, rerender } = renderHook(({ fn }) => useDebounceFn(fn, { wait: 200 }), {
            initialProps: { fn: fn1 },
        });

        act(() => {
            result.current("x");
        });

        rerender({ fn: fn2 });

        act(() => {
            vi.advanceTimersByTime(200);
        });

        expect(version).toBe(2);
        expect(fn2).toHaveBeenCalledWith("x");
    });

    it("wait 变化时应取消旧任务并使用新等待时间", () => {
        const fn = vi.fn();
        const { result, rerender } = renderHook(({ wait }) => useDebounceFn(fn, { wait }), {
            initialProps: { wait: 200 },
        });

        act(() => {
            result.current("old");
        });
        rerender({ wait: 50 });
        act(() => {
            result.current("new");
            vi.advanceTimersByTime(50);
        });

        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith("new");
    });
});
