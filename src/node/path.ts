import { resolve } from "node:path";
import { convertPath } from "../utils/convertPath";

/** 相对当前工作目录解析绝对路径，并按 `convertPath` 规则统一分隔符 */
export function getAbsolutePath(path: string): string {
    return convertPath(resolve(process.cwd(), path));
}
