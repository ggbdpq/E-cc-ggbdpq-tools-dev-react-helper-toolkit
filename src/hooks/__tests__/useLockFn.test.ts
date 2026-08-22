import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useLockFn } from "../useLockFn";

describe("useLockFn", () => {
    afterEach(cleanup);

    it("应正常执行并返回结果", async () => {
        const fn = vi.fn(async (x: number) => x * 2);
        const { result } = renderHook(() => useLockFn(fn));

        let ret: number | undefined;
        await act(async () => {
            ret = await result.current(21);
        });

        expect(ret).toBe(42);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("执行期间应忽略后续调用", async () => {
        let resolve: () => void;
        const fn = vi.fn(
            () =>
                new Promise<string>((r) => {
                    resolve = () => r("done");
                }),
        );

        const { result } = renderHook(() => useLockFn(fn));

        let p1Result: string | undefined;
        let p2Result: string | undefined;

        await act(async () => {
            const p1 = result.current();
            const p2 = result.current();

            resolve!();
            p1Result = await p1;
            p2Result = await p2;
        });

        expect(p1Result).toBe("done");
        expect(p2Result).toBeUndefined();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("异常后应释放锁", async () => {
        const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce("ok");
        const { result } = renderHook(() => useLockFn(fn));

        await act(async () => {
            await expect(result.current()).rejects.toThrow("fail");
        });

        let ret: string | undefined;
        await act(async () => {
            ret = await result.current();
        });

        expect(ret).toBe("ok");
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
