export interface CancelToken {
    /** AbortSignal，可传递给 fetch 等 API */
    readonly signal: AbortSignal;
    /** 取消操作；重复调用不会覆盖第一次取消原因 */
    cancel(reason?: string): void;
    /** 是否已被取消 */
    readonly isCancelled: boolean;
}

/**
 * 创建取消令牌 —— AbortController 的薄封装
 *
 * @returns 包含 signal、cancel 和取消状态的令牌
 */
export function createCancelToken(): CancelToken {
    const controller = new AbortController();

    return {
        get signal() {
            return controller.signal;
        },
        cancel(reason?: string) {
            controller.abort(reason ?? "Cancelled");
        },
        get isCancelled() {
            return controller.signal.aborted;
        },
    };
}
