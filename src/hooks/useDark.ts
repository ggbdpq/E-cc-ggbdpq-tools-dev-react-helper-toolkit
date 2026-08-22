import { useEffect, useState } from "react";
import { usePersistFn } from "./usePersistFn";

/** `useDark` 的主题类名配置 */
export interface UseDarkOptions {
    /** 表示深色主题的 class，默认 `dark` */
    className?: string;
    /** 被观察和切换 class 的根节点，默认 `html` */
    selector?: "html" | "body";
}

/** `useDark` 返回的主题状态和操作 */
export interface UseDarkResult {
    /** 目标节点当前是否包含深色主题 class */
    isDark: boolean;
    /** 切换目标节点上的深色主题 class */
    toggleDark(): void;
}

/**
 * 观察 `html` 或 `body` 的主题 class，并提供引用稳定的切换方法。
 *
 * 初始状态为 `false`，挂载后会读取 DOM 并通过 `MutationObserver` 同步后续变化。
 */
export function useDark(options: UseDarkOptions = {}): UseDarkResult {
    const className = options.className ?? "dark";
    const selector = options.selector ?? "html";
    const [isDark, setIsDark] = useState(false);
    const getElement = usePersistFn(() => (selector === "body" ? document.body : document.documentElement));
    const toggleDark = usePersistFn(() => getElement().classList.toggle(className));

    useEffect(() => {
        if (typeof document === "undefined") return;
        const element = getElement();
        const update = () => setIsDark(element.classList.contains(className));
        update();
        const observer = new MutationObserver(update);
        observer.observe(element, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, [className, getElement, selector]);

    return { isDark, toggleDark };
}
