import { useEffect, useRef } from "react";
import { debounce } from "../utils/debounce";
import { usePersistFn } from "./usePersistFn";

export interface WatermarkGradientStop {
    value: number;
    color: string;
}

export interface WatermarkOptions {
    width?: number;
    height?: number;
    rotate?: number;
    color?: string;
    font?: string;
    textAlign?: CanvasTextAlign;
    lineHeight?: number;
    wrap?: string;
    globalAlpha?: number;
    gradient?: readonly WatermarkGradientStop[];
    image?: string;
    imageWidth?: number;
    imageHeight?: number;
    verticalOffset?: number;
    zIndex?: string;
    forever?: boolean;
}

export interface WatermarkController {
    clear(): void;
    setWatermark(text: string, options?: WatermarkOptions): Promise<string | undefined>;
}

let watermarkId = 0;

/** 在目标元素上创建 Canvas 背景水印，并负责监听和资源清理。 */
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
