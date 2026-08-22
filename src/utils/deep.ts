function isPlainRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

export type EqualityFunction = (first: unknown, second: unknown, seen?: WeakMap<object, object>) => boolean;

export function mapsEqual(
    first: Map<unknown, unknown>,
    second: Map<unknown, unknown>,
    equal: EqualityFunction = deepEqual,
): boolean {
    if (first.size !== second.size) return false;
    for (const [key, value] of first) {
        if (!second.has(key) || !equal(value, second.get(key))) return false;
    }
    return true;
}

export function setsEqual(first: Set<unknown>, second: Set<unknown>): boolean {
    if (first.size !== second.size) return false;
    for (const value of first) if (!second.has(value)) return false;
    return true;
}

function arraysEqual(first: unknown[], second: unknown[], seen: WeakMap<object, object>): boolean {
    if (first.length !== second.length) return false;
    for (let index = 0; index < first.length; index++) {
        if (!deepEqual(first[index], second[index], seen)) return false;
    }
    return true;
}

/** 深度比较常见结构，并使用 WeakMap 处理循环引用。 */
export function deepEqual(first: unknown, second: unknown, seen = new WeakMap<object, object>()): boolean {
    if (first === second) return true;
    if (first instanceof Date && second instanceof Date) return first.getTime() === second.getTime();
    if (first instanceof RegExp && second instanceof RegExp) return first.toString() === second.toString();
    if (first instanceof Map && second instanceof Map) return mapsEqual(first, second, (a, b) => deepEqual(a, b, seen));
    if (first instanceof Set && second instanceof Set) return setsEqual(first, second);
    if (Array.isArray(first) && Array.isArray(second)) return arraysEqual(first, second, seen);
    if (!isPlainRecord(first) || !isPlainRecord(second)) return false;
    if (seen.has(first)) return seen.get(first) === second;
    seen.set(first, second);
    const firstKeys = Object.keys(first);
    const secondKeys = Object.keys(second);
    if (firstKeys.length !== secondKeys.length) return false;
    for (const key of firstKeys) {
        if (!Object.prototype.hasOwnProperty.call(second, key) || !deepEqual(first[key], second[key], seen)) return false;
    }
    return true;
}
