import { useEffect } from "react";
import { useLatest } from "./useLatest";

/** React interval Hook 配置 */
export interface UseIntervalOptions {
    /** 是否在启动时立即执行一次，默认 `false` */
    immediate?: boolean;
}

/**
 * 根据 `delay` 创建随 React 生命周期自动清理的重复定时器。
 *
 * `delay` 为 `null` 或 `undefined` 时不启动；`immediate` 为 `true` 时会先同步执行一次。
 */
export function useInterval(
    fn: () => void,
    delay: number | null | undefined,
    options?: UseIntervalOptions,
): void {
    const immediate = options?.immediate;
    const fnRef = useLatest(fn);

    useEffect(() => {
        if (delay === undefined || delay === null) return;

        if (immediate) {
            fnRef.current();
        }

        const timer = setInterval(() => {
            fnRef.current();
        }, delay);

        return () => {
            clearInterval(timer);
        };
    }, [delay, immediate]);
}
