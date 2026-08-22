import { useEffect, useRef } from "react";
import { debounce } from "../utils/debounce";
import { usePersistFn } from "./usePersistFn";

/** Canvas 线性渐变中的单个色标 */
export interface WatermarkGradientStop {
    /** 色标位置，取值范围遵循 Canvas：`0` 到 `1` */
    value: number;
    /** Canvas 支持的颜色字符串 */
    color: string;
}

/** 水印图案和覆盖层配置 */
export interface WatermarkOptions {
    /** 单个水印图案宽度，单位像素，默认 `250` */
    width?: number;
    /** 单个水印图案高度，单位像素，默认 `100` */
    height?: number;
    /** 文字旋转角度，单位为度，默认 `-10` */
    rotate?: number;
    /** 未使用渐变时的文字颜色 */
    color?: string;
    /** Canvas 字体声明 */
    font?: string;
    /** Canvas 文本对齐方式 */
    textAlign?: CanvasTextAlign;
    /** 多行文字的行高，单位像素，默认 `20` */
    lineHeight?: number;
    /** 多行文字分隔符，默认中文顿号 */
    wrap?: string;
    /** Canvas 全局透明度，范围为 `0` 到 `1` */
    globalAlpha?: number;
    /** 可选的线性渐变色标；存在时优先于 `color` */
    gradient?: readonly WatermarkGradientStop[];
    /** 保留的参考实现字段；当前版本不会绘制该图片 */
    image?: string;
    /** 保留的参考实现字段；当前版本不会使用该宽度 */
    imageWidth?: number;
    /** 保留的参考实现字段；当前版本不会使用该高度 */
    imageHeight?: number;
    /** 增加到 Canvas 高度的垂直空间，单位像素 */
    verticalOffset?: number;
    /** 水印覆盖层的 CSS `z-index`，默认 `100000` */
    zIndex?: string;
    /** 水印节点被删除后是否自动重新挂载，默认 `false` */
    forever?: boolean;
}

/** `useWatermark` 返回的水印控制方法 */
export interface WatermarkController {
    /** 移除水印节点并停止防删除观察 */
    clear(): void;
    /** 绘制并挂载水印；非浏览器环境或目标不存在时返回 `undefined` */
    setWatermark(text: string, options?: WatermarkOptions): Promise<string | undefined>;
}

let watermarkId = 0;

/**
 * 创建目标元素的 Canvas 背景水印控制器。
 *
 * 调用 `setWatermark` 后才会挂载水印；组件卸载时会移除节点、窗口监听和 MutationObserver。
 */
export function useWatermark(
    target?: HTMLElement | React.RefObject<HTMLElement | null>,
    resizeRedraw = false,
): WatermarkController {
    const elementRef = useRef<HTMLElement | null>(null);
    const observerRef = useRef<MutationObserver | null>(null);
    const idRef = useRef(`watermark-${watermarkId++}`);
    const resolveTarget = usePersistFn(() => {
        if (!target) return typeof document === "undefined" ? null : document.body;
        return "current" in target ? target.current : target;
    });
    const clear = usePersistFn(() => {
        observerRef.current?.disconnect();
        observerRef.current = null;
        elementRef.current?.remove();
        elementRef.current = null;
    });

    const createPattern = usePersistFn(async (text: string, options: WatermarkOptions): Promise<string> => {
        const width = options.width ?? 250;
        const height = options.height ?? 100;
        const canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height + (options.verticalOffset ?? 0);
        const context = canvas.getContext("2d");
        if (!context) return "";
        context.save();
        context.translate(width / 2, height / 2);
        context.rotate(((options.rotate ?? -10) * Math.PI) / 180);
        context.globalAlpha = options.globalAlpha ?? 1;
        context.font = options.font ?? "normal 16px Arial, 'Courier New', sans-serif";
        context.textAlign = options.textAlign ?? (text.includes(options.wrap ?? "、") ? "center" : "left");
        context.textBaseline = "middle";
        if (options.gradient?.length) {
            const gradient = context.createLinearGradient(0, 0, width, 0);
            for (const stop of options.gradient) gradient.addColorStop(stop.value, stop.color);
            context.fillStyle = gradient;
        } else context.fillStyle = options.color ?? "rgba(128, 128, 128, 0.3)";
        const lines = text.split(options.wrap ?? "、");
        const lineHeight = options.lineHeight ?? 20;
        const startY = -(lines.length * lineHeight) / 2 + lineHeight / 2;
        lines.forEach((line, index) => context.fillText(line, 0, startY + index * lineHeight));
        context.restore();
        return canvas.toDataURL("image/png");
    });

    const setWatermark = usePersistFn(async (text: string, options: WatermarkOptions = {}) => {
        const host = resolveTarget();
        if (!host || typeof document === "undefined") return undefined;
        if (!elementRef.current) {
            const element = document.createElement("div");
            element.id = idRef.current;
            element.style.pointerEvents = "none";
            element.style.inset = "0";
            element.style.position = host === document.body ? "fixed" : "absolute";
            element.style.zIndex = options.zIndex ?? "100000";
            if (!host.style.position) host.style.position = "relative";
            host.appendChild(element);
            elementRef.current = element;
        }
        const element = elementRef.current;
        element.style.width = `${host.clientWidth}px`;
        element.style.height = `${host.clientHeight}px`;
        element.style.background = `url(${await createPattern(text, options)}) left top repeat`;
        if (options.forever && !observerRef.current) {
            // forever 只守护水印节点是否仍在宿主中，不监听样式篡改，避免递归触发观察器。
            observerRef.current = new MutationObserver(() => {
                if (!host.contains(element)) host.appendChild(element);
            });
            observerRef.current.observe(host, { childList: true, subtree: true });
        }
        return idRef.current;
    });

    useEffect(() => {
        if (!resizeRedraw) return clear;
        const resize = debounce(() => {
            const host = resolveTarget();
            if (host && elementRef.current) {
                elementRef.current.style.width = `${host.clientWidth}px`;
                elementRef.current.style.height = `${host.clientHeight}px`;
            }
        });
        window.addEventListener("resize", resize);
        return () => {
            window.removeEventListener("resize", resize);
            clear();
        };
    }, [clear, resizeRedraw, resolveTarget]);

    return { clear, setWatermark };
}
