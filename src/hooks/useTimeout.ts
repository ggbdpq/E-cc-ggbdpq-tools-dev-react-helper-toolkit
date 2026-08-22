import { useEffect } from "react";
import { usePersistFn } from "./usePersistFn";

/**
 * 根据 `delay` 创建随 React 生命周期自动清理的单次定时器。
 *
 * `delay` 为 `null` 或 `undefined` 时不启动，回调执行时读取最新的 `fn`。
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
