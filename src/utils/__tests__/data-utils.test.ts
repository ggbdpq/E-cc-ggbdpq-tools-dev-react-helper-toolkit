import { describe, expect, it, vi } from "vitest";
import {
    arrayAllExist,
    arrayAllExistDeep,
    arrayAnyExist,
    arrayAnyExistDeep,
    extractFields,
    getKeyList,
    intersection,
    isIncludeAllChildren,
    randomDivide,
    swapOrder,
} from "../array";
import { clone, cloneDeep, hasOwnProp } from "../clone";
import { deepEqual, mapsEqual, setsEqual } from "../deep";
import { isEqual, isEqualArray, isEqualObject } from "../equal";
import { createFormData, formDataHander } from "../formData";
import { cleanObject, delObjectProperty, entries, isInvalidValue, shouldCleanKey, toSet } from "../object";
import {
    appendFieldByUniqueId,
    buildHierarchyTree,
    deleteChildren,
    extractPathList,
    getNodeByUniqueId,
    handleTree,
} from "../tree";

describe("array utils", () => {
    it("执行集合、顺序和字段操作", () => {
        expect(isIncludeAllChildren([1, "x"], [0, 1, "x"])).toBe(true);
        expect(intersection([1, 2, 3], [2, 3, 4], [3, 5])).toEqual([3]);
        const mutable = [1, 2, 3];
        expect(swapOrder(mutable, 0, 2)).toEqual([3, 2, 1]);
        expect(mutable).toEqual([3, 2, 1]);
        expect(getKeyList([{ id: 1 }, { id: 1 }, { id: 2 }], "id")).toEqual([1, 2]);
        expect(extractFields([{ id: 1, name: "A" }], "id")).toEqual([{ id: 1 }]);
    });

    it("检测浅层和深层包含关系", () => {
        expect(arrayAllExist([1, 2, 3], [2, 3])).toBe(true);
        expect(arrayAnyExist([1, 2], [3, 2])).toBe(true);
        expect(arrayAllExistDeep([{ id: 1 }, 2], [{ id: 1 }])).toBe(true);
        expect(arrayAnyExistDeep([{ id: 1 }], [{ id: 2 }, { id: 1 }])).toBe(true);
    });

    it("随机分配保持总数和上下限", () => {
        const result = randomDivide(900, 10, { minPerPart: 20, maxPerPart: 200, order: "asc" });
        expect(result).toHaveLength(10);
        expect(result.reduce((total, value) => total + value, 0)).toBe(900);
        expect(result.every((value) => value >= 20 && value <= 200)).toBe(true);
        expect([...result].sort((a, b) => a - b)).toEqual(result);
    });
});

describe("clone and equality utils", () => {
    it("执行浅拷贝和深拷贝", () => {
        const source = [1, { value: 1 }];
        const shallow = clone(source);
        const deep = cloneDeep(source);
        source[1].value = 2;
        expect(shallow).toEqual([1, { value: 2 }]);
        expect(deep).toEqual([1, { value: 1 }]);
        expect(hasOwnProp({ id: 1 }, "id")).toBe(true);
    });

    it("比较对象、数组、Map 和 Set", () => {
        expect(deepEqual({ id: 1 }, { id: 1 })).toBe(true);
        expect(mapsEqual(new Map([["a", 1]]), new Map([["a", 1]]), deepEqual)).toBe(true);
        expect(setsEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
        expect(isEqualObject({ id: 1 }, { id: 1 })).toBe(true);
        expect(isEqualArray([1, { id: 1 }], [1, { id: 1 }])).toBe(true);
        expect(isEqual([1], [2])).toBe(false);
    });
});

describe("object and FormData utils", () => {
    it("删除、筛选并深度清理对象", () => {
        expect(entries({ id: 1, name: "A" })).toEqual([
            ["id", 1],
            ["name", "A"],
        ]);
        expect(delObjectProperty({ id: 1, name: "A" }, "name")).toEqual({ id: 1 });
        expect(toSet({ a: true, b: false, c: 1 })).toEqual(new Set(["a", "c"]));
        expect(shouldCleanKey("id", 1, { includeKeys: ["id"] })).toBe(true);
        expect(isInvalidValue("", {})).toBe(true);
        expect(cleanObject({ id: 1, empty: "", nested: { value: 2, missing: null } })).toEqual({
            id: 1,
            nested: { value: 2 },
        });
    });

    it("创建平铺和嵌套 FormData", () => {
        const flat = formDataHander({ a: 1, b: "2" });
        expect(flat.get("a")).toBe("1");
        const nested = createFormData({ user: { name: "A" }, tags: ["x", "y"] });
        expect(nested.get("user[name]")).toBe("A");
        expect(nested.get("tags[1]")).toBe("y");
    });
});

describe("tree utils", () => {
    it("构建层级并按唯一 ID 查找和追加字段", () => {
        const flat = [
            { id: 1, parentId: 0, name: "root" },
            { id: 2, parentId: 1, name: "child" },
        ];
        const tree = handleTree(flat);
        expect(tree[0].children?.[0].id).toBe(2);
        const hierarchy = buildHierarchyTree([{ name: "root", children: [{ name: "child" }] }]);
        expect(hierarchy[0].children?.[0].pathList).toEqual([0, 0]);
        const withIds = deleteChildren([{ children: [{ name: "only" }] }]);
        expect(withIds[0].children).toBeUndefined();
        const nodes = [{ uniqueId: 1, children: [{ uniqueId: 2 }] }];
        appendFieldByUniqueId(nodes, 2, { active: true });
        expect(getNodeByUniqueId(nodes, 2)).toMatchObject({ active: true });
        expect(extractPathList([{ uniqueId: 1 }, { uniqueId: 2 }])).toEqual([1, 2]);
    });

    it("无效树输入返回空数组并记录警告", () => {
        const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        expect(handleTree(null as never)).toEqual([]);
        warning.mockRestore();
    });
});
