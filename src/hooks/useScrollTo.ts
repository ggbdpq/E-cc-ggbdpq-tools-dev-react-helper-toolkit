import { useEffect, useRef } from "react";
import { useLatest } from "./useLatest";
import { usePersistFn } from "./usePersistFn";

/** 支持动画写入的元素滚动轴属性 */
export type ScrollDirection = "scrollTop" | "scrollLeft";
/** 可直接传入元素，也可传入指向元素的 React ref */
export type ScrollElement = HTMLElement | React.RefObject<HTMLElement | null>;

/** `useScrollTo` 的滚动配置 */
export interface ScrollOptions {
    /** 需要滚动的元素 */
    el: ScrollElement;
    /** 目标滚动距离，单位像素；运行时会限制在元素可滚动范围内 */
    to: number;
    /** 滚动方向 */
    directions: ScrollDirection;
    /** 动画时长，单位毫秒；默认 `0`，表示立即滚动 */
    duration?: number;
    /** 滚动完成或无需滚动时的状态回调 */
    callback?: (message: "滚动完毕" | "无需滚动") => void;
}

/** `useScrollTo` 返回的动画控制器 */
export interface ScrollController {
    /** 从当前位置开始滚动；再次启动前必须先调用 `stop` */
    start(): void;
    /** 取消尚未完成的滚动动画 */
    stop(): void;
}

/** 二次缓入缓出函数的计算参数 */
export interface EaseInOutQuadOptions {
    /** 已经过的动画时间 */
    timeElapsed: number;
    /** 动画开始时的属性值 */
    startValue: number;
    /** 目标值与开始值之间的差值 */
    byValue: number;
    /** 动画总时长；各时间字段必须使用相同单位 */
    duration: number;
}

/** 根据已用时间计算二次缓入缓出的插值结果 */
export function easeInOutQuad(options: EaseInOutQuadOptions): number {
    let elapsed = options.timeElapsed / (options.duration / 2);
    if (elapsed < 1) return (options.byValue / 2) * elapsed ** 2 + options.startValue;
    elapsed--;
    return (-options.byValue / 2) * (elapsed * (elapsed - 2) - 1) + options.startValue;
}

/**
 * 创建可启动和停止的元素滚动控制器，不会在挂载时自动开始。
 *
 * 为保持现有调用语义，一次 `start` 后需要先执行 `stop` 才能开始下一次滚动。
 */
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
