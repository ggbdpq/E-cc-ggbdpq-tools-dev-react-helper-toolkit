// @vitest-environment node
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getPackageSize } from "../packageSize";
import { getAbsolutePath } from "../path";

describe("node utils", () => {
    it("转换绝对路径", () => {
        expect(getAbsolutePath("src/index.ts")).toMatch(/\/src\/index\.ts$/);
    });

    it("递归统计目录文件大小", async () => {
        const root = await mkdtemp(join(tmpdir(), "react-hooks-me-"));
        await mkdir(join(root, "nested"));
        await writeFile(join(root, "a.txt"), "1234");
        await writeFile(join(root, "nested", "b.txt"), "12");
        await expect(getPackageSize({ folder: root, format: false })).resolves.toBe(6);
    });
});
