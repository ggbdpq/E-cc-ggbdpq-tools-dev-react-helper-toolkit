export function hasOwnProp(object: object, key: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function copyValue<T>(value: T, deep: boolean, seen: WeakMap<object, unknown>): T {
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) return seen.get(value) as T;
    if (value instanceof Date) return new Date(value.valueOf()) as T;
    if (value instanceof RegExp) return new RegExp(value.source, value.flags) as T;

    if (Array.isArray(value)) {
        const result: unknown[] = [];
        seen.set(value, result);
        for (const item of value) result.push(deep ? copyValue(item, true, seen) : item);
        return result as T;
    }
    if (value instanceof Set) {
        const result = new Set<unknown>();
        seen.set(value, result);
        for (const item of value) result.add(deep ? copyValue(item, true, seen) : item);
        return result as T;
    }
    if (value instanceof Map) {
        const result = new Map<unknown, unknown>();
        seen.set(value, result);
        for (const [key, item] of value) {
            result.set(deep ? copyValue(key, true, seen) : key, deep ? copyValue(item, true, seen) : item);
        }
        return result as T;
    }

    const result = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>;
    seen.set(value, result);
    for (const key of Reflect.ownKeys(value)) {
        const item = (value as Record<PropertyKey, unknown>)[key];
        result[key] = deep ? copyValue(item, true, seen) : item;
    }
    return result as T;
}

/** 浅拷贝值；deep 为 true 时递归复制并处理循环引用。 */
export function clone<T>(value: T, deep = false): T {
    return copyValue(value, deep, new WeakMap());
}

/** 深拷贝值，并保留 Date、RegExp、Map、Set 和对象原型。 */
export function cloneDeep<T>(value: T): T {
    return copyValue(value, true, new WeakMap());
}
