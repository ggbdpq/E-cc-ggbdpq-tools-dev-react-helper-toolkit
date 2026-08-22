const HEX_CHARACTERS = "0123456789abcdef";
const UUID_CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** 生成 32 位小写 UUID 字符串 */
export function buildUUID(): string {
    let result = "";

    for (let position = 1; position <= 36; position++) {
        if (position === 9 || position === 14 || position === 19 || position === 24) {
            result += "-";
        } else if (position === 15) {
            result += "4";
        } else if (position === 20) {
            result += HEX_CHARACTERS[(Math.random() * 4) | 8];
        } else {
            result += HEX_CHARACTERS[(Math.random() * 16) | 0];
        }
    }

    return result.replace(/-/g, "");
}

/** 生成 36 位带横线的小写 GUID 字符串 */
export function buildGUID(): string {
    let result = "";

    for (let position = 1; position <= 36; position++) {
        if (position === 9 || position === 14 || position === 19 || position === 24) {
            result += "-";
        } else if (position === 15) {
            result += "4";
        } else if (position === 20) {
            result += HEX_CHARACTERS[(Math.random() * 4) | 8];
        } else {
            result += HEX_CHARACTERS[Math.floor(Math.random() * 16)];
        }
    }

    return result;
}

/** 生成由前缀、随机数、固定序号 `1` 和时间戳组成的字符串 */
export function buildPrefixUUID(prefix = ""): string {
    const random = Math.floor(Math.random() * 1_000_000_000);
    return `${prefix}${random}1${Date.now()}`;
}

/**
 * 生成指定长度和基数的随机字符串；未提供有效长度时生成标准 UUID。
 *
 * @param length - 自定义长度
 * @param radix - 字符基数，默认 `62`
 */
export function uuid(length?: number, radix?: number, prefix = ""): string {
    const result: Array<string | undefined> = [];
    const normalizedRadix = radix || UUID_CHARACTERS.length;

    if (length) {
        for (let index = 0; index < length; index++) {
            result[index] = UUID_CHARACTERS[0 | (Math.random() * normalizedRadix)];
        }
    } else {
        result[8] = result[13] = result[18] = result[23] = "-";
        result[14] = "4";

        for (let index = 0; index < 36; index++) {
            if (result[index]) continue;
            const random = 0 | (Math.random() * 16);
            result[index] = UUID_CHARACTERS[index === 19 ? (random & 0x3) | 0x8 : random];
        }
    }

    return `${prefix}${result.join("")}`;
}
