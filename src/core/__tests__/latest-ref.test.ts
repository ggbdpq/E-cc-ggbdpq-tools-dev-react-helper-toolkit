import { describe, it, expect } from "vitest";
import { createLatestRef } from "../latest-ref";

describe("createLatestRef", () => {
    it("应返回包含初始值的容器", () => {
        const ref = createLatestRef(42);
        expect(ref.current).toBe(42);
    });

    it("更新 current 应反映最新值", () => {
        const ref = createLatestRef("hello");
        ref.current = "world";
        expect(ref.current).toBe("world");
    });

    it("闭包中应能读取最新值", () => {
        const ref = createLatestRef(0);
        const getCurrent = () => ref.current;

        ref.current = 1;
        expect(getCurrent()).toBe(1);

        ref.current = 2;
        expect(getCurrent()).toBe(2);
    });
});
