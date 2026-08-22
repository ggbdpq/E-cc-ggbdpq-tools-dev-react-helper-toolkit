import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTimeout, createInterval } from "../timer";

describe("createTimeout", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("应在指定延迟后执行", () => {
        const fn = vi.fn();
        createTimeout(fn, 100);

        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("clear 后不应执行", () => {
        const fn = vi.fn();
        const handle = createTimeout(fn, 100);
        handle.clear();

        vi.advanceTimersByTime(200);
        expect(fn).not.toHaveBeenCalled();
    });
});

describe("createInterval", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("应按间隔重复执行", () => {
        const fn = vi.fn();
        createInterval(fn, 100);

        vi.advanceTimersByTime(350);
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("clear 后不再执行", () => {
        const fn = vi.fn();
        const handle = createInterval(fn, 100);

        vi.advanceTimersByTime(250);
        expect(fn).toHaveBeenCalledTimes(2);

        handle.clear();
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
