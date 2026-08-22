import { describe, it, expect, vi } from "vitest";
import { createEventEmitter } from "../event-emitter";

type TestEvents = {
    change: string;
    count: number;
    reset: void;
};

describe("createEventEmitter", () => {
    it("on + emit 应正确触发回调", () => {
        const emitter = createEventEmitter<TestEvents>();
        const handler = vi.fn();

        emitter.on("change", handler);
        emitter.emit("change", "hello");

        expect(handler).toHaveBeenCalledWith("hello");
    });

    it("off 应取消订阅", () => {
        const emitter = createEventEmitter<TestEvents>();
        const handler = vi.fn();

        emitter.on("change", handler);
        emitter.off("change", handler);
        emitter.emit("change", "hello");

        expect(handler).not.toHaveBeenCalled();
    });

    it("once 应只触发一次", () => {
        const emitter = createEventEmitter<TestEvents>();
        const handler = vi.fn();

        emitter.once("count", handler);
        emitter.emit("count", 1);
        emitter.emit("count", 2);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);
    });

    it("clear 应清除所有订阅", () => {
        const emitter = createEventEmitter<TestEvents>();
        const h1 = vi.fn();
        const h2 = vi.fn();

        emitter.on("change", h1);
        emitter.on("count", h2);
        emitter.clear();

        emitter.emit("change", "a");
        emitter.emit("count", 1);

        expect(h1).not.toHaveBeenCalled();
        expect(h2).not.toHaveBeenCalled();
    });

    it("同一事件可注册多个处理器", () => {
        const emitter = createEventEmitter<TestEvents>();
        const h1 = vi.fn();
        const h2 = vi.fn();

        emitter.on("change", h1);
        emitter.on("change", h2);
        emitter.emit("change", "x");

        expect(h1).toHaveBeenCalledWith("x");
        expect(h2).toHaveBeenCalledWith("x");
    });

    it("emit 时修改订阅不影响当前迭代", () => {
        const emitter = createEventEmitter<TestEvents>();
        const h2 = vi.fn();
        const h1 = vi.fn(() => {
            emitter.off("change", h2);
        });

        emitter.on("change", h1);
        emitter.on("change", h2);
        emitter.emit("change", "x");

        // h2 在当前 emit 中仍被调用（因为做了快照）
        expect(h1).toHaveBeenCalledTimes(1);
        expect(h2).toHaveBeenCalledTimes(1);
    });

    it("once 回调抛错后也应完成退订", () => {
        const emitter = createEventEmitter<TestEvents>();
        const handler = vi.fn(() => {
            throw new Error("fail");
        });

        emitter.once("change", handler);

        expect(() => emitter.emit("change", "first")).toThrow("fail");
        expect(() => emitter.emit("change", "second")).not.toThrow();
        expect(handler).toHaveBeenCalledTimes(1);
    });
});
