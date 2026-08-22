import { useEffect, useRef } from "react";
import { useLatest } from "../hooks/useLatest";
import { usePersistFn } from "../hooks/usePersistFn";

/** 传给 ECharts 实例的图表配置及本 Hook 使用的扩展控制字段 */
export interface EChartsOption {
    /** 设置新配置前是否清空实例，默认 `true` */
    clear?: boolean;
    /** 是否请求添加辅助提示线；当前控制器仅保留该兼容入口，不执行实际绘制 */
    addTooltip?: "x" | "y" | true;
    /** 透传给 ECharts `setOption` 的其它配置 */
    [key: string]: unknown;
}

/** Hook 运行所需的 ECharts 实例最小能力集合 */
export interface EChartsInstance {
    /** 应用图表配置 */
    setOption(option: EChartsOption): void;
    /** 清空图表 */
    clear(): void;
    /** 重新计算图表尺寸 */
    resize(): void;
    /** 销毁图表及其资源 */
    dispose(): void;
    /** 显示加载状态 */
    showLoading(type?: string, options?: Record<string, unknown>): void;
    /** 隐藏加载状态 */
    hideLoading(): void;
    /** 追加流式数据 */
    appendData(options: unknown): void;
    /** 返回图表宽度 */
    getWidth(): number;
    /** 返回图表高度 */
    getHeight(): number;
    /** 返回承载图表的 DOM 元素 */
    getDom(): HTMLCanvasElement | HTMLDivElement;
    /** 返回当前图表配置 */
    getOption(): unknown;
    /** 导出当前图表图片 */
    getDataURL(options?: unknown): string;
    /** 导出已连接图表的组合图片 */
    getConnectedDataURL(options?: unknown): string;
    /** 注册 ECharts 事件 */
    on(event: string, queryOrHandler: unknown, handler?: (params: unknown) => void): void;
    /** 移除一个或全部 ECharts 事件 */
    off(event?: string): void;
    /** 返回可注册底层 ZRender 事件的实例 */
    getZr(): { on(event: string, handler: (params: unknown) => void): void; off(event?: string): void };
}

/** 由调用方注入的 ECharts 初始化适配器，避免本包直接依赖 ECharts */
export interface EChartsAdapter {
    /** 在目标元素上创建图表实例 */
    init(element: HTMLElement, theme?: string, options?: Record<string, unknown>): EChartsInstance;
}

/** `useECharts` 的实例初始化和生命周期配置 */
export interface UseEChartsOptions {
    /** 必须显式提供的 ECharts 适配器 */
    echarts: EChartsAdapter;
    /** 初始化主题，默认 `default` */
    theme?: string;
    /** 是否监听窗口缩放并调用实例 `resize`，默认 `true` */
    resize?: boolean;
    /** 保留的提示层标识字段；当前实现不会读取 */
    tooltipId?: string;
    /** 其它字段会透传给适配器的 `init` */
    [key: string]: unknown;
}

/** 调用 `EChartsController.setOptions` 时附带的事件注册配置 */
export interface EChartsEventOptions {
    /** 事件名称 */
    name: string;
    /** 事件来源，默认 `echarts` */
    type?: "echarts" | "zrender";
    /** ECharts 事件查询条件；ZRender 事件会忽略该字段 */
    query?: unknown;
    /** 事件回调 */
    callback(params: unknown): void;
}

/**
 * `useECharts` 返回的实例代理和生命周期控制器。
 *
 * `getDom`、尺寸、配置和图片导出方法要求目标元素能够创建实例，否则会抛出运行时错误；
 * `showLoading` 和 `appendData` 等可选代理在实例不存在时不执行。
 */
export interface EChartsController {
    /** 调用方传入的 ECharts 适配器 */
    echarts: EChartsAdapter;
    /** 初始化实例、应用配置并注册本次传入的事件 */
    setOptions(options: EChartsOption, ...events: EChartsEventOptions[]): void;
    /** 获取或尝试创建实例；目标元素不存在时返回 `null` */
    getInstance(): EChartsInstance | null;
    /** 显示加载状态 */
    showLoading(params?: { type?: string; opts?: Record<string, unknown> }): void;
    /** 隐藏加载状态 */
    hideLoading(): void;
    /** 清空当前实例 */
    clear(): void;
    /** 重新计算当前实例尺寸 */
    resize(): void;
    /** 返回兼容全局注入场景的适配器名称和值 */
    getGlobalProperties(): { name: string; value: EChartsAdapter };
    /** 返回实例 DOM */
    getDom(): HTMLCanvasElement | HTMLDivElement;
    /** 返回实例宽度 */
    getWidth(): number;
    /** 返回实例高度 */
    getHeight(): number;
    /** 返回实例配置 */
    getOption(): unknown;
    /** 向当前实例追加数据 */
    appendData(options: unknown): void;
    /** 导出实例图片 */
    getDataURL(options?: unknown): string;
    /** 导出连接图表图片 */
    getConnectedDataURL(options?: unknown): string;
    /** 保留的提示线兼容入口；当前实现不执行操作 */
    addTooltip(type: "x" | "y" | true): void;
}

/**
 * 通过显式 ECharts adapter 延迟创建实例，并代理事件、尺寸和导出能力。
 *
 * 组件卸载时会移除 ECharts/ZRender 事件并销毁实例；默认监听窗口缩放。
 */
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
    // 非空断言用于保持 ECharts 同步 getter 的返回类型；实例缺失时由公开契约约定为运行时错误。
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
