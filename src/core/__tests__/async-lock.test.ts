import { describe, it, expect, vi } from "vitest";
import { createAsyncLock } from "../async-lock";

describe("createAsyncLock", () => {
    it("应在未锁定时执行函数并返回结果", async () => {
        const lock = createAsyncLock();
        const result = await lock.run(async () => 42);
        expect(result).toBe(42);
    });

    it("执行期间应处于锁定状态", async () => {
        const lock = createAsyncLock();
        let insideLocked = false;

        await lock.run(async () => {
            insideLocked = lock.isLocked;
        });

        expect(insideLocked).toBe(true);
        expect(lock.isLocked).toBe(false);
    });

    it("并发调用应忽略后续请求", async () => {
        const lock = createAsyncLock();
        const fn = vi.fn(async () => {
            await new Promise((r) => setTimeout(r, 100));
            return "done";
        });

        const p1 = lock.run(fn);
        const p2 = lock.run(fn);

        const [r1, r2] = await Promise.all([p1, p2]);

        expect(r1).toBe("done");
        expect(r2).toBeUndefined();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("异常后应自动释放锁", async () => {
        const lock = createAsyncLock();

        await expect(
            lock.run(async () => {
                throw new Error("fail");
            }),
        ).rejects.toThrow("fail");

        expect(lock.isLocked).toBe(false);

        // 后续调用应能正常执行
        const result = await lock.run(async () => "recovered");
        expect(result).toBe("recovered");
    });
});
