import { useEffect, useRef } from "react";
import { useLatest } from "./useLatest";

type ClickAwayTarget =
    | EventTarget
    | (() => EventTarget | null | undefined)
    | React.RefObject<EventTarget>
    | null
    | undefined;

const DEFAULT_EVENTS: readonly string[] = ["click"];

function getElement(target: ClickAwayTarget): EventTarget | null {
    if (!target) return null;
    if (typeof target === "function") return target() ?? null;
    if ("current" in target) return (target as React.RefObject<EventTarget>).current ?? null;
    return target;
}

/**
 * 监听目标区域外的指定事件。
 *
 * 支持两种用法：
 * 1. 不传 `target`：使用返回的 ref 绑定目标元素。
 * 2. 传入 `target`：直接使用 ref、getter 或元素。
 *
 * @param events - 监听的事件类型，默认 `['click']`
 * @returns 未传入 `target` 时可绑定到目标元素的 ref
 *
 * @example
 * ```tsx
 * // 用法一：返回 ref。
 * const ref = useClickAway(() => setOpen(false));
 * <div ref={ref}>...</div>
 *
 * // 用法二：传入 ref。
 * const myRef = useRef(null);
 * useClickAway(() => setOpen(false), myRef);
 * ```
 */
export function useClickAway<T extends HTMLElement = HTMLElement>(
    onClickAway: (event: Event) => void,
    target?: ClickAwayTarget,
    events: readonly string[] = DEFAULT_EVENTS,
): React.RefObject<T | null> {
    const onClickAwayRef = useLatest(onClickAway);
    const domRef = useRef<T | null>(null);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const handler = (event: Event) => {
            const element = target ? getElement(target) : domRef.current;

            if (!element) return;

            if (element instanceof Node && event.target instanceof Node) {
                if (element.contains(event.target)) {
                    return;
                }
            }

            onClickAwayRef.current(event);
        };

        for (const eventName of events) {
            document.addEventListener(eventName, handler);
        }

        return () => {
            for (const eventName of events) {
                document.removeEventListener(eventName, handler);
            }
        };
    }, [events, onClickAwayRef, target]);

    return domRef;
}
