import { describe, expect, it } from "vitest";
import { convertPath } from "../convertPath";
import { nameCamelize, nameHyphenate } from "../nameTransform";
import {
    hideTextAtIndex,
    splitNum,
    subAfter,
    subBefore,
    subBetween,
    subBothSides,
    subTextAddEllipsis,
} from "../substring";
import {
    removeAllSpace,
    removeBothSidesSpace,
    removeLeftSpace,
    removeRightSpace,
} from "../space";

describe("space utils", () => {
    const text = "  - 11 22  ";

    it("保持参考实现的四种空白清理语义", () => {
        expect(removeLeftSpace(text)).toBe("- 11 22  ");
        expect(removeRightSpace(text)).toBe("  - 11 22");
        expect(removeBothSidesSpace(text)).toBe("- 11 22");
        expect(removeAllSpace(text)).toBe("-1122");
    });

    it("清理制表符和换行等空白字符", () => {
        expect(removeLeftSpace("\t\nvalue ")).toBe("value ");
        expect(removeRightSpace(" value\t\n")).toBe(" value");
        expect(removeAllSpace(" a\tb\nc ")).toBe("abc");
    });
});

describe("name transform utils", () => {
    it("在横线命名和驼峰命名之间转换", () => {
        expect(nameCamelize("ab-cd-ef")).toBe("abCdEf");
        expect(nameHyphenate("abCdEf")).toBe("ab-cd-ef");
    });

    it("保持连续横线和连续大写字母的参考行为", () => {
        expect(nameCamelize("-a--b")).toBe("A-B");
        expect(nameHyphenate("XMLHttp")).toBe("x-m-l-http");
    });
});

describe("convertPath", () => {
    it("仅转换普通 ASCII Windows 路径", () => {
        expect(convertPath("C:\\work\\src\\index.ts")).toBe("C:/work/src/index.ts");
        expect(convertPath("\\\\server\\share\\file.ts")).toBe("//server/share/file.ts");
    });

    it("保持扩展路径和含非 ASCII 字符路径不变", () => {
        expect(convertPath("\\\\?\\C:\\work\\file.ts")).toBe("\\\\?\\C:\\work\\file.ts");
        expect(convertPath("C:\\项目\\文件.ts")).toBe("C:\\项目\\文件.ts");
    });
});

describe("substring utils", () => {
    const url = "https://cn.vitest.dev/api/#expect";

    it("截取指定字符前后和区间内容", () => {
        expect(subBefore(url, "api")).toBe("https://cn.vitest.dev/");
        expect(subAfter(url, "api")).toBe("/#expect");
        expect(subBothSides(url, "api")).toEqual(["https://cn.vitest.dev/", "/#expect"]);
        expect(subBetween(url, "api", "ec")).toBe("/#exp");
    });

    it("保持字符不存在时的 substring 计算规则", () => {
        expect(subBefore("abc", "xy")).toBe("");
        expect(subAfter("abc", "xy")).toBe("bc");
        expect(subBetween("abc", "a", "x")).toBe("");
    });

    it("截断文本并拆分数字", () => {
        expect(subTextAddEllipsis("abcdef", 3)).toBe("abc...");
        expect(subTextAddEllipsis(123, 3)).toBe("123");
        expect(subTextAddEllipsis("abc", 0)).toBe("...");
        expect(subTextAddEllipsis("abc", Number.NaN)).toBe("abc");
        expect(splitNum(120)).toEqual([1, 2, 0]);
        expect(splitNum(0)).toBe("");
    });

    it("按单个索引和闭区间隐藏文本", () => {
        expect(hideTextAtIndex("hello world", 1)).toBe("h*llo world");
        expect(hideTextAtIndex("hello world", [1, 2, 8])).toBe("h**lo wo*ld");
        expect(hideTextAtIndex("hello world", { start: 1, end: 3 })).toBe("h***o world");
        expect(
            hideTextAtIndex("hello world", [
                { start: 1, end: 3 },
                { start: 7, end: 9 },
            ]),
        ).toBe("h***o w***d");
        expect(hideTextAtIndex("hello world", { start: 1, end: 9 }, "-")).toBe("h---------d");
    });
});
