import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    createYear,
    dateFormat,
    getCurrentDate,
    getCurrentWeek,
    getTime,
    monthDays,
} from "../date";
import { getLocation, getQueryMap } from "../url";
import { buildGUID, buildPrefixUUID, buildUUID, uuid } from "../uuid";

describe("date utils", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 1, 29, 5, 6, 7));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("按参考令牌格式化当前日期", () => {
        expect(dateFormat("YYYY-MM-DD HH:mm:ss")).toBe("2024-02-29 05:06:07");
        expect(dateFormat("YY-M-D H:m:s")).toBe("24-2-29 5:6:7");
    });

    it("返回当前星期和三种日期格式", () => {
        expect(getCurrentWeek()).toBe("星期四");
        expect(getCurrentWeek("周")).toBe("周四");
        expect(getCurrentDate()).toEqual({ ymd: "2024年02月29日", hms: "05时06分07秒", week: "星期四" });
        expect(getCurrentDate({ type: 2, prefix: "周" })).toEqual({
            ymd: "2024-02-29",
            hms: "05-06-07",
            week: "周四",
        });
        expect(getCurrentDate({ type: 3 })).toEqual({
            ymd: "2024/02/29",
            hms: "05/06/07",
            week: "星期四",
        });
    });

    it("计算月份天数和倒序年份", () => {
        expect(monthDays("2022-06")).toBe(30);
        expect(monthDays(new Date("2024-02-01"))).toBe(29);
        expect(createYear(2020)).toEqual([2024, 2023, 2022, 2021, 2020]);
        expect(createYear(2025)).toEqual([]);
    });

    it("将秒数转换为参考实现的时分秒结构", () => {
        expect(getTime(60)).toEqual({ h: "00", m: "01", s: "00" });
        expect(getTime(4_233_600).h).toBe(1176);
        expect(getTime(299.099375)).toEqual({ h: "00", m: "04", s: 59 });
        expect(getTime(324.108, false)).toEqual({ h: 0, m: 5, s: 24 });
    });
});

describe("url utils", () => {
    it("返回当前浏览器 location", () => {
        expect(getLocation()).toBe(window.location);
    });

    it("保持参考实现的查询参数解析规则", () => {
        expect(getQueryMap("https://example.com?data=123&data2=456&token=test")).toEqual({
            data: "123",
            data2: "456",
            token: "test",
        });
        expect(getQueryMap("https://example.com?a=1&a=2&flag")).toEqual({ a: "2", flag: undefined });
        expect(getQueryMap("https://example.com?name=a%20b")).toEqual({ name: "a%20b" });
    });

    it("非法 URL 返回空对象", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

        expect(getQueryMap("not a url")).toEqual({});

        consoleError.mockRestore();
    });
});

describe("uuid utils", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("生成参考格式的 UUID 和 GUID", () => {
        expect(buildUUID()).toMatch(/^[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
        expect(buildGUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(uuid()).toMatch(/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89abAB][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$/);
    });

    it("按长度、基数和前缀生成 UUID", () => {
        vi.spyOn(Math, "random").mockReturnValue(0);

        expect(uuid(4, 10)).toBe("0000");
        expect(uuid(4, 10, "id-")).toBe("id-0000");
    });

    it("保持前缀 UUID 的拼接顺序", () => {
        vi.spyOn(Math, "random").mockReturnValue(0.1234);
        vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

        expect(buildPrefixUUID("test-")).toBe("test-12340000011700000000000");
    });
});
