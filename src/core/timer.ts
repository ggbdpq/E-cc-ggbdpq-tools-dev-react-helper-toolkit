export interface TimerHandle {
    /** 清除定时器 */
    clear(): void;
}

/**
 * 创建可取消的 setTimeout 封装
 *
 * @param fn 回调函数
 * @param delay 延迟时间（ms）
 * @returns 可通过 clear 取消的定时器句柄
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
 * 创建可取消的 setInterval 封装
 *
 * @param fn 回调函数
 * @param delay 间隔时间（ms）
 * @returns 可通过 clear 取消的定时器句柄
 */
export function createInterval(fn: () => void, delay: number): TimerHandle {
    const id = setInterval(fn, delay);
    return {
        clear() {
            clearInterval(id);
        },
    };
}
