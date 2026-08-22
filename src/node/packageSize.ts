import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { formatBytes } from "../utils/math";

/** `getPackageSize` 的目录和输出配置 */
export interface PackageSizeOptions {
    /** 需要递归统计的目录，默认 `dist` */
    folder?: string;
    /** 是否转换为带单位的字符串，默认 `true` */
    format?: boolean;
    /** 统计完成后的同步回调，参数类型与返回值一致 */
    callback?: (size: number | string) => void;
}

async function directorySize(folder: string): Promise<number> {
    const entries = await readdir(folder, { withFileTypes: true });
    const sizes = await Promise.all(
        entries.map(async (entry) => {
            const path = join(folder, entry.name);
            if (entry.isDirectory()) return directorySize(path);
            return (await stat(path)).size;
        }),
    );
    return sizes.reduce((total, size) => total + size, 0);
}

/** 递归统计目录文件总大小，并可返回格式化后的单位字符串 */
export async function getPackageSize(options: PackageSizeOptions = {}): Promise<number | string> {
    const size = await directorySize(options.folder ?? "dist");
    const result = options.format ?? true ? formatBytes(size) : size;
    options.callback?.(result);
    return result;
}
