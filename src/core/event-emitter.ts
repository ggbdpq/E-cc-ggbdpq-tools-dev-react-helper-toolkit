type EventMap = object;
type EventHandler<T> = (payload: T) => void;
type StoredEventHandler = EventHandler<never>;
/** 未传事件映射时保持原有的宽松调用方式。 */
type UntypedEventMap = Record<PropertyKey, unknown>;

export interface EventEmitter<T extends EventMap> {
    /** 订阅事件 */
    on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
    /** 取消订阅 */
    off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
    /** 触发事件 */
    emit<K extends keyof T>(event: K, payload: T[K]): void;
    /** 订阅一次后自动取消 */
    once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
    /** 清除所有订阅 */
    clear(): void;
}

/**
 * 类型安全的事件发布/订阅器
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

        /** 同一事件键始终只存放与 T[K] 匹配的处理器。 */
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
            /** 使用快照，保证当前 emit 不受回调内退订操作影响。 */
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
