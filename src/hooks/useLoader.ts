import { useEffect, useRef } from "react";
import { usePersistFn } from "./usePersistFn";

export interface LoadResourceOptions {
    src: string | readonly string[];
    element?: "head" | "body" | HTMLElement;
}

export interface LoadResult {
    src: string;
    message: "加载成功" | "加载失败";
}

export interface UseLoaderResult {
    loadCss(options: LoadResourceOptions | readonly LoadResourceOptions[]): Promise<LoadResult[]> | undefined;
    loadScript(options: LoadResourceOptions | readonly LoadResourceOptions[]): Promise<LoadResult[]> | undefined;
}

let resourceId = 0;

/** 动态加载 CSS 和脚本，并按 Hook 实例管理清理范围。 */
export function useLoader(destroy = true): UseLoaderResult {
    const ownedElements = useRef(new Set<Element>());

    const loadResource = usePersistFn(
        (input: LoadResourceOptions | readonly LoadResourceOptions[], type: "css" | "script") => {
            if (typeof document === "undefined") return undefined;
            const options: readonly LoadResourceOptions[] = Array.isArray(input)
                ? input
                : [input as LoadResourceOptions];
            const promises = options.flatMap((option) =>
                (typeof option.src === "string" ? [option.src] : option.src).map((source: string) => {
                    const selector = type === "css" ? `link[href="${source}"]` : `script[src="${source}"]`;
                    const existing = document.querySelector(selector);
                    let element: HTMLLinkElement | HTMLScriptElement;
                    if (existing) {
                        element = existing.cloneNode(false) as HTMLLinkElement | HTMLScriptElement;
                        existing.replaceWith(element);
                    } else if (type === "css") {
                        element = document.createElement("link");
                        element.rel = "stylesheet";
                        element.href = source;
                    } else {
                        element = document.createElement("script");
                        element.type = "text/javascript";
                        element.src = source;
                    }
                    element.id = `pure-utils-${type}-${Date.now()}-${resourceId++}`;
                    const parent =
                        option.element instanceof HTMLElement
                            ? option.element
                            : option.element === "head" || (option.element === undefined && type === "css")
                              ? document.head
                              : document.body;
                    if (!element.isConnected) parent.appendChild(element);
                    ownedElements.current.add(element);
                    return new Promise<LoadResult>((resolve, reject) => {
                        element.onload = () => resolve({ src: source, message: "加载成功" });
                        element.onerror = () => reject({ src: source, message: "加载失败" });
                    });
                }),
            );
            return Promise.all(promises);
        },
    );

    useEffect(() => {
        const elements = ownedElements.current;
        return () => {
            if (destroy) for (const element of elements) element.remove();
            elements.clear();
        };
    }, [destroy]);

    const loadCss = usePersistFn((options: LoadResourceOptions | readonly LoadResourceOptions[]) =>
        loadResource(options, "css"),
    );
    const loadScript = usePersistFn((options: LoadResourceOptions | readonly LoadResourceOptions[]) =>
        loadResource(options, "script"),
    );
    return { loadCss, loadScript };
}
