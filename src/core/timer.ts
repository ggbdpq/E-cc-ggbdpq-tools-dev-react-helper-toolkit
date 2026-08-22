/** 定时器的最小控制句柄 */
export interface TimerHandle {
    /** 清除定时器 */
    clear(): void;
}

/**
 * 创建延迟 `delay` 毫秒后执行一次的定时器。
 *
 * 返回的句柄可在回调执行前取消任务。
 */
export function createTimeout(fn: () => void, delay: number): TimerHandle {
    const id = setTimeout(fn, delay);
    return {
        clear() {
            clearTimeout(id);
        },
    };
}

/**
 * 创建每隔 `delay` 毫秒重复执行的定时器。
 *
 * 返回的句柄可停止后续任务。
 */
export function createInterval(fn: () => void, delay: number): TimerHandle {
    const id = setInterval(fn, delay);
    return {
        clear() {
            clearInterval(id);
        },
    };
}
