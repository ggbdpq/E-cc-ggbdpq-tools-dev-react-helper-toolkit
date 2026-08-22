import { useEffect, useMemo } from "react";
import { createDebouncedFn } from "../core/debounce";
import type { DebouncedFn, DebounceOptions } from "../core/debounce";
import { useLatest } from "./useLatest";

type AnyFunction = (...args: never[]) => unknown;

/** React 防抖 Hook 配置。 */
export interface UseDebounceFnOptions extends DebounceOptions {
    /** 等待时间（ms），默认 1000 */
    wait?: number;
}

/**
 * 防抖 hook
 *
 * 使用 Core 层防抖函数，零外部依赖。卸载或配置变化时自动取消旧任务。
 *
 * @param fn 需要防抖的函数；每次执行都会读取最新函数引用
 * @param options 等待时间以及前沿、后沿触发配置
 * @returns 带 cancel 和 flush 方法的稳定防抖函数；配置变化时返回新实例
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebounceFn(
 *   (keyword: string) => search(keyword),
 *   { wait: 300 }
 * );
 * // debouncedSearch('hello')
 * // debouncedSearch.cancel()
 * // debouncedSearch.flush()
 * ```
 */
export function useDebounceFn<T extends AnyFunction>(
    fn: T,
    options: UseDebounceFnOptions = {},
): DebouncedFn<T> {
    const fnRef = useLatest(fn);

    const { wait = 1000, leading, trailing } = options;

    const debounced = useMemo(
        () =>
            createDebouncedFn(
                (...args: Parameters<T>) => fnRef.current(...args),
                wait,
                { leading, trailing },
            ),
        [wait, leading, trailing],
    );

    useEffect(() => {
        return () => {
            debounced.cancel();
        };
    }, [debounced]);

    return debounced;
}
