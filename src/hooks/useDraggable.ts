import { useEffect, useRef, useState } from "react";
import { debounce } from "../utils/debounce";
import { usePersistFn } from "./usePersistFn";

/** 可拖动元素或拖动手柄的定位方式。字符串会作为 CSS 选择器解析 */
export type DraggableTarget = HTMLElement | string | React.RefObject<HTMLElement | null>;

/** `useDraggable` 的行为配置 */
export interface DraggableOptions {
    /** 启用拖动时合并到手柄元素的行内样式 */
    dragRefStyle?: Partial<CSSStyleDeclaration>;
    /** 是否在窗口缩放后校正越界位置；数字表示防抖毫秒数，默认 `60` */
    resize?: boolean | number;
}

/** 目标元素相对初始位置的平移量，单位为像素 */
export interface DragTransform {
    /** 水平方向偏移量 */
    offsetX: number;
    /** 垂直方向偏移量 */
    offsetY: number;
}

/** `useDraggable` 返回的状态和控制方法 */
export interface DraggableController {
    /** 当前是否允许拖动 */
    draggable: boolean;
    /** 当前是否正在响应鼠标拖动 */
    dragging: boolean;
    /** 最近一次计算出的元素平移量 */
    transform: DragTransform;
    /** 清理旧监听并重置位移，随后重新启用拖动 */
    init(): void;
    /** 为手柄注册鼠标按下监听并启用拖动 */
    open(): void;
    /** 移除监听并终止当前拖动，随后进入禁用状态 */
    close(): void;
    /** 将元素位移和 `transform` 样式恢复到初始状态 */
    reset(): void;
}

function resolveElement(target: DraggableTarget): HTMLElement | null {
    if (typeof target === "string") return document.querySelector<HTMLElement>(target);
    if ("current" in target) return target.current;
    return target;
}

/**
 * 创建限制在当前视口内的鼠标拖动控制器。
 *
 * Hook 不会自动注册拖动监听，调用方需要执行 `open` 或 `init`；卸载时会移除监听和动画帧。
 */
export function useDraggable(
    target: DraggableTarget,
    handle: DraggableTarget,
    options: DraggableOptions = {},
): DraggableController {
    const [draggable, setDraggable] = useState(true);
    const [dragging, setDragging] = useState(false);
    const [transform, setTransform] = useState<DragTransform>({ offsetX: 0, offsetY: 0 });
    const transformRef = useRef(transform);
    const draggingRef = useRef(false);
    const frameRef = useRef<number | null>(null);
    const cleanupDragRef = useRef<(() => void) | null>(null);
    const enabledRef = useRef(false);

    const reset = usePersistFn(() => {
        transformRef.current = { offsetX: 0, offsetY: 0 };
        setTransform(transformRef.current);
        const element = resolveElement(target);
        if (element) element.style.transform = "none";
    });

    const onMouseDown = usePersistFn((event: MouseEvent) => {
        const element = resolveElement(target);
        if (!element) return;
        const startX = event.clientX;
        const startY = event.clientY;
        const initial = transformRef.current;
        const rect = element.getBoundingClientRect();
        // 可移动范围按拖动开始时的矩形计算，确保元素不会被拖出当前视口。
        const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
        const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
        const minX = -rect.left + initial.offsetX;
        const minY = -rect.top + initial.offsetY;
        const maxX = viewportWidth - rect.left - rect.width + initial.offsetX;
        const maxY = viewportHeight - rect.top - rect.height + initial.offsetY;
        const onMove = (moveEvent: MouseEvent) => {
            const next = {
                offsetX: Math.min(Math.max(initial.offsetX + moveEvent.clientX - startX, minX), maxX),
                offsetY: Math.min(Math.max(initial.offsetY + moveEvent.clientY - startY, minY), maxY),
            };
            transformRef.current = next;
            draggingRef.current = true;
            setDragging(true);
            setTransform(next);
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            // 每帧只保留最后一次鼠标位移，避免高频 mousemove 重复写入布局样式。
            frameRef.current = requestAnimationFrame(() => {
                element.style.transform = `translate(${next.offsetX}px, ${next.offsetY}px)`;
            });
        };
        const onUp = () => {
            draggingRef.current = false;
            setDragging(false);
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        cleanupDragRef.current = onUp;
    });

    const close = usePersistFn(() => {
        const handleElement = resolveElement(handle);
        handleElement?.removeEventListener("mousedown", onMouseDown);
        cleanupDragRef.current?.();
        enabledRef.current = false;
        setDragging(false);
        draggingRef.current = false;
        setDraggable(false);
    });

    const open = usePersistFn(() => {
        const handleElement = resolveElement(handle);
        if (!handleElement || enabledRef.current) return;
        if (options.dragRefStyle) Object.assign(handleElement.style, options.dragRefStyle);
        handleElement.addEventListener("mousedown", onMouseDown);
        enabledRef.current = true;
        setDraggable(true);
    });

    const init = usePersistFn(() => {
        close();
        transformRef.current = { offsetX: 0, offsetY: 0 };
        setTransform(transformRef.current);
        open();
    });

    useEffect(() => {
        if (options.resize === false) return close;
        const onResize = debounce(() => {
            if (draggingRef.current) return;
            const element = resolveElement(target);
            if (!element) return;
            const rect = element.getBoundingClientRect();
            if (rect.left < 0 || rect.top < 0 || rect.right > window.innerWidth || rect.bottom > window.innerHeight) reset();
        }, typeof options.resize === "number" ? options.resize : 60);
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            close();
        };
    }, [close, options.resize, reset, target]);

    return { draggable, dragging, transform, init, open, close, reset };
}
