import { useEffect, useState } from "react";
import { usePersistFn } from "./usePersistFn";

export interface UseDarkOptions {
    className?: string;
    selector?: "html" | "body";
}

export interface UseDarkResult {
    isDark: boolean;
    toggleDark(): void;
}

/** 观察 html/body 的主题 class，并提供切换方法。 */
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
