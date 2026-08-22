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

/** 中文字符检测的字符范围配置 */
export interface HasChineseOptions {
    /** 检测前是否移除全部空白字符 */
    pure?: boolean;
    /** 是否要求整个字符串都由允许的字符组成 */
    all?: boolean;
    /** 在默认中文和中文标点范围后追加的 Unicode 范围文本 */
    unicode?: string;
    /** 用自定义 Unicode 范围替换默认中文标点范围 */
    replaceUnicode?: string;
}

/** 使用 `Object.prototype.toString` 判断值的内置类型标签 */
export function is(value: unknown, type: string): boolean {
    return objectToString.call(value) === `[object ${type}]`;
}

/** 判断值是否具有 `[object Object]` 类型标签 */
export function isObject(value: unknown): value is Record<PropertyKey, unknown> {
    return value !== null && is(value, "Object");
}

/** 判断值是否为原型是 `Object.prototype` 或 `null` 的普通对象 */
export function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
    if (objectToString.call(value) !== "[object Object]") return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
}

/** 判断值是否已经定义，即不为 `undefined` */
export function isDef<T>(value: T | undefined): value is T {
    return typeof value !== "undefined";
}

/** 判断值是否为 `undefined` */
export function isUnDef(value: unknown): value is undefined {
    return !isDef(value);
}

/** 判断值是否为 `null` */
export function isNull(value: unknown): value is null {
    return value === null;
}

/** 保持参考实现：单个值不可能同时为 `null` 和 `undefined` */
export function isNullAndUnDef(value: unknown): value is never {
    return isNull(value) && isUnDef(value);
}

/** 判断值是否为 `null` 或 `undefined` */
export function isNullOrUnDef(value: unknown): value is null | undefined {
    return isNull(value) || isUnDef(value);
}

/** 判断字符串、数组、Map、Set 或普通对象是否没有成员 */
export function isEmpty(value: unknown): boolean {
    if (Array.isArray(value) || typeof value === "string") return value.length === 0;
    if (value instanceof Map || value instanceof Set) return value.size === 0;
    if (isObject(value)) return Object.keys(value).length === 0;
    return false;
}

/** 判断值是否为空集合、空字符串、`null` 或 `undefined` */
export function isAllEmpty(value: unknown): boolean {
    return isEmpty(value) || isNullOrUnDef(value);
}

/** 判断值的类型标签是否为 `Date`；不检查日期是否有效 */
export function isDate(value: unknown): value is Date {
    return is(value, "Date");
}

/** 按公历规则判断年份是否为闰年 */
export function isLeapYear(value: number): boolean {
    return value % 4 === 0 && (value % 100 !== 0 || value % 400 === 0);
}

/** 判断值是否为 `number`；`NaN` 也属于 `number` */
export function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

/** 判断值是否为原生 `Promise` 或具有标准 Promise 标识的 thenable */
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

/** 判断值是否为字符串原始值 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/** 判断值是否为函数 */
export function isFunction(value: unknown): value is (...args: never[]) => unknown {
    return typeof value === "function";
}

/** 判断值是否为布尔原始值 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

/** 判断值的类型标签是否为 `RegExp` */
export function isRegExp(value: unknown): value is RegExp {
    return is(value, "RegExp");
}

/** 判断值是否为数组 */
export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

/** 判断字符串能否解析为 JSON 对象；数组和 JSON 原始值返回 `false` */
export function isJSON(value: unknown): boolean {
    if (!isString(value)) return false;
    try {
        const parsed: unknown = JSON.parse(value);
        return isObject(parsed);
    } catch {
        return false;
    }
}

/** 判断值是否为当前浏览器环境中的 `Window` */
export function isWindow(value: unknown): value is Window {
    return typeof window !== "undefined" && is(value, "Window");
}

/**
 * 判断具有 `[object Object]` 标签的值是否包含 `tagName`。
 *
 * 这是参考实现的类 Element 判断，并不保证原生 DOM Element 在所有环境中都能命中。
 */
export function isElement(value: unknown): value is Element {
    return isObject(value) && "tagName" in value && Boolean(value.tagName);
}

/** 判断字符串能否通过 `atob`/`btoa` 完整往返；非浏览器环境或解码失败时返回 `false` */
export function isBase64(value: string): boolean {
    if (value.trim() === "") return false;
    try {
        return btoa(atob(value)) === value;
    } catch {
        return false;
    }
}

/** 判断字符串是否为三位或六位十六进制颜色 */
export function isHex(value: string): boolean {
    return HEX_PATTERN.test(value);
}

/** 判断字符串是否符合三个整数通道的 `rgb(...)` 形式 */
export function isRgb(value: string): boolean {
    return RGB_PATTERN.test(value);
}

/** 判断字符串是否符合三个整数通道和一个透明度通道的 `rgba(...)` 形式 */
export function isRgba(value: string): boolean {
    return RGBA_PATTERN.test(value);
}

/** 模块初始化时是否不存在 `window` */
export const isServer = typeof window === "undefined";
/** 模块初始化时是否存在 `window` */
export const isClient = !isServer;
/** 模块初始化时是否存在 `document` */
export const isBrowser = typeof document !== "undefined";

/** 判断字符串是否符合本项目兼容的 HTTP、FTP、WebSocket 等 URL 格式 */
export function isUrl(value: string): boolean {
    return URL_PATTERN.test(value);
}

/** 判断值是否符合中国大陆手机号段规则 */
export function isPhone(value: string | number): boolean {
    return PHONE_PATTERN.test(String(value));
}

/** 判断字符串是否符合基础电子邮箱格式 */
export function isEmail(value: string): boolean {
    return EMAIL_PATTERN.test(value);
}

/** 判断数字是否符合 5 到 13 位 QQ 号格式 */
export function isQQ(value: number): boolean {
    return QQ_PATTERN.test(value.toString());
}

/** 判断数字是否符合六位中国邮政编码格式 */
export function isPostCode(value: number): boolean {
    return POST_CODE_PATTERN.test(value.toString());
}

/** 按配置判断文本是否包含或完全由中文及允许的标点组成 */
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

/** 判断字符串是否只包含小写英文字母且不为空 */
export function isLowerCase(value: string): boolean {
    return LOWER_CASE_PATTERN.test(value);
}

/** 判断字符串是否只包含大写英文字母且不为空 */
export function isUpperCase(value: string): boolean {
    return UPPER_CASE_PATTERN.test(value);
}

/** 判断字符串是否只包含英文字母且不为空 */
export function isAlphabets(value: string): boolean {
    return ALPHABETS_PATTERN.test(value);
}

/** 判断字符串是否至少包含一个空白字符 */
export function isExistSpace(value: string): boolean {
    return SPACE_PATTERN.test(value);
}

/** 判断字符串是否包含形如 HTML 标签的片段；不验证完整 HTML 语法 */
export function isHtml(value: string): boolean {
    return HTML_PATTERN.test(value);
}
