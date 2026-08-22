/** 保存最新值的可变引用容器，适合被异步回调或闭包长期持有 */
export interface LatestRef<T> {
    /** 当前值；调用方可以直接读写 */
    current: T;
}

/**
 * 创建不依赖 React 的可变引用容器。
 *
 * 调用方可直接读写 `current`，使长期持有该容器的闭包读取最新值。
 */
export function createLatestRef<T>(initialValue: T): LatestRef<T> {
    return { current: initialValue };
}
