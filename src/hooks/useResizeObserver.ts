import { useEffect, useRef } from "react";
import { createDebouncedFn } from "../core/debounce";
import type { DebouncedFn } from "../core/debounce";
import { useLatest } from "./useLatest";
import { usePersistFn } from "./usePersistFn";

export type ResizeTarget = Element | string | React.RefObject<Element | null>;

export interface UseResizeObserverOptions {
    time?: number;
    box?: ResizeObserverBoxOptions;
    immediate?: boolean;
}

export interface UseResizeObserverResult {
    stop(): void;
    restart(): void;
}

function resolveTarget(target: ResizeTarget): Element[] {
    if (typeof target === "string") return typeof document === "undefined" ? [] : [...document.querySelectorAll(target)];
    if ("current" in target) return target.current ? [target.current] : [];
    return [target];
}

/** 观察一个或多个元素尺寸，支持防抖、停止和重新启动。 */
export function useResizeObserver(
    target: ResizeTarget | readonly ResizeTarget[],
    callback: ResizeObserverCallback,
    options: UseResizeObserverOptions = {},
): UseResizeObserverResult {
    const callbackRef = useLatest(callback);
    const observerRef = useRef<ResizeObserver | null>(null);
    const debouncedRef = useRef<DebouncedFn<ResizeObserverCallback> | null>(null);
    const time = options.time ?? 40;
    const box = options.box ?? "content-box";
    const immediate = options.immediate ?? true;

    const stop = usePersistFn(() => {
        debouncedRef.current?.cancel();
        debouncedRef.current = null;
        observerRef.current?.disconnect();
        observerRef.current = null;
    });
    const restart = usePersistFn(() => {
        if (typeof ResizeObserver === "undefined") return;
        stop();
        const elements = (Array.isArray(target) ? target : [target]).flatMap(resolveTarget);
        if (elements.length === 0) return;
        const debounced = createDebouncedFn<ResizeObserverCallback>(
            (entries, observer) => callbackRef.current(entries, observer),
            time,
        );
        debouncedRef.current = debounced;
        const observer = new ResizeObserver((entries) => debounced(entries, observer));
        observerRef.current = observer;
        for (const element of elements) {
            observer.observe(element, { box });
            if (immediate) {
                const rect = element.getBoundingClientRect();
                const size = [{ inlineSize: rect.width, blockSize: rect.height }];
                callbackRef.current(
                    [
                        {
                            target: element,
                            contentRect: rect,
                            borderBoxSize: size,
                            contentBoxSize: size,
                            devicePixelContentBoxSize: size,
                        } as ResizeObserverEntry,
                    ],
                    observer,
                );
            }
        }
    });

    useEffect(() => {
        restart();
        return stop;
    }, [box, immediate, restart, stop, target, time]);

    return { stop, restart };
}
