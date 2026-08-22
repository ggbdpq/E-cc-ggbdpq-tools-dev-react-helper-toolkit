const LEADING_WHITESPACE = /^\s*/;
const TRAILING_WHITESPACE = /\s*$/;
const SURROUNDING_WHITESPACE = /^\s*|\s*$/g;
const ALL_WHITESPACE = /\s/g;

/** 删除字符串左侧的全部空白字符 */
export function removeLeftSpace(text: string): string {
    return text.replace(LEADING_WHITESPACE, "");
}

/** 删除字符串右侧的全部空白字符 */
export function removeRightSpace(text: string): string {
    return text.replace(TRAILING_WHITESPACE, "");
}

/** 删除字符串两侧的全部空白字符 */
export function removeBothSidesSpace(text: string): string {
    return text.replace(SURROUNDING_WHITESPACE, "");
}

/** 删除字符串中的全部空白字符，包括制表符和换行符 */
export function removeAllSpace(text: string): string {
    return text.replace(ALL_WHITESPACE, "");
}
