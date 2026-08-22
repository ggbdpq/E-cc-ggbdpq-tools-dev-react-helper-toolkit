import { useEffect, useRef } from "react";
import { usePersistFn } from "./usePersistFn";

/** 单组样式或脚本资源的加载配置 */
export interface LoadResourceOptions {
    /** 一个或多个资源地址 */
    src: string | readonly string[];
    /** 插入资源节点的位置；CSS 默认 `head`，脚本默认 `body` */
    element?: "head" | "body" | HTMLElement;
}

/** 单个资源加载成功后的结果；失败时对应 Promise 被拒绝 */
export interface LoadResult {
    /** 已完成加载的资源地址 */
    src: string;
    /** 与参考实现兼容的中文加载状态 */
    message: "加载成功" | "加载失败";
}

/** `useLoader` 返回的资源加载方法 */
export interface UseLoaderResult {
    /** 加载一个或多个 CSS；非浏览器环境返回 `undefined` */
    loadCss(options: LoadResourceOptions | readonly LoadResourceOptions[]): Promise<LoadResult[]> | undefined;
    /** 加载一个或多个脚本；非浏览器环境返回 `undefined` */
    loadScript(options: LoadResourceOptions | readonly LoadResourceOptions[]): Promise<LoadResult[]> | undefined;
}

let resourceId = 0;

/**
 * 动态加载 CSS 和脚本，并按 Hook 实例管理清理范围。
 *
 * 相同地址的现有节点会被替换并归当前实例管理；`destroy` 默认 `true`，卸载时移除这些节点。
 */
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
                        // 替换为克隆节点可重新触发 load/error，同时把新节点纳入当前 Hook 的清理范围。
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
