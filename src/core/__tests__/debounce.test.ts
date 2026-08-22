import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDebouncedFn } from "../debounce";

describe("createDebouncedFn", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("应在等待时间后执行", () => {
        const fn = vi.fn();
        const debounced = createDebouncedFn(fn, 200);

        debounced("a");
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledWith("a");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("多次调用应合并为最后一次", () => {
        const fn = vi.fn();
        const debounced = createDebouncedFn(fn, 200);

        debounced("a");
        debounced("b");
        debounced("c");

        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith("c");
    });

    it("cancel 应取消尚未执行的调用", () => {
        const fn = vi.fn();
        const debounced = createDebouncedFn(fn, 200);

        debounced("a");
        debounced.cancel();

        vi.advanceTimersByTime(300);
        expect(fn).not.toHaveBeenCalled();
    });

    it("flush 应立即执行尚未执行的调用", () => {
        const fn = vi.fn();
        const debounced = createDebouncedFn(fn, 200);

        debounced("a");
        debounced.flush();

        expect(fn).toHaveBeenCalledWith("a");
        expect(fn).toHaveBeenCalledTimes(1);

        // flush 后定时器不再触发
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("leading 模式应在首次调用时立即执行", () => {
        const fn = vi.fn();
        const debounced = createDebouncedFn(fn, 200, { leading: true, trailing: false });

        debounced("a");
        expect(fn).toHaveBeenCalledWith("a");
        expect(fn).toHaveBeenCalledTimes(1);

        // 后续调用不执行
        debounced("b");
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("leading + trailing 模式应首尾都执行", () => {
        const fn = vi.fn();
        const debounced = createDebouncedFn(fn, 200, { leading: true, trailing: true });

        debounced("a");
        expect(fn).toHaveBeenCalledWith("a");

        debounced("b");
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenLastCalledWith("b");
    });

    it("静默期结束后新一轮 leading 调用仍应立即执行", () => {
        const fn = vi.fn();
        const debounced = createDebouncedFn(fn, 200, { leading: true, trailing: false });

        debounced("first");
        vi.advanceTimersByTime(200);
        debounced("second");

        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenLastCalledWith("second");
    });
});
