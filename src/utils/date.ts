const YEAR_TOKEN = /(Y+)/;
const DATE_TOKENS = ["M+", "D+", "H+", "m+", "s+"] as const;
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"] as const;

/** 当前日期的预设格式：`1` 中文、`2` 横线、`3` 斜杠 */
export type CurrentDateFormat = 1 | 2 | 3;

/** 当前日期的年月日、时分秒和星期 */
export interface CurrentDateResult {
    /** 已格式化的年月日 */
    ymd: string;
    /** 已格式化的时分秒 */
    hms: string;
    /** 包含配置前缀的星期文本 */
    week: string;
}

/** 当前日期格式配置 */
export interface CurrentDateOptions {
    /** `1`：中文；`2`：横线；`3`：斜杠 */
    type?: CurrentDateFormat;
    /** 星期文本前缀，默认 `星期` */
    prefix?: string;
}

/**
 * 时、分、秒结构。
 *
 * 小于 `10` 且启用补零时，对应字段为字符串。
 */
export interface TimeParts {
    /** 小时；启用补零且不足两位时为字符串 */
    h: number | string;
    /** 分钟；启用补零且不足两位时为字符串 */
    m: number | string;
    /** 秒；启用补零且不足两位时为字符串 */
    s: number | string;
}

function getTokenValue(date: Date, token: (typeof DATE_TOKENS)[number]): number {
    switch (token) {
        case "M+":
            return date.getMonth() + 1;
        case "D+":
            return date.getDate();
        case "H+":
            return date.getHours();
        case "m+":
            return date.getMinutes();
        case "s+":
            return date.getSeconds();
    }
}

/** 使用 `Y`、`M`、`D`、`H`、`m`、`s` 令牌格式化当前日期 */
export function dateFormat(format: string): string {
    const date = new Date();
    let result = format;
    const yearMatch = YEAR_TOKEN.exec(result);

    if (yearMatch) {
        result = result.replace(yearMatch[0], String(date.getFullYear()).slice(4 - yearMatch[0].length));
    }

    for (const token of DATE_TOKENS) {
        const match = new RegExp(`(${token})`).exec(result);
        if (!match) continue;

        const value = getTokenValue(date, token);
        const replacement = match[0].length === 1 ? String(value) : `00${value}`.slice(String(value).length);
        result = result.replace(match[0], replacement);
    }

    return result;
}

/**
 * 返回当前星期。
 *
 * @param prefix - 文本前缀，默认 `星期`
 */
export function getCurrentWeek(prefix = "星期"): string {
    return `${prefix}${WEEKDAYS[new Date().getDay()]}`;
}

/**
 * 返回指定日期所在月份的总天数。
 *
 * 无效日期返回 `NaN`。
 */
export function monthDays(time: Date | string): number {
    const date = new Date(time);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * 返回从当前年份到起始年份的倒序年份数组。
 *
 * 起始年份晚于当前年份时返回空数组。
 */
export function createYear(start: number): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];

    for (let year = start; year <= currentYear; year++) {
        years.push(year);
    }

    return years.reverse();
}

/** 按配置返回当前日期、时间和星期 */
export function getCurrentDate(options: CurrentDateOptions = {}): CurrentDateResult {
    const week = getCurrentWeek(options.prefix ?? "星期");

    switch (options.type ?? 1) {
        case 2:
            return { ymd: dateFormat("YYYY-MM-DD"), hms: dateFormat("HH-mm-ss"), week };
        case 3:
            return { ymd: dateFormat("YYYY/MM/DD"), hms: dateFormat("HH/mm/ss"), week };
        case 1:
        default:
            return { ymd: dateFormat("YYYY年MM月DD日"), hms: dateFormat("HH时mm分ss秒"), week };
    }
}

/**
 * 将秒数转换为时、分、秒。
 *
 * @param seconds - 秒数，小数部分向下取整
 * @param pad - 是否为小于 `10` 的值补零，默认 `true`
 */
export function getTime(seconds: number, pad = true): TimeParts {
    function normalize(value: number): number | string {
        const integer = Math.floor(value);
        return integer < 10 && pad ? `0${integer}` : integer;
    }

    return {
        h: normalize(seconds / 3600),
        m: normalize((seconds % 3600) / 60),
        s: normalize(seconds % 60),
    };
}
