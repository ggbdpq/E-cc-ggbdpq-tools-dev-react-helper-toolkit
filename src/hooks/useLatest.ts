import { useRef } from "react";

/**
 * 返回引用稳定、`current` 始终指向最新值的 ref。
 *
 * React 16.8+ 兼容方案，适用于不应因回调变化而重建的订阅与定时器。
 *
 * @example
 * ```tsx
 * const latestCount = useLatest(count);
 * // 在异步回调中访问 latestCount.current 始终拿到最新的 count。
 * ```
 */
export function useLatest<T>(value: T): React.MutableRefObject<T> {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}
