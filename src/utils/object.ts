export type KeyRule = readonly PropertyKey[] | ReadonlySet<PropertyKey> | Record<string, boolean | number>;
export type KeyPredicate = (key: PropertyKey, value: unknown) => boolean;

export interface CleanOptions {
    includeKeys?: KeyRule | KeyPredicate;
    excludeKeys?: KeyRule | KeyPredicate;
    excludeWhitespaceStrings?: boolean;
    excludeEmptyObjects?: boolean;
    excludeEmptyArrays?: boolean;
    customFilter?: (value: unknown, key?: PropertyKey, parent?: unknown) => boolean;
    maxDepth?: number;
    allowRootIfEmpty?: boolean;
    stripKeysInObjects?: Record<string, PropertyKey[] | KeyPredicate | Array<PropertyKey | KeyPredicate>>;
}

export type DeepClean<T> = T extends readonly (infer TItem)[]
    ? Array<DeepClean<TItem>>
    : T extends object
      ? { [TKey in keyof T]?: DeepClean<T[TKey]> }
      : T;

export type ObjectEntry<T extends object> = {
    [TKey in Extract<keyof T, string>]-?: [TKey, T[TKey]];
}[Extract<keyof T, string>];

/** 返回对象自身可枚举字符串键组成的强类型键值元组。 */
export function entries<T extends object>(object: T): Array<ObjectEntry<T>> {
    return Object.keys(object).map((key) => [key, object[key as keyof T]]) as Array<ObjectEntry<T>>;
}

export function delObjectProperty<T extends object, TKey extends keyof T>(object: T, props: TKey | TKey[]): Omit<T, TKey> {
    const result = { ...object };
    const keys = Array.isArray(props) ? props : [props];
    for (const key of keys) delete result[key];
    return result;
}

export function toSet(value: unknown): Set<PropertyKey> | undefined {
    if (!value) return undefined;
    if (value instanceof Set) return new Set(value as Set<PropertyKey>);
    if (Array.isArray(value)) return new Set(value.filter((item): item is PropertyKey => ["string", "number", "symbol"].includes(typeof item)));
    if (typeof value === "object") {
        const record = value as Record<string, unknown>;
        return new Set(Object.keys(record).filter((key) => record[key] === true || record[key] === 1));
    }
    return undefined;
}

export function shouldCleanKey(key: PropertyKey, value: unknown, options: CleanOptions): boolean {
    if (options.includeKeys !== undefined) {
        const included =
            typeof options.includeKeys === "function"
                ? options.includeKeys(key, value)
                : (toSet(options.includeKeys)?.has(key) ?? false);
        if (!included) return false;
    }
    if (options.excludeKeys !== undefined) {
        const excluded =
            typeof options.excludeKeys === "function"
                ? options.excludeKeys(key, value)
                : (toSet(options.excludeKeys)?.has(key) ?? false);
        if (excluded) return false;
    }
    return true;
}

export function isInvalidValue(value: unknown, options: CleanOptions): boolean {
    if (value === null || value === undefined || value === "") return true;
    if (options.excludeWhitespaceStrings && typeof value === "string" && value.trim() === "") return true;
    if (options.excludeEmptyObjects && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return true;
    if (options.excludeEmptyArrays && Array.isArray(value) && value.length === 0) return true;
    return options.customFilter?.(value) ?? false;
}

/** 递归移除空值和被规则排除的字段，不修改输入对象。 */
export function cleanObject<T>(object: T, options: CleanOptions = {}): DeepClean<T> | undefined {
    const maxDepth = options.maxDepth ?? Infinity;
    const stripRules = options.stripKeysInObjects ?? {};

    function shouldStrip(objectField: string, key: PropertyKey, value: unknown): boolean {
        const rule = stripRules[objectField];
        if (!rule) return false;
        if (typeof rule === "function") return rule(key, value);
        for (const condition of rule) {
            if (typeof condition === "function" ? condition(key, value) : condition === key) return true;
        }
        return false;
    }

    function clean(value: unknown, depth: number, key?: PropertyKey, parent?: unknown): unknown {
        if (depth > maxDepth) return value;
        if (options.customFilter?.(value, key, parent)) return undefined;
        if (isInvalidValue(value, { ...options, customFilter: undefined })) return undefined;
        if (Array.isArray(value)) {
            const result = value.map((item) => clean(item, depth + 1, undefined, value)).filter((item) => item !== undefined);
            return options.excludeEmptyArrays && result.length === 0 ? undefined : result;
        }
        if (typeof value !== "object" || value === null) return value;

        let source = value as Record<PropertyKey, unknown>;
        if (typeof key === "string" && stripRules[key]) {
            const filtered: Record<PropertyKey, unknown> = {};
            for (const sourceKey of Reflect.ownKeys(source)) {
                if (!shouldStrip(key, sourceKey, source[sourceKey])) filtered[sourceKey] = source[sourceKey];
            }
            source = filtered;
        }
        const result: Record<PropertyKey, unknown> = {};
        let hasValue = false;
        for (const sourceKey of Reflect.ownKeys(source)) {
            if (!shouldCleanKey(sourceKey, source[sourceKey], options)) continue;
            const cleaned = clean(source[sourceKey], depth + 1, sourceKey, source);
            if (cleaned !== undefined) {
                result[sourceKey] = cleaned;
                hasValue = true;
            }
        }
        if (!hasValue && (options.excludeEmptyObjects || !options.allowRootIfEmpty)) return undefined;
        return result;
    }

    return clean(object, 1) as DeepClean<T> | undefined;
}
