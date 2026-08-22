export interface LatestRef<T> {
    current: T;
}

/**
 * 创建一个可变引用容器 —— 纯实现，无 React 依赖
 * 用于在闭包中始终拿到最新值
 *
 * @param initialValue 初始值
 * @returns 可直接读写 current 的引用容器
 */
export function createLatestRef<T>(initialValue: T): LatestRef<T> {
    return { current: initialValue };
}
