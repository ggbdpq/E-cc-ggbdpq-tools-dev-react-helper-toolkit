import { useRef } from "react";

type AnyFunction = (...args: never[]) => unknown;

/**
 * 返回一个引用稳定的函数
 * 调用时始终执行最新传入的 fn，但函数引用在整个组件生命周期内不变。
 *
 * @param fn 每次渲染传入的最新函数
 * @returns 生命周期内引用稳定的代理函数
 *
 * @example
 * ```tsx
 * const stableFn = usePersistFn((id: string) => fetchData(id));
 * // stableFn 可以安全放入依赖数组
 * ```
 */
export function usePersistFn<T extends AnyFunction>(fn: T): T {
    const fnRef = useRef(fn);
    fnRef.current = fn;

    const persistRef = useRef<T>();

    if (!persistRef.current) {
        persistRef.current = ((...args: Parameters<T>) => fnRef.current(...args)) as T;
    }

    return persistRef.current;
}
