import { useEffect, useRef, useState } from "react";
import { debounce } from "../utils/debounce";
import { usePersistFn } from "./usePersistFn";

export type DraggableTarget = HTMLElement | string | React.RefObject<HTMLElement | null>;

export interface DraggableOptions {
    dragRefStyle?: Partial<CSSStyleDeclaration>;
    resize?: boolean | number;
}

export interface DragTransform {
    offsetX: number;
    offsetY: number;
}

export interface DraggableController {
    draggable: boolean;
    dragging: boolean;
    transform: DragTransform;
    init(): void;
    open(): void;
    close(): void;
    reset(): void;
}

function resolveElement(target: DraggableTarget): HTMLElement | null {
    if (typeof target === "string") return document.querySelector<HTMLElement>(target);
    if ("current" in target) return target.current;
    return target;
}

/** 为目标元素提供可开启、关闭和重置的拖动行为。 */
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
