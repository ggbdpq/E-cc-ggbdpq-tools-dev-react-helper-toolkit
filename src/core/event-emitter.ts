type EventMap = object;
type EventHandler<T> = (payload: T) => void;
type StoredEventHandler = EventHandler<never>;
/** 未传事件映射时保持原有的宽松调用方式 */
type UntypedEventMap = Record<PropertyKey, unknown>;

/**
 * 以事件映射约束事件名称和载荷类型的发布订阅接口。
 *
 * @typeParam T - 事件名称到事件载荷的映射
 */
export interface EventEmitter<T extends EventMap> {
    /** 订阅事件 */
    on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
    /** 取消订阅 */
    off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
    /** 触发事件 */
    emit<K extends keyof T>(event: K, payload: T[K]): void;
    /** 订阅一次，并在首次触发前自动取消 */
    once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
    /** 清除所有订阅 */
    clear(): void;
}

/**
 * 创建类型安全的事件发布订阅器。
 *
 * @example
 * ```ts
 * type Events = { change: string; reset: void };
 * const emitter = createEventEmitter<Events>();
 * emitter.on('change', (v) => console.log(v));
 * emitter.emit('change', 'hello');
 * ```
 */
export function createEventEmitter<T extends EventMap = UntypedEventMap>(): EventEmitter<T> {
    const listeners = new Map<keyof T, Set<StoredEventHandler>>();

    function getOrCreateListeners<K extends keyof T>(event: K): Set<EventHandler<T[K]>> {
        let set = listeners.get(event);
        if (!set) {
            set = new Set();
            listeners.set(event, set);
        }

        // Map 在运行时会擦除泛型；同一事件键只由本接口写入，因此这里可以恢复 T[K] 的处理器类型。
        return set as Set<EventHandler<T[K]>>;
    }

    function removeListener<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void {
        const handlers = listeners.get(event) as Set<EventHandler<T[K]>> | undefined;
        handlers?.delete(handler);
        if (handlers?.size === 0) {
            listeners.delete(event);
        }
    }

    return {
        on<K extends keyof T>(event: K, handler: EventHandler<T[K]>) {
            getOrCreateListeners(event).add(handler);
        },

        off<K extends keyof T>(event: K, handler: EventHandler<T[K]>) {
            removeListener(event, handler);
        },

        emit<K extends keyof T>(event: K, payload: T[K]) {
            // 使用快照，保证回调在当前派发过程中增删订阅时不会改变本轮执行集合。
            const handlers = [...((listeners.get(event) as Set<EventHandler<T[K]>> | undefined) ?? [])];
            for (const handler of handlers) {
                handler(payload);
            }
        },

        once<K extends keyof T>(event: K, handler: EventHandler<T[K]>) {
            const wrapper: EventHandler<T[K]> = (payload) => {
                removeListener(event, wrapper);
                handler(payload);
            };
            getOrCreateListeners(event).add(wrapper);
        },

        clear() {
            listeners.clear();
        },
    };
}
