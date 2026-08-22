import { deepEqual } from "./deep";

/** 随机分配结果的排序方式 */
export type DivideOrder = "asc" | "desc" | "random";

/** `randomDivide` 的分配约束 */
export interface DivideOptions {
    /** 每份最小值，默认 `0` */
    minPerPart?: number;
    /** 每份最大值；省略时不限制上限 */
    maxPerPart?: number;
    /** 返回结果的排序方式，默认 `random` */
    order?: DivideOrder;
}

function shuffle<T>(values: T[]): void {
    for (let index = values.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [values[index], values[randomIndex]] = [values[randomIndex], values[index]];
    }
}

/** 判断 `children` 中的每个元素是否都能在 `parent` 中按严格相等找到 */
export function isIncludeAllChildren<T>(children: readonly T[], parent: readonly T[]): boolean {
    return children.every((item) => parent.some((candidate) => candidate === item));
}

/** 返回所有输入数组按严格相等比较后的交集 */
export function intersection<T>(...arrays: ReadonlyArray<readonly T[]>): T[] {
    return arrays.reduce<T[]>((result, array) => result.filter((item) => array.includes(item)), [...(arrays[0] ?? [])]);
}

/** 原地交换两个元素，并返回同一数组引用 */
export function swapOrder<T>(array: T[], firstIndex: number, secondIndex: number): T[] {
    array[firstIndex] = array.splice(secondIndex, 1, array[firstIndex])[0];
    return array;
}

/**
 * 提取对象数组中的指定字段。
 *
 * @param duplicates - 为 `true` 时去重，默认 `true`；为 `false` 时保留重复值
 */
export function getKeyList<T extends object, TKey extends keyof T>(
    array: readonly T[],
    key: TKey,
    duplicates = true,
): Array<NonNullable<T[TKey]>> {
    const values: Array<NonNullable<T[TKey]>> = [];
    for (const item of array) {
        const value = item[key];
        if (value !== undefined && value !== null) values.push(value as NonNullable<T[TKey]>);
    }
    return duplicates ? [...new Set(values)] : values;
}

/**
 * 将整数总数随机分配到指定份数，并保持总和及可选上下限。
 *
 * `parts` 必须是正整数；约束无法满足时会输出错误并返回空数组。
 */
export function randomDivide(total: number, parts: number, options: DivideOptions = {}): number[] {
    const minimum = options.minPerPart ?? 0;
    const maximum = options.maxPerPart;
    const order = options.order ?? "random";
    if ((options.minPerPart && total < parts * minimum) || (maximum && total > parts * maximum)) {
        console.error("总数不足以按指定的最小阀值分成相应的份数，或者总数超过了按最大阀值分配的能力");
        return [];
    }
    const remaining = total - minimum * parts;
    const weights = Array.from({ length: parts }, () => Math.random());
    const totalWeight = weights.reduce((value, item) => value + item, 0);
    const result = weights.map((weight) => {
        const randomPart = Math.floor((weight / totalWeight) * remaining);
        return maximum === undefined ? minimum + randomPart : Math.min(minimum + randomPart, maximum);
    });
    let current = result.reduce((value, item) => value + item, 0);
    let index = 0;
    while (current !== total) {
        if (index >= result.length) index = 0;
        if (current < total && (maximum === undefined || result[index] < maximum)) {
            result[index]++;
            current++;
        } else if (current > total && result[index] > minimum) {
            result[index]--;
            current--;
        }
        index++;
    }
    if (order === "asc") result.sort((a, b) => a - b);
    else if (order === "desc") result.sort((a, b) => b - a);
    else shuffle(result);
    return result;
}

/** 判断 `checkArray` 的全部元素是否都在 `array` 中按严格相等存在 */
export function arrayAllExist<T>(array: readonly T[], checkArray: readonly T[]): boolean {
    if (!Array.isArray(array) || !Array.isArray(checkArray)) return false;
    const values = new Set(array);
    return checkArray.every((value) => values.has(value));
}

/** 使用 `deepEqual` 判断待检查数组中的每个值是否都存在 */
export function arrayAllExistDeep(array: readonly unknown[], checkArray: readonly unknown[]): boolean {
    return checkArray.every((candidate) => array.some((item) => deepEqual(item, candidate)));
}

/** 判断 `checkArray` 是否至少有一个元素在 `array` 中按严格相等存在 */
export function arrayAnyExist<T>(array: readonly T[], checkArray: readonly T[]): boolean {
    if (!Array.isArray(array) || !Array.isArray(checkArray)) return false;
    const values = new Set(array);
    return checkArray.some((value) => values.has(value));
}

/** 使用 `deepEqual` 判断待检查数组中是否至少有一个值存在 */
export function arrayAnyExistDeep(array: readonly unknown[], checkArray: readonly unknown[]): boolean {
    return checkArray.some((candidate) => array.some((item) => deepEqual(item, candidate)));
}

/** 从对象数组中提取指定键，并保留键值类型推导 */
export function extractFields<T, TKey extends keyof T>(array: readonly T[], ...keys: TKey[]): Array<Pick<T, TKey>> {
    return array.map((item) => {
        const result = {} as Pick<T, TKey>;
        for (const key of keys) result[key] = item[key];
        return result;
    });
}
