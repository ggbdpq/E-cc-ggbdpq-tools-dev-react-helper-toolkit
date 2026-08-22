import { useEffect, useRef } from "react";
import { useLatest } from "./useLatest";
import { usePersistFn } from "./usePersistFn";

export type ScrollDirection = "scrollTop" | "scrollLeft";
export type ScrollElement = HTMLElement | React.RefObject<HTMLElement | null>;

export interface ScrollOptions {
    el: ScrollElement;
    to: number;
    directions: ScrollDirection;
    duration?: number;
    callback?: (message: "滚动完毕" | "无需滚动") => void;
}

export interface ScrollController {
    start(): void;
    stop(): void;
}

export interface EaseInOutQuadOptions {
    timeElapsed: number;
    startValue: number;
    byValue: number;
    duration: number;
}

export function easeInOutQuad(options: EaseInOutQuadOptions): number {
    let elapsed = options.timeElapsed / (options.duration / 2);
    if (elapsed < 1) return (options.byValue / 2) * elapsed ** 2 + options.startValue;
    elapsed--;
    return (-options.byValue / 2) * (elapsed * (elapsed - 2) - 1) + options.startValue;
}

/** 创建可启动和停止的元素滚动控制器。 */
export function useScrollTo(options: ScrollOptions): ScrollController {
    const optionsRef = useLatest(options);
    const frameRef = useRef<number | null>(null);
    const scrollingRef = useRef(false);
    const stop = usePersistFn(() => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        scrollingRef.current = false;
    });
    const start = usePersistFn(() => {
        if (scrollingRef.current) return;
        const current = optionsRef.current;
        const element = "current" in current.el ? current.el.current : current.el;
        if (!element) return;
        scrollingRef.current = true;
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        const maximum =
            current.directions === "scrollTop"
                ? element.scrollHeight - element.clientHeight
                : element.scrollWidth - element.clientWidth;
        const destination = Math.max(0, Math.min(current.to, maximum));
        const duration = current.duration ?? 0;
        if (duration === 0 || element[current.directions] === destination) {
            const unchanged = element[current.directions] === destination && duration !== 0;
            element[current.directions] = destination;
            current.callback?.(unchanged ? "无需滚动" : "滚动完毕");
            return;
        }
        const startValue = element[current.directions];
        const distance = destination - startValue;
        const increment = Math.max(1, duration / 60);
        let elapsed = 0;
        const animate = () => {
            elapsed += increment;
            element[current.directions] = easeInOutQuad({ timeElapsed: elapsed, startValue, byValue: distance, duration });
            if (elapsed < duration) {
                frameRef.current = requestAnimationFrame(animate);
                return;
            }
            element[current.directions] = destination;
            frameRef.current = null;
            current.callback?.("滚动完毕");
        };
        frameRef.current = requestAnimationFrame(animate);
    });
    useEffect(() => stop, [stop]);
    return { start, stop };
}
