import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useThrottleFn } from "../useThrottleFn";

describe("useThrottleFn", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it("首次调用应立即执行", () => {
        const fn = vi.fn();
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 200 }));

        act(() => {
            result.current("a");
        });
        expect(fn).toHaveBeenCalledWith("a");
    });

    it("间隔内多次调用应被节流", () => {
        const fn = vi.fn();
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 200 }));

        act(() => {
            result.current("a");
            result.current("b");
            result.current("c");
        });

        expect(fn).toHaveBeenCalledTimes(1);

        act(() => {
            vi.advanceTimersByTime(200);
        });
        // trailing 触发最后一次
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenLastCalledWith("c");
    });

    it("卸载时应自动 cancel", () => {
        const fn = vi.fn();
        const { result, unmount } = renderHook(() => useThrottleFn(fn, { wait: 200 }));

        act(() => {
            result.current("a");
            result.current("b");
        });

        unmount();

        act(() => {
            vi.advanceTimersByTime(200);
        });
        // 只有 leading 执行了
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("wait 变化时应取消旧任务并使用新等待时间", () => {
        const fn = vi.fn();
        const { result, rerender } = renderHook(
            ({ wait }) => useThrottleFn(fn, { wait, leading: false }),
            { initialProps: { wait: 200 } },
        );

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
