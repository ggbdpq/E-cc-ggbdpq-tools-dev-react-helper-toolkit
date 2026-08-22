/** 返回非空数字数组的最大值；无效或空数组返回 `0` */
export function max(list: number[]): number {
    return Array.isArray(list) && list.length > 0 ? Math.max(...list) : 0;
}

/** 返回非空数字数组的最小值；无效或空数组返回 `0` */
export function min(list: number[]): number {
    return Array.isArray(list) && list.length > 0 ? Math.min(...list) : 0;
}

/** 返回数字数组总和；无效或空数组返回 `0` */
export function sum(list: number[]): number {
    return Array.isArray(list) && list.length > 0 ? list.reduce((total, value) => total + value) : 0;
}

/** 返回数字数组平均值；无效或空数组返回 `0` */
export function average(list: number[]): number {
    return Array.isArray(list) && list.length > 0 ? sum(list) / list.length : 0;
}

/**
 * 将非负整数或小数转换为中文数字文本。
 *
 * 保留参考实现的万、亿分组与小数逐位转换规则。
 */
export function numberToChinese(value: number | string): string {
    if (!value && typeof value === "undefined") return "";
    if (Number(value) === 0) return "零";

    const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    const units = ["", "十", "百", "千", "万", "亿", "点", ""];
    const parts = String(value).replace(/(^0*)/g, "").split(".");
    let unitIndex = 0;
    let result = "";

    for (let index = parts[0].length - 1; index >= 0; index--) {
        switch (unitIndex) {
            case 0:
                result = units[7] + result;
                break;
            case 4:
                if (!new RegExp(`0{4}//d{${parts[0].length - index - 1}}$`).test(parts[0])) result = units[4] + result;
                break;
            case 8:
                result = units[5] + result;
                units[7] = units[5];
                unitIndex = 0;
                break;
        }

        if (unitIndex % 4 === 2 && parts[0].charAt(index + 2) !== "0" && parts[0].charAt(index + 1) === "0") {
            result = digits[0] + result;
        }
        const character = parts[0].charAt(index);
        if (character !== "0") result = digits[Number(character)] + units[unitIndex % 4] + result;
        unitIndex++;
    }

    if (parts.length > 1) {
        result += units[6];
        for (const character of parts[1]) result += digits[Number(character)];
    }
    if (result === "一十") result = "十";
    if (result.startsWith("一") && result.length === 3) result = result.replace("一", "");
    return result;
}

/** 判断数值是否超过 JavaScript 最大安全整数；超过时输出控制台警告 */
export function exceedMathMax(value: number): boolean {
    const exceeded = value > Number.MAX_SAFE_INTEGER;
    if (exceeded) console.warn("The calculation length has exceeded the JS maximum security integer");
    return exceeded;
}

function getIntegerScale(first: number, second: number): number {
    const firstDecimals = first.toString().split(".")[1]?.length ?? 0;
    const secondDecimals = second.toString().split(".")[1]?.length ?? 0;
    return 10 ** Math.max(firstDecimals, secondDecimals);
}

function roundResult(value: number, decimal?: number): number {
    return decimal ? Number(value.toFixed(decimal)) : value;
}

/** 使用整数缩放降低常见十进制加法误差，可按 `decimal` 保留小数位 */
export function addition(first: number, second: number, decimal?: number): number {
    const scale = getIntegerScale(first, second);
    const scaled = first * scale + second * scale;
    exceedMathMax(scaled);
    return roundResult(scaled / scale, decimal);
}

/** 使用整数缩放降低常见十进制减法误差，可按 `decimal` 保留小数位 */
export function subtraction(first: number, second: number, decimal?: number): number {
    const scale = getIntegerScale(first, second);
    const scaled = first * scale - second * scale;
    exceedMathMax(scaled);
    return roundResult(scaled / scale, decimal);
}

/** 计算乘积并检查安全整数上限，可按 `decimal` 保留小数位 */
export function multiplication(first: number, second: number, decimal?: number): number {
    const result = first * second;
    exceedMathMax(result);
    return roundResult(result, decimal);
}

/** 计算商并检查安全整数上限；除数为零时遵循 JavaScript 数值语义 */
export function divisionOperation(first: number, second: number, decimal?: number): number {
    const scale = getIntegerScale(first, second);
    const result = (first * scale) / (second * scale);
    exceedMathMax(result);
    return roundResult(result, decimal);
}

/** 将非负字节数格式化为以 `1024` 为进位的单位字符串，默认保留两位小数 */
export function formatBytes(byte: number, digits?: number): string {
    if (byte === 0) return "0 Bytes";
    const base = 1024;
    const precision = digits || 2;
    const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const unitIndex = Math.floor(Math.log(byte) / Math.log(base));
    return `${Number.parseFloat((byte / base ** unitIndex).toFixed(precision))} ${units[unitIndex]}`;
}
