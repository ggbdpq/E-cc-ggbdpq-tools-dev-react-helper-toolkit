type AnyFunction = (...args: never[]) => unknown;

export interface ThrottledFn<T extends AnyFunction> {
    /** 执行节流后的函数 */
    (...args: Parameters<T>): void;
    /** 取消尚未执行的调用 */
    cancel(): void;
}

/** 节流函数的前沿与后沿触发配置。 */
export interface ThrottleOptions {
    /** 是否在前沿触发，默认 true */
    leading?: boolean;
    /** 是否在后沿触发，默认 true */
    trailing?: boolean;
}

/**
 * 创建节流函数 —— 零外部依赖
 *
 * @param fn 原始函数
 * @param wait 间隔时间（ms），默认 1000
 * @param options 前沿与后沿触发配置；两者都为 false 时不执行
 * @returns 带 cancel 控制方法的节流函数
 */
export function createThrottledFn<T extends AnyFunction>(
    fn: T,
    wait = 1000,
    options: ThrottleOptions = {},
): ThrottledFn<T> {
    const { leading = true, trailing = true } = options;

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastCallTime = 0;

    function invokeFunc(args: Parameters<T>) {
        lastArgs = null;
        lastCallTime = Date.now();
        fn(...args);
    }

    function trailingEdge() {
        timerId = null;
        if (trailing && lastArgs) {
            invokeFunc(lastArgs);
        }
        lastArgs = null;
        if (!leading) {
            lastCallTime = 0;
        }
    }

    function cancel() {
        if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
        }
        lastArgs = null;
        lastCallTime = 0;
    }

    const throttled = function (...args: Parameters<T>) {
        if (!leading && !trailing) return;

        const now = Date.now();
        const remaining = wait - (now - lastCallTime);

        lastArgs = args;

        if (remaining <= 0 || remaining > wait) {
            // 超过等待时间
            if (timerId !== null) {
                clearTimeout(timerId);
                timerId = null;
            }
            if (leading || lastCallTime !== 0) {
                invokeFunc(args);
            } else {
                lastCallTime = now;
                if (trailing) {
                    timerId = setTimeout(trailingEdge, wait);
                }
            }
        } else if (timerId === null && trailing) {
            timerId = setTimeout(trailingEdge, remaining);
        }
    } as ThrottledFn<T>;

    throttled.cancel = cancel;

    return throttled;
}
