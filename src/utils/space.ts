const LEADING_WHITESPACE = /^\s*/;
const TRAILING_WHITESPACE = /\s*$/;
const SURROUNDING_WHITESPACE = /^\s*|\s*$/g;
const ALL_WHITESPACE = /\s/g;

/**
 * 删除字符串左侧的全部空白字符。
 *
 * @param text 原始字符串
 * @returns 删除左侧空白后的新字符串
 */
export function removeLeftSpace(text: string): string {
    return text.replace(LEADING_WHITESPACE, "");
}

/**
 * 删除字符串右侧的全部空白字符。
 *
 * @param text 原始字符串
 * @returns 删除右侧空白后的新字符串
 */
export function removeRightSpace(text: string): string {
    return text.replace(TRAILING_WHITESPACE, "");
}

/**
 * 删除字符串两侧的全部空白字符。
 *
 * @param text 原始字符串
 * @returns 删除两侧空白后的新字符串
 */
export function removeBothSidesSpace(text: string): string {
    return text.replace(SURROUNDING_WHITESPACE, "");
}

/**
 * 删除字符串中的全部空白字符，包括制表符和换行符。
 *
 * @param text 原始字符串
 * @returns 删除全部空白后的新字符串
 */
export function removeAllSpace(text: string): string {
    return text.replace(ALL_WHITESPACE, "");
}
