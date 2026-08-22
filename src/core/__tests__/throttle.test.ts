import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createThrottledFn } from "../throttle";

describe("createThrottledFn", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("首次调用应立即执行（leading 默认 true）", () => {
        const fn = vi.fn();
        const throttled = createThrottledFn(fn, 200);

        throttled("a");
        expect(fn).toHaveBeenCalledWith("a");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("间隔内多次调用应被节流", () => {
        const fn = vi.fn();
        const throttled = createThrottledFn(fn, 200);

        throttled("a");
        throttled("b");
        throttled("c");

        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith("a");

        // trailing 触发最后一次
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenLastCalledWith("c");
    });

    it("cancel 应阻止后续执行", () => {
        const fn = vi.fn();
        const throttled = createThrottledFn(fn, 200);

        throttled("a");
        throttled("b");
        throttled.cancel();

        vi.advanceTimersByTime(200);
        // 只有首次 leading 执行了
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("trailing: false 应禁止后沿触发", () => {
        const fn = vi.fn();
        const throttled = createThrottledFn(fn, 200, { trailing: false });

        throttled("a");
        throttled("b");

        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith("a");
    });

    it("多个间隔后应再次允许执行", () => {
        const fn = vi.fn();
        const throttled = createThrottledFn(fn, 200);

        throttled("a");
        vi.advanceTimersByTime(200);

        throttled("b");
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenLastCalledWith("b");
    });

    it("leading 为 false 时每个独立调用窗口都应延迟执行", () => {
        const fn = vi.fn();
        const throttled = createThrottledFn(fn, 200, { leading: false });

        throttled("first");
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenLastCalledWith("first");

        vi.advanceTimersByTime(300);
        throttled("second");
        expect(fn).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenLastCalledWith("second");
    });

    it("leading 和 trailing 均为 false 时不应执行", () => {
        const fn = vi.fn();
        const throttled = createThrottledFn(fn, 200, { leading: false, trailing: false });

        throttled("first");
        vi.advanceTimersByTime(200);
        throttled("second");
        vi.advanceTimersByTime(200);

        expect(fn).not.toHaveBeenCalled();
    });
});
