import { delay } from "../utils/debounce";

/** 基于旧版 Navigation Timing 时间点计算的页面性能指标，单位为秒 */
export interface PerformanceMetrics {
    /** DNS 查询耗时 */
    dns: number;
    /** TCP 连接耗时 */
    tcp: number;
    /** 从响应开始到响应结束的耗时 */
    request: number;
    /** 从 DOM 可交互到 DOM 完成的耗时 */
    dom: number;
    /** 从导航开始到 DOM 完成的总耗时 */
    whiteScreen: number;
}

interface LegacyPerformanceTiming {
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    connectEnd: number;
    responseStart: number;
    responseEnd: number;
    domInteractive: number;
    domComplete: number;
    navigationStart: number;
}

/**
 * 等待 `500ms` 后读取旧版 `performance.timing` 并计算页面性能指标。
 *
 * @throws {Error} 非浏览器环境调用时抛出；运行环境缺少旧版 `timing` 数据时也可能失败
 */
export async function getPerformance(): Promise<PerformanceMetrics> {
    if (typeof document === "undefined") throw new Error("Browser environment required");
    const timing = (window.performance as Performance & { timing: LegacyPerformanceTiming }).timing;
    await delay(500);
    return {
        dns: (timing.domainLookupEnd - timing.domainLookupStart) / 1000,
        tcp: (timing.connectEnd - timing.connectStart) / 1000,
        request: (timing.responseEnd - timing.responseStart) / 1000,
        dom: (timing.domComplete - timing.domInteractive) / 1000,
        whiteScreen: (timing.domComplete - timing.navigationStart) / 1000,
    };
}
