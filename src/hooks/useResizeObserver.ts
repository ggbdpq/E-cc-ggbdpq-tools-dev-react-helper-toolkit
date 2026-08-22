import { useEffect, useRef } from "react";
import { createDebouncedFn } from "../core/debounce";
import type { DebouncedFn } from "../core/debounce";
import { useLatest } from "./useLatest";
import { usePersistFn } from "./usePersistFn";

/** 被观察元素的定位方式；字符串会匹配全部符合条件的元素 */
export type ResizeTarget = Element | string | React.RefObject<Element | null>;

/** `useResizeObserver` 的观察配置 */
export interface UseResizeObserverOptions {
    /** 回调防抖时间，单位毫秒，默认 `40` */
    time?: number;
    /** 传给 `ResizeObserver.observe` 的盒模型，默认 `content-box` */
    box?: ResizeObserverBoxOptions;
    /** 是否在开始观察时用当前尺寸主动回调一次，默认 `true` */
    immediate?: boolean;
}

/** `useResizeObserver` 返回的生命周期控制方法 */
export interface UseResizeObserverResult {
    /** 取消防抖任务并断开当前观察器 */
    stop(): void;
    /** 重新解析目标并建立观察器；没有可用目标时保持停止 */
    restart(): void;
}

function resolveTarget(target: ResizeTarget): Element[] {
    if (typeof target === "string") return typeof document === "undefined" ? [] : [...document.querySelectorAll(target)];
    if ("current" in target) return target.current ? [target.current] : [];
    return [target];
}

/**
 * 挂载后观察一个或多个元素尺寸，支持防抖、停止和重新启动。
 *
 * 浏览器不支持 `ResizeObserver` 或没有匹配元素时保持停止；卸载时自动断开观察器。
 */
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
                    // ResizeObserver 没有同步读取 API，因此用当前布局尺寸构造首次通知。
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
