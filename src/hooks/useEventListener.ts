import { useEffect } from "react";
import { useLatest } from "./useLatest";

type Target = EventTarget | (() => EventTarget | null | undefined) | React.RefObject<EventTarget> | null | undefined;

/** 原生事件监听选项。 */
export interface UseEventListenerOptions {
    /** 事件目标，默认 window。支持 EventTarget / getter / RefObject */
    target?: Target;
    /** 是否在捕获阶段触发 */
    capture?: boolean;
    /** 是否只触发一次 */
    once?: boolean;
    /** 是否为 passive 事件 */
    passive?: boolean;
}

function getTargetElement(target: Target, defaultElement?: EventTarget): EventTarget | undefined {
    if (!target) return defaultElement;

    if (typeof target === "function") {
        return target() ?? undefined;
    }

    if ("current" in target) {
        return (target as React.RefObject<EventTarget>).current ?? undefined;
    }

    return target;
}

/**
 * 事件监听 hook
 *
 * 回调更新不会触发重新订阅；event、target 或监听选项变化时会正确清理并重建。
 *
 * @param event 事件名称
 * @param handler 事件回调；触发时读取最新函数
 * @param options 事件目标和原生 addEventListener 选项
 * @returns 无返回值
 *
 * @example
 * ```tsx
 * useEventListener('click', (e) => console.log(e), {
 *   target: buttonRef
 * });
 * ```
 */
export function useEventListener(
    event: string,
    handler: (event: Event) => void,
    options: UseEventListenerOptions = {},
): void {
    const handlerRef = useLatest(handler);
    const { target, capture, once, passive } = options;

    useEffect(() => {
        const defaultTarget = typeof window === "undefined" ? undefined : window;
        const targetElement = getTargetElement(target, defaultTarget);
        if (!targetElement?.addEventListener) return;

        const eventListener = (event: Event) => {
            return handlerRef.current(event);
        };

        targetElement.addEventListener(event, eventListener, {
            capture,
            once,
            passive,
        });

        return () => {
            targetElement.removeEventListener(event, eventListener, {
                capture,
            });
        };
    }, [capture, event, handlerRef, once, passive, target]);
}
