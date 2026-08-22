import { useEffect } from "react";
import { useLatest } from "./useLatest";

/** React interval Hook 配置。 */
export interface UseIntervalOptions {
    /** 是否在启动时立即执行一次，默认 false */
    immediate?: boolean;
}

/**
 * setInterval hook
 *
 * delay 为 null / undefined 时不启动定时器。
 * 组件卸载时自动清理。StrictMode 安全。
 *
 * @param fn 回调函数
 * @param delay 间隔时间（ms），null/undefined 不启动
 * @param options immediate 选项
 * @returns 无返回值
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
