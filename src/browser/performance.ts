import { delay } from "../utils/debounce";

export interface PerformanceMetrics {
    dns: number;
    tcp: number;
    request: number;
    dom: number;
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
