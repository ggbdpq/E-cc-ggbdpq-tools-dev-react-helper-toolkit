type AnyFunction = (...args: never[]) => unknown;

export type DelayedFunction<TFunction extends AnyFunction> = (...args: Parameters<TFunction>) => void;

export function delay(timeout = 20): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

/** 保持参考实现的 trailing 防抖和 immediate 首次执行语义。 */
export function debounce<TFunction extends AnyFunction>(
    fn: TFunction,
    timeout = 200,
    immediate = false,
): DelayedFunction<TFunction> {
    let timer: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<TFunction>): void => {
        if (timer !== null) clearTimeout(timer);

        if (immediate) {
            if (timer === null) fn(...args);
            timer = setTimeout(() => {
                timer = null;
            }, timeout);
            return;
        }

        timer = setTimeout(() => fn(...args), timeout);
    };
}

/** 保持参考实现：窗口内后续调用被忽略，并使用第一次调用的参数。 */
export function throttle<TFunction extends AnyFunction>(
    fn: TFunction,
    timeout = 1000,
): DelayedFunction<TFunction> {
    let timer: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<TFunction>): void => {
        if (timer !== null) return;
        timer = setTimeout(() => {
            fn(...args);
            timer = null;
        }, timeout);
    };
}
