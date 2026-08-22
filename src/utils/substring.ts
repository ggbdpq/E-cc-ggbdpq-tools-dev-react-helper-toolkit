/** 需要隐藏的闭区间 */
export interface HideTextIndex {
    /** 起始索引，包含该位置 */
    start: number;
    /** 结束索引，包含该位置 */
    end: number;
}

/** 单个字符索引或需要隐藏的闭区间 */
export type HideTextAtIndexInput = number | HideTextIndex;

function isHideTextIndex(value: unknown): value is HideTextIndex {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    if (!("start" in value) || !("end" in value)) {
        return false;
    }

    return typeof value.start === "number" && typeof value.end === "number";
}

/**
 * 返回指定字符第一次出现位置之前的内容。
 *
 * 字符不存在时返回空字符串。
 */
export function subBefore(text: string, character: string): string {
    if (typeof character !== "string") return "";
    return text.substring(0, text.indexOf(character));
}

/**
 * 返回指定字符最后一次出现位置之后的内容。
 *
 * 字符不存在时仍按参考实现的 `substring` 起点规则截取，不保证返回原文。
 */
export function subAfter(text: string, character: string): string {
    if (typeof character !== "string") return "";
    return text.substring(text.lastIndexOf(character) + character.length, text.length);
}

/** 同时返回指定字符第一次出现位置之前和最后一次出现位置之后的内容 */
export function subBothSides(text: string, character: string): [string, string];
export function subBothSides(text: string, character: string): [string, string] | [] {
    if (typeof character !== "string") return [];
    return [subBefore(text, character), subAfter(text, character)];
}

/**
 * 返回两个指定字符之间的内容。
 *
 * 任一分隔字符不存在时仍按参考实现的索引规则截取，不保证返回空字符串。
 */
export function subBetween(text: string, before: string, after: string): string {
    if (typeof before !== "string" || typeof after !== "string") return "";
    const contentAfterStart = text.substring(text.indexOf(before) + before.length, text.length);
    return contentAfterStart.substring(0, contentAfterStart.indexOf(after));
}

/**
 * 超过指定长度时截断文本并追加省略号。
 *
 * @param length - 保留长度，默认 `3`
 */
export function subTextAddEllipsis(value: string | number, length = 3): string {
    const text = value.toString();
    if (Number.isNaN(length) || text.length <= length) return text;

    const normalizedLength = Math.max(0, Math.trunc(length));
    return `${text.substring(0, normalizedLength)}...`;
}

/**
 * 将非零数字拆分为逐位数字数组。
 *
 * 为保持参考行为，`0` 和 `NaN` 返回空字符串。
 */
export function splitNum(value: number): number[] | "" {
    if (!value) return "";
    return [...value.toString()].map(Number);
}

/**
 * 使用指定符号隐藏单个索引或闭区间内的字符。
 *
 * @param index - 单个索引、闭区间或二者组成的只读数组
 * @param symbol - 替换符号，默认 `*`
 */
export function hideTextAtIndex(
    value: string | number,
    index: HideTextAtIndexInput | readonly HideTextAtIndexInput[],
    symbol = "*",
): string {
    const characters = value.toString().split("");
    const indexes = Array.isArray(index) ? index : [index];

    for (const current of indexes) {
        if (isHideTextIndex(current)) {
            const { start, end } = current;
            if (start >= 0 && start < end) {
                characters.fill(symbol, start, end + 1);
            }
            continue;
        }

        if (typeof current === "number" && Number.isInteger(current) && current >= 0) {
            characters[current] = symbol;
        }
    }

    return characters.join("");
}
