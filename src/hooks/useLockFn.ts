import { useRef } from "react";
import { createAsyncLock } from "../core/async-lock";
import { usePersistFn } from "./usePersistFn";

/**
 * 异步锁 hook
 *
 * 传入一个 async 函数，返回一个加锁版本。
 * 执行期间再次调用会被忽略，避免重复提交。
 * 无论成功或异常，执行结束后自动释放锁。
 *
 * @param fn 需要防重复执行的异步函数
 * @returns 引用稳定的加锁函数；锁定期间调用返回 undefined
 *
 * @example
 * ```tsx
 * const submit = useLockFn(async (data) => {
 *   await api.post('/submit', data);
 * });
 * ```
 */
export function useLockFn<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult | undefined> {
    const lockRef = useRef<ReturnType<typeof createAsyncLock>>();
    if (!lockRef.current) {
        lockRef.current = createAsyncLock();
    }
    const lock = lockRef.current;

    return usePersistFn((...args: TArgs) => lock.run(fn, ...args));
}
