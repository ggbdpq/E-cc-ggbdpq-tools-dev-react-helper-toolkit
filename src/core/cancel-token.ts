/** 对 `AbortController` 的最小封装，用于在调用链中共享取消信号和取消状态 */
export interface CancelToken {
    /** 可传递给 `fetch` 等 API 的取消信号 */
    readonly signal: AbortSignal;
    /** 取消操作；重复调用不会覆盖第一次取消原因 */
    cancel(reason?: string): void;
    /** 是否已经取消 */
    readonly isCancelled: boolean;
}

/** 创建包含 `signal`、`cancel` 和取消状态的令牌 */
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
