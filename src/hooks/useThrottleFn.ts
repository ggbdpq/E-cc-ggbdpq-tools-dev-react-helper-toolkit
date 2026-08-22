import { useEffect, useMemo } from "react";
import { createThrottledFn } from "../core/throttle";
import type { ThrottledFn, ThrottleOptions } from "../core/throttle";
import { useLatest } from "./useLatest";

type AnyFunction = (...args: never[]) => unknown;

/** React 节流 Hook 配置。 */
export interface UseThrottleFnOptions extends ThrottleOptions {
    /** 间隔时间（ms），默认 1000 */
    wait?: number;
}

/**
 * 节流 hook
 *
 * 卸载或配置变化时自动取消旧任务。
 *
 * @param fn 需要节流的函数；每次执行都会读取最新函数引用
 * @param options 间隔时间以及前沿、后沿触发配置
 * @returns 带 cancel 方法的稳定节流函数；配置变化时返回新实例
 *
 * @example
 * ```tsx
 * const throttledScroll = useThrottleFn(handleScroll, { wait: 200 });
 * ```
 */
export function useThrottleFn<T extends AnyFunction>(
    fn: T,
    options: UseThrottleFnOptions = {},
): ThrottledFn<T> {
    const fnRef = useLatest(fn);

    const { wait = 1000, leading, trailing } = options;

    const throttled = useMemo(
        () =>
            createThrottledFn(
                (...args: Parameters<T>) => fnRef.current(...args),
                wait,
                { leading, trailing },
            ),
        [wait, leading, trailing],
    );

    useEffect(() => {
        return () => {
            throttled.cancel();
        };
    }, [throttled]);

    return throttled;
}
