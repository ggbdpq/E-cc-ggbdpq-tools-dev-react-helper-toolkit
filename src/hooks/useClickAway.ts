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
 * 区域外点击 hook
 *
 * 支持两种用法：
 * 1. 无 target 参数：返回 ref，绑定到目标元素
 * 2. 有 target 参数：传入 ref / getter / element
 *
 * @param onClickAway 点击区域外时的回调
 * @param target 可选的目标元素（支持多种格式）
 * @param events 监听的事件类型，默认 ['click']
 * @returns target 未传入时可绑定到目标元素的 ref
 *
 * @example
 * ```tsx
 * // 用法一：返回 ref
 * const ref = useClickAway(() => setOpen(false));
 * <div ref={ref}>...</div>
 *
 * // 用法二：传入 ref
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
