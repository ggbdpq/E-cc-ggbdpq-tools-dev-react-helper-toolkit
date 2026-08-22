import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    addZero,
    centsToDollars,
    dollarsToCents,
    getDecimalPlaces,
    priceToThousands,
    priceUppercase,
} from "../amount";
import { darken, hexToRgb, lighten, randomColor, randomGradient, rgbToHex } from "../color";
import { bd09togcj02, gcj02tobd09, gcj02towgs84, out_of_china, wgs84togcj02 } from "../coordtransform";
import { debounce, delay, throttle } from "../debounce";
import {
    hasCNChars,
    isAllEmpty,
    isAlphabets,
    isArray,
    isBase64,
    isBoolean,
    isDate,
    isDef,
    isEmail,
    isEmpty,
    isExistSpace,
    isFunction,
    isHex,
    isHtml,
    isJSON,
    isLeapYear,
    isLowerCase,
    isNull,
    isNullAndUnDef,
    isNullOrUnDef,
    isNumber,
    isObject,
    isPhone,
    isPlainObject,
    isPostCode,
    isPromise,
    isQQ,
    isRegExp,
    isRgb,
    isRgba,
    isString,
    isUnDef,
    isUpperCase,
    isUrl,
} from "../is";
import {
    addition,
    average,
    divisionOperation,
    exceedMathMax,
    formatBytes,
    max,
    min,
    multiplication,
    numberToChinese,
    subtraction,
    sum,
} from "../math";

describe("is utils", () => {
    it("判断基础类型和空值", () => {
        expect(isObject({})).toBe(true);
        expect(isPlainObject(Object.create(null))).toBe(true);
        expect(isDef(0)).toBe(true);
        expect(isUnDef(undefined)).toBe(true);
        expect(isNull(null)).toBe(true);
        expect(isNullAndUnDef(null)).toBe(false);
        expect(isNullOrUnDef(undefined)).toBe(true);
        expect(isEmpty([])).toBe(true);
        expect(isAllEmpty(null)).toBe(true);
        expect(isDate(new Date())).toBe(true);
        expect(isLeapYear(2024)).toBe(true);
        expect(isNumber(1)).toBe(true);
        expect(isPromise(Promise.resolve())).toBe(true);
        expect(isString("x")).toBe(true);
        expect(isFunction(() => undefined)).toBe(true);
        expect(isBoolean(false)).toBe(true);
        expect(isRegExp(/x/)).toBe(true);
        expect(isArray([])).toBe(true);
        expect(isJSON('{"a":1}')).toBe(true);
        expect(isJSON("[1]")).toBe(false);
    });

    it("判断颜色、地址和文本格式", () => {
        expect(isBase64("dGVzdA==")).toBe(true);
        expect(isHex("#abcdef")).toBe(true);
        expect(isRgb("rgb(1,2,3)")).toBe(true);
        expect(isRgba("rgba(1, 2, 3, 0.5)")).toBe(true);
        expect(isUrl("https://example.com?a=1")).toBe(true);
        expect(isPhone("13800138000")).toBe(true);
        expect(isEmail("a@example.com")).toBe(true);
        expect(isQQ(12345)).toBe(true);
        expect(isPostCode(450000)).toBe(true);
        expect(hasCNChars("abc中")).toBe(true);
        expect(isLowerCase("abc")).toBe(true);
        expect(isUpperCase("ABC")).toBe(true);
        expect(isAlphabets("AbC")).toBe(true);
        expect(isExistSpace("a b")).toBe(true);
        expect(isHtml("<div>x</div>")).toBe(true);
    });
});

describe("debounce utils", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("延迟、防抖和节流保持参考时序", async () => {
        const delayed = vi.fn();
        void delay(20).then(delayed);
        await vi.advanceTimersByTimeAsync(20);
        expect(delayed).toHaveBeenCalledOnce();

        const debounced = vi.fn();
        const runDebounced = debounce(debounced, 100);
        runDebounced("first");
        runDebounced("last");
        await vi.advanceTimersByTimeAsync(100);
        expect(debounced).toHaveBeenCalledOnce();
        expect(debounced).toHaveBeenCalledWith("last");

        const throttled = vi.fn();
        const runThrottled = throttle(throttled, 100);
        runThrottled("first");
        runThrottled("ignored");
        await vi.advanceTimersByTimeAsync(100);
        expect(throttled).toHaveBeenCalledOnce();
        expect(throttled).toHaveBeenCalledWith("first");
    });
});

describe("math and amount utils", () => {
    it("执行参考数学和格式化行为", () => {
        const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        expect(max([1, 3, 5, 6])).toBe(6);
        expect(min([1, 3, 5, 6])).toBe(1);
        expect(sum([1, 3, 5, 6])).toBe(15);
        expect(average([1, 3, 5, 6])).toBe(3.75);
        expect(numberToChinese(123)).toBe("一百二十三");
        expect(addition(1.4003, 100)).toBe(101.4003);
        expect(subtraction(1.4003, 100)).toBe(-98.5997);
        expect(multiplication(1.4003, 100)).toBe(140.03);
        expect(divisionOperation(1.4003, 100)).toBe(0.014003000000000002);
        expect(formatBytes(123456)).toBe("120.56 KB");
        expect(exceedMathMax(Number.MAX_SAFE_INTEGER + 1)).toBe(true);

        consoleWarn.mockRestore();
    });

    it("执行参考金额行为", () => {
        expect(addZero(10)).toBe("10.00");
        expect(centsToDollars(1000)).toBe("10.00");
        expect(dollarsToCents(1.23)).toBe(123);
        expect(getDecimalPlaces(1.23)).toBe(2);
        expect(priceUppercase(10)).toBe("壹拾元整");
        expect(priceToThousands(123456789.567, { digit: 2 })).toBe("123,456,789.56");
        expect(priceToThousands(123456789.567, { digit: 2, round: true })).toBe("123,456,789.57");
    });
});

describe("color and coordinate utils", () => {
    afterEach(() => vi.restoreAllMocks());

    it("转换和调整颜色", () => {
        expect(hexToRgb("#e6c2cf")).toEqual([230, 194, 207]);
        expect(rgbToHex(230, 194, 207)).toBe("#e6c2cf");
        expect(darken("#e6c2cf", 0.1)).toBe("#cfaeba");
        expect(lighten("#eb2f96", 0.5)).toBe("#f597ca");
        expect(randomGradient({ baseHue: 10 })).toBe(
            "linear-gradient(135deg, hsl(10, 70%, 60%), hsl(40, 70%, 60%), hsl(190, 70%, 60%))",
        );
        expect(randomColor({ type: "hex", num: 2 })).toHaveLength(2);
    });

    it("转换坐标并判断境外坐标", () => {
        expect(bd09togcj02(113.6401, 34.72468)).toHaveLength(2);
        expect(gcj02tobd09(113.6401, 34.72468)).toHaveLength(2);
        expect(wgs84togcj02(113.6401, 34.72468)).toHaveLength(2);
        expect(gcj02towgs84(113.6401, 34.72468)).toHaveLength(2);
        expect(out_of_china(113.6401, 34.72468)).toBe(false);
        expect(out_of_china(3.95, 21.99)).toBe(true);
    });
});
