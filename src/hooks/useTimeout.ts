import { useEffect } from "react";
import { usePersistFn } from "./usePersistFn";

/**
 * setTimeout hook
 *
 * delay 为 null / undefined 时不启动定时器。
 * 组件卸载时自动清理。StrictMode 安全。
 *
 * @param fn 回调函数
 * @param delay 延迟时间（ms），null/undefined 不启动
 * @returns 无返回值
 */
export function useTimeout(fn: () => void, delay: number | null | undefined): void {
    const timerFn = usePersistFn(fn);

    useEffect(() => {
        if (delay === undefined || delay === null) return;

        const timer = setTimeout(() => {
            timerFn();
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [delay, timerFn]);
}
