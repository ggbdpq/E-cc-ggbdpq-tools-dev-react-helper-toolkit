import { useEffect, useRef } from "react";
import { useLatest } from "../hooks/useLatest";
import { usePersistFn } from "../hooks/usePersistFn";

export interface EChartsOption {
    clear?: boolean;
    addTooltip?: "x" | "y" | true;
    [key: string]: unknown;
}

export interface EChartsInstance {
    setOption(option: EChartsOption): void;
    clear(): void;
    resize(): void;
    dispose(): void;
    showLoading(type?: string, options?: Record<string, unknown>): void;
    hideLoading(): void;
    appendData(options: unknown): void;
    getWidth(): number;
    getHeight(): number;
    getDom(): HTMLCanvasElement | HTMLDivElement;
    getOption(): unknown;
    getDataURL(options?: unknown): string;
    getConnectedDataURL(options?: unknown): string;
    on(event: string, queryOrHandler: unknown, handler?: (params: unknown) => void): void;
    off(event?: string): void;
    getZr(): { on(event: string, handler: (params: unknown) => void): void; off(event?: string): void };
}

export interface EChartsAdapter {
    init(element: HTMLElement, theme?: string, options?: Record<string, unknown>): EChartsInstance;
}

export interface UseEChartsOptions {
    echarts: EChartsAdapter;
    theme?: string;
    resize?: boolean;
    tooltipId?: string;
    [key: string]: unknown;
}

export interface EChartsEventOptions {
    name: string;
    type?: "echarts" | "zrender";
    query?: unknown;
    callback(params: unknown): void;
}

export interface EChartsController {
    echarts: EChartsAdapter;
    setOptions(options: EChartsOption, ...events: EChartsEventOptions[]): void;
    getInstance(): EChartsInstance | null;
    showLoading(params?: { type?: string; opts?: Record<string, unknown> }): void;
    hideLoading(): void;
    clear(): void;
    resize(): void;
    getGlobalProperties(): { name: string; value: EChartsAdapter };
    getDom(): HTMLCanvasElement | HTMLDivElement;
    getWidth(): number;
    getHeight(): number;
    getOption(): unknown;
    appendData(options: unknown): void;
    getDataURL(options?: unknown): string;
    getConnectedDataURL(options?: unknown): string;
    addTooltip(type: "x" | "y" | true): void;
}

/** 通过显式 ECharts adapter 管理实例、事件、尺寸和卸载清理。 */
export function useECharts(
    target: HTMLElement | React.RefObject<HTMLElement | null>,
    options: UseEChartsOptions,
): EChartsController {
    const optionsRef = useLatest(options);
    const instanceRef = useRef<EChartsInstance | null>(null);
    const resolveElement = usePersistFn(() => ("current" in target ? target.current : target));
    const ensureInstance = usePersistFn(() => {
        if (!instanceRef.current) {
            const element = resolveElement();
            if (element) instanceRef.current = optionsRef.current.echarts.init(element, optionsRef.current.theme ?? "default", optionsRef.current);
        }
        return instanceRef.current;
    });
    const clear = usePersistFn(() => instanceRef.current?.clear());
    const resize = usePersistFn(() => instanceRef.current?.resize());
    const setOptions = usePersistFn((chartOptions: EChartsOption, ...events: EChartsEventOptions[]) => {
        const instance = ensureInstance();
        if (!instance) return;
        if (chartOptions.clear ?? true) instance.clear();
        instance.setOption(chartOptions);
        for (const event of events) {
            if (event.type === "zrender") instance.getZr().on(event.name, event.callback);
            else instance.on(event.name, event.query ?? "", event.callback);
        }
        if (chartOptions.addTooltip) addTooltip(chartOptions.addTooltip);
    });
    const showLoading = usePersistFn((params: { type?: string; opts?: Record<string, unknown> } = {}) => {
        ensureInstance()?.showLoading(params.type ?? "default", params.opts ?? {});
    });
    const hideLoading = usePersistFn(() => instanceRef.current?.hideLoading());
    const addTooltip = usePersistFn((_type: "x" | "y" | true) => undefined);
    const getInstance = usePersistFn(() => ensureInstance());
    const getGlobalProperties = usePersistFn(() => ({ name: "echarts", value: optionsRef.current.echarts }));
    const getDom = usePersistFn(() => ensureInstance()!.getDom());
    const getWidth = usePersistFn(() => ensureInstance()!.getWidth());
    const getHeight = usePersistFn(() => ensureInstance()!.getHeight());
    const getOption = usePersistFn(() => ensureInstance()!.getOption());
    const appendData = usePersistFn((data: unknown) => ensureInstance()?.appendData(data));
    const getDataURL = usePersistFn((data?: unknown) => ensureInstance()!.getDataURL(data));
    const getConnectedDataURL = usePersistFn((data?: unknown) => ensureInstance()!.getConnectedDataURL(data));

    useEffect(() => {
        if (!(options.resize ?? true)) return;
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [options.resize, resize]);

    useEffect(() => {
        return () => {
            const instance = instanceRef.current;
            instance?.off();
            instance?.getZr().off();
            instance?.dispose();
            instanceRef.current = null;
        };
    }, []);

    return {
        echarts: options.echarts,
        setOptions,
        getInstance,
        showLoading,
        hideLoading,
        clear,
        resize,
        getGlobalProperties,
        getDom,
        getWidth,
        getHeight,
        getOption,
        appendData,
        getDataURL,
        getConnectedDataURL,
        addTooltip,
    };
}
