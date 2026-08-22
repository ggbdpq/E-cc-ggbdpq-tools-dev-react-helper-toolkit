import { isAllEmpty } from "./is";

/** 千分位金额格式化配置 */
export interface AmountOptions {
    /** 保留的小数位数，默认 `0` */
    digit?: number;
    /** 是否按 `Intl.NumberFormat` 四舍五入；默认 `false`，表示直接截断 */
    round?: boolean;
}

/** 将可解析值四舍五入到两位小数并补零；无效数值返回 `false` */
export function addZero(value: unknown): string | false {
    let number = Number.parseFloat(String(value));
    if (Number.isNaN(number)) return false;
    number = Math.round(Number(value) * 100) / 100;
    let result = number.toString();
    let decimalIndex = result.indexOf(".");
    if (decimalIndex < 0) {
        decimalIndex = result.length;
        result += ".";
    }
    while (result.length <= decimalIndex + 2) result += "0";
    return result;
}

/** 将分转换为元；格式化时固定两位小数，输入为 `NaN` 时返回 `false` */
export function centsToDollars(value: number, format = true): string | false {
    let result = String(value * 0.01);
    const pattern = result.includes(".") ? /(\d{1,3})(?=(?:\d{3})+\.)/g : /(\d{1,3})(?=(?:\d{3})+$)/g;
    result = result.replace(pattern, "$1");
    return format ? addZero(result) : result;
}

/**
 * 使用整数化乘法将金额转换为更小单位。
 *
 * @param digit - 换算倍率，默认 `100`，即元转分
 */
export function dollarsToCents(value: number, digit = 100): number {
    const first = value.toString();
    const second = digit.toString();
    const decimals = (first.split(".")[1]?.length ?? 0) + (second.split(".")[1]?.length ?? 0);
    return (Number(first.replace(".", "")) * Number(second.replace(".", ""))) / 10 ** decimals;
}

/** 返回数值文本的小数位数；科学计数法不会被展开 */
export function getDecimalPlaces(value: string | number): number {
    const text = value.toString();
    return text.includes(".") ? text.split(".")[1].length : 0;
}

/**
 * 将金额转换为中文大写金额。
 *
 * 空字符串、无法支持的超大金额返回空字符串；最多处理四位小数。
 *
 * @param value - 可转换为数字的金额
 * @param format - 没有小数部分时追加到“元”后的文本，默认“整”
 */
export function priceUppercase(value: unknown, format = "整"): string {
    const digits = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
    const radices = ["", "拾", "佰", "仟"];
    const units = ["", "万", "亿", "兆"];
    const decimalUnits = ["角", "分", "毫", "厘"];
    let integerSuffix = "元";
    const max = 999999999999999.9999;

    if (value == "") return "";
    const number = Number.parseFloat(String(value));
    if (number >= max) return "";
    if (number === 0) return "零元";

    const [integerPart, rawDecimal = ""] = String(number).split(".");
    const decimalPart = rawDecimal.slice(0, 4);
    if (!rawDecimal) integerSuffix = `元${format}`;
    let result = "";
    let zeroCount = 0;

    if (Number.parseInt(integerPart, 10) > 0) {
        for (let index = 0; index < integerPart.length; index++) {
            const digit = integerPart.charAt(index);
            const position = integerPart.length - index - 1;
            const unitGroup = position / 4;
            const radix = position % 4;
            if (digit === "0") {
                zeroCount++;
            } else {
                if (zeroCount > 0) result += digits[0];
                zeroCount = 0;
                result += digits[Number(digit)] + radices[radix];
            }
            if (radix === 0 && zeroCount < 4) result += units[unitGroup];
        }
        result += integerSuffix;
    }

    for (let index = 0; index < decimalPart.length; index++) {
        const digit = decimalPart.charAt(index);
        if (digit !== "0") result += digits[Number(digit)] + decimalUnits[index];
    }
    return result || `零${integerSuffix}`;
}

/**
 * 使用英文逗号格式化千分位，并按配置截断或四舍五入小数。
 *
 * `null`、`undefined` 和空值返回空字符串。
 */
export function priceToThousands(amount: number, options: AmountOptions = {}): string {
    if (isAllEmpty(amount)) return "";
    const digit = options.digit ?? 0;
    if (options.round ?? false) {
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: digit,
            maximumFractionDigits: digit,
        }).format(amount);
    }

    const [integerPart, decimalPart] = amount.toString().split(".");
    let formattedDecimal = "";
    if (decimalPart) formattedDecimal = decimalPart.slice(0, digit).padEnd(digit, "0");
    else if (digit > 0) formattedDecimal = "0".repeat(digit);
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return formattedInteger + (formattedDecimal ? `.${formattedDecimal}` : "");
}
