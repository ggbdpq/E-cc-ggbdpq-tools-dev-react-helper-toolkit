type AnyFunction = (...args: never[]) => unknown;

/** 保留原函数参数，并提供取消和立即刷新能力的防抖函数 */
export interface DebouncedFn<T extends AnyFunction> {
    /** 执行防抖后的函数 */
    (...args: Parameters<T>): void;
    /** 取消尚未执行的调用 */
    cancel(): void;
    /** 立即执行尚未执行的调用 */
    flush(): void;
}

/** 防抖函数的前沿与后沿触发配置 */
export interface DebounceOptions {
    /** 是否在前沿触发，默认 `false` */
    leading?: boolean;
    /** 是否在后沿触发，默认 `true` */
    trailing?: boolean;
}

/**
 * 创建防抖函数。
 *
 * @param wait - 静默等待时间，单位毫秒，默认 `1000`
 * @returns 带 `cancel` 和 `flush` 控制方法的防抖函数
 */
export function createDebouncedFn<T extends AnyFunction>(
    fn: T,
    wait = 1000,
    options: DebounceOptions = {},
): DebouncedFn<T> {
    const { leading = false, trailing = true } = options;

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastCallTime: number | null = null;

    function invokeFunc(args: Parameters<T>) {
        lastArgs = null;
        fn(...args);
    }

    function startTimer(pendingFunc: () => void, delay: number) {
        timerId = setTimeout(pendingFunc, delay);
    }

    function cancelTimer() {
        if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
        }
    }

    function trailingEdge() {
        timerId = null;
        if (trailing && lastArgs) {
            invokeFunc(lastArgs);
        }
        lastArgs = null;
        lastCallTime = null;
    }

    function cancel() {
        cancelTimer();
        lastArgs = null;
        lastCallTime = null;
    }

    function flush() {
        if (timerId === null) return;
        cancelTimer();
        trailingEdge();
    }

    const debounced = function (...args: Parameters<T>) {
        const time = Date.now();
        const isFirstCall = lastCallTime === null;
        lastCallTime = time;
        lastArgs = args;

        if (isFirstCall && leading) {
            invokeFunc(args);
            // 前沿调用后仍需保留静默期计时器，用于重置调用窗口并决定是否执行后沿任务。
            cancelTimer();
            startTimer(trailingEdge, wait);
            return;
        }

        cancelTimer();
        startTimer(trailingEdge, wait);
    } as DebouncedFn<T>;

    debounced.cancel = cancel;
    debounced.flush = flush;

    return debounced;
}
