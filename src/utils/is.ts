import { removeAllSpace } from "./space";

const objectToString = Object.prototype.toString;
const HEX_PATTERN = /^#[a-fA-F0-9]{3}$|#[a-fA-F0-9]{6}$/;
const RGB_PATTERN = /^rgb\((\s*\d+\s*,?){3}\)$/;
const RGBA_PATTERN = /^rgba\((\s*\d+\s*,\s*){3}\s*\d(\.\d+)?\s*\)$/;
const PHONE_PATTERN = /^[1](([3][0-9])|([4][0,1,4-9])|([5][0-3,5-9])|([6][2,5,6,7])|([7][0-8])|([8][0-9])|([9][0-3,5-9]))[0-9]{8}$/;
const EMAIL_PATTERN = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
const QQ_PATTERN = /^[1-9][0-9]{4,12}$/;
const POST_CODE_PATTERN = /^[1-9][0-9]{5}$/;
const LOWER_CASE_PATTERN = /^[a-z]+$/;
const UPPER_CASE_PATTERN = /^[A-Z]+$/;
const ALPHABETS_PATTERN = /^[A-Za-z]+$/;
const SPACE_PATTERN = /\s+/;
const HTML_PATTERN = /<("[^"]*"|'[^']*'|[^'">])*>/;
const URL_PATTERN = new RegExp(
    "^" +
        "(?:(https?|ftp|rtsp|mms|ws|wss):\\/\\/)?" +
        "(?:\\S+(?::\\S*)?@)?" +
        "(?:(?:localhost)|(?:[1-9]\\d{0,2}(?:\\.\\d{1,3}){3})|(?:$[0-9a-fA-F:]+$)|(?:(?:[a-zA-Z0-9-_]+\\.)+[a-zA-Z]{2,63}))" +
        "(?::\\d{1,5})?" +
        "(?:[/?#]\\S*)?" +
        "$",
    "i",
);

export interface HasChineseOptions {
    pure?: boolean;
    all?: boolean;
    unicode?: string;
    replaceUnicode?: string;
}

export function is(value: unknown, type: string): boolean {
    return objectToString.call(value) === `[object ${type}]`;
}

export function isObject(value: unknown): value is Record<PropertyKey, unknown> {
    return value !== null && is(value, "Object");
}

export function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
    if (objectToString.call(value) !== "[object Object]") return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
}

export function isDef<T>(value: T | undefined): value is T {
    return typeof value !== "undefined";
}

export function isUnDef(value: unknown): value is undefined {
    return !isDef(value);
}

export function isNull(value: unknown): value is null {
    return value === null;
}

/** 保持参考实现：单个值不可能同时为 null 和 undefined。 */
export function isNullAndUnDef(value: unknown): value is never {
    return isNull(value) && isUnDef(value);
}

export function isNullOrUnDef(value: unknown): value is null | undefined {
    return isNull(value) || isUnDef(value);
}

export function isEmpty(value: unknown): boolean {
    if (Array.isArray(value) || typeof value === "string") return value.length === 0;
    if (value instanceof Map || value instanceof Set) return value.size === 0;
    if (isObject(value)) return Object.keys(value).length === 0;
    return false;
}

export function isAllEmpty(value: unknown): boolean {
    return isEmpty(value) || isNullOrUnDef(value);
}

export function isDate(value: unknown): value is Date {
    return is(value, "Date");
}

export function isLeapYear(value: number): boolean {
    return value % 4 === 0 && (value % 100 !== 0 || value % 400 === 0);
}

export function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
    if (!value || (typeof value !== "object" && typeof value !== "function")) return false;
    const promiseLike = value as Partial<Promise<T>> & { constructor?: { name?: string } };
    return (
        value instanceof Promise ||
        (isFunction(promiseLike.then) &&
            isFunction(promiseLike.catch) &&
            (objectToString.call(value) === "[object Promise]" || promiseLike.constructor?.name === "Promise"))
    );
}

export function isString(value: unknown): value is string {
    return typeof value === "string";
}

export function isFunction(value: unknown): value is (...args: never[]) => unknown {
    return typeof value === "function";
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

export function isRegExp(value: unknown): value is RegExp {
    return is(value, "RegExp");
}

export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

export function isJSON(value: unknown): boolean {
    if (!isString(value)) return false;
    try {
        const parsed: unknown = JSON.parse(value);
        return isObject(parsed);
    } catch {
        return false;
    }
}

export function isWindow(value: unknown): value is Window {
    return typeof window !== "undefined" && is(value, "Window");
}

export function isElement(value: unknown): value is Element {
    return isObject(value) && "tagName" in value && Boolean(value.tagName);
}

export function isBase64(value: string): boolean {
    if (value.trim() === "") return false;
    try {
        return btoa(atob(value)) === value;
    } catch {
        return false;
    }
}

export function isHex(value: string): boolean {
    return HEX_PATTERN.test(value);
}

export function isRgb(value: string): boolean {
    return RGB_PATTERN.test(value);
}

export function isRgba(value: string): boolean {
    return RGBA_PATTERN.test(value);
}

export const isServer = typeof window === "undefined";
export const isClient = !isServer;
export const isBrowser = typeof document !== "undefined";

export function isUrl(value: string): boolean {
    return URL_PATTERN.test(value);
}

export function isPhone(value: string | number): boolean {
    return PHONE_PATTERN.test(String(value));
}

export function isEmail(value: string): boolean {
    return EMAIL_PATTERN.test(value);
}

export function isQQ(value: number): boolean {
    return QQ_PATTERN.test(value.toString());
}

export function isPostCode(value: number): boolean {
    return POST_CODE_PATTERN.test(value.toString());
}

export function hasCNChars(value: string | number, options: HasChineseOptions = {}): boolean {
    const chineseRange = "[\\u4E00-\\u9FFF";
    const punctuation = "\\u3002\\uff1b\\uff0c\\uff1a\\u201c\\u201d\\uff08\\uff09\\u3001\\uff1f\\u300a\\u300b\\uff01\\u3010\\u3011\\uffe5";
    const input = options.pure ? removeAllSpace(String(value)) : String(value);
    const characterRange = options.replaceUnicode
        ? `${chineseRange}${options.replaceUnicode}`
        : `${chineseRange}${punctuation}${options.unicode ?? ""}`;
    const pattern = options.all ? `(^${characterRange}]+$)` : `(${characterRange}]+)`;
    return new RegExp(pattern, "g").test(input);
}

export function isLowerCase(value: string): boolean {
    return LOWER_CASE_PATTERN.test(value);
}

export function isUpperCase(value: string): boolean {
    return UPPER_CASE_PATTERN.test(value);
}

export function isAlphabets(value: string): boolean {
    return ALPHABETS_PATTERN.test(value);
}

export function isExistSpace(value: string): boolean {
    return SPACE_PATTERN.test(value);
}

export function isHtml(value: string): boolean {
    return HTML_PATTERN.test(value);
}
