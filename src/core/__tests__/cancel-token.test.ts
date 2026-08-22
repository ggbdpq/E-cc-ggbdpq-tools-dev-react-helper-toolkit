import { describe, it, expect } from "vitest";
import { createCancelToken } from "../cancel-token";

describe("createCancelToken", () => {
    it("初始状态应为未取消", () => {
        const token = createCancelToken();
        expect(token.isCancelled).toBe(false);
        expect(token.signal.aborted).toBe(false);
    });

    it("cancel 后应标记为已取消", () => {
        const token = createCancelToken();
        token.cancel();
        expect(token.isCancelled).toBe(true);
        expect(token.signal.aborted).toBe(true);
    });

    it("cancel 应支持自定义原因", () => {
        const token = createCancelToken();
        token.cancel("user abort");
        expect(token.signal.reason).toBe("user abort");
    });

    it("signal 的 abort 事件应被触发", () => {
        const token = createCancelToken();
        let triggered = false;
        token.signal.addEventListener("abort", () => {
            triggered = true;
        });

        token.cancel();
        expect(triggered).toBe(true);
    });
});
