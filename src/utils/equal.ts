/** 递归比较两个普通对象的自身可枚举字符串属性 */
export function isEqualObject(
    first: Record<string, unknown> | undefined,
    second: Record<string, unknown> | undefined,
): boolean {
    if (first === second) return true;
    if (typeof first !== "object" || typeof second !== "object" || first === null || second === null) return false;
    const firstKeys = Object.keys(first);
    const secondKeys = Object.keys(second);
    if (firstKeys.length !== secondKeys.length) return false;
    for (const key of firstKeys) {
        if (!secondKeys.includes(key) || !isEqual(first[key], second[key])) return false;
    }
    return true;
}

/** 按顺序递归比较两个数组 */
export function isEqualArray(first: unknown[] | undefined, second: unknown[] | undefined): boolean {
    if (!first || !second || first.length !== second.length) return false;
    for (let index = 0; index < first.length; index++) if (!isEqual(first[index], second[index])) return false;
    return true;
}

/**
 * 按 `Object.prototype.toString` 分类比较常见值。
 *
 * 对象和数组递归比较，函数可通过引用或源码文本相等，其余值使用严格相等。
 */
export function isEqual(first: unknown, second: unknown): boolean {
    const type = Object.prototype.toString.call(first);
    if (type !== Object.prototype.toString.call(second)) return false;
    if (type === "[object Object]") {
        return isEqualObject(first as Record<string, unknown>, second as Record<string, unknown>);
    }
    if (type === "[object Array]") return isEqualArray(first as unknown[], second as unknown[]);
    if (type === "[object Function]") {
        if (first === second) return true;
        return String(first) === String(second);
    }
    return first === second;
}
