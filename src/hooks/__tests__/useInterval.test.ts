import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useInterval } from "../useInterval";

describe("useInterval", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it("应按间隔重复执行", () => {
        const fn = vi.fn();
        renderHook(() => useInterval(fn, 100));

        act(() => {
            vi.advanceTimersByTime(350);
        });
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("immediate: true 应在启动时立即执行一次", () => {
        const fn = vi.fn();
        renderHook(() => useInterval(fn, 100, { immediate: true }));

        // immediate 执行
        expect(fn).toHaveBeenCalledTimes(1);

        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("delay 为 null 时不应执行", () => {
        const fn = vi.fn();
        renderHook(() => useInterval(fn, null));

        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(fn).not.toHaveBeenCalled();
    });

    it("卸载后不应继续执行", () => {
        const fn = vi.fn();
        const { unmount } = renderHook(() => useInterval(fn, 100));

        act(() => {
            vi.advanceTimersByTime(250);
        });
        expect(fn).toHaveBeenCalledTimes(2);

        unmount();

        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
