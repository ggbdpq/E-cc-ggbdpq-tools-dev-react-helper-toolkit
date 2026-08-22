export interface AsyncLock {
    /**
     * 在锁未占用时执行异步函数，执行期间其它 run 调用将被忽略
     *
     * @param fn 需要串行保护的异步函数
     * @param args 透传给 fn 的参数
     * @returns 如果成功获取锁则返回函数结果，否则返回 undefined
     */
    run<TArgs extends unknown[], TResult>(
        fn: (...args: TArgs) => Promise<TResult>,
        ...args: TArgs
    ): Promise<TResult | undefined>;
    /** 当前是否处于锁定状态 */
    readonly isLocked: boolean;
}

/**
 * 创建异步锁 —— 防止重复提交
 *
 * @returns 可复用的异步锁实例
 */
export function createAsyncLock(): AsyncLock {
    let locked = false;

    const lock: AsyncLock = {
        async run<TArgs extends unknown[], TResult>(
            fn: (...args: TArgs) => Promise<TResult>,
            ...args: TArgs
        ): Promise<TResult | undefined> {
            if (locked) return undefined;
            locked = true;
            try {
                return await fn(...args);
            } finally {
                locked = false;
            }
        },
        get isLocked() {
            return locked;
        },
    };

    return lock;
}
