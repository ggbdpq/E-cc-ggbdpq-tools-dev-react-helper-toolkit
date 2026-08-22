import { resolve } from "node:path";
import { convertPath } from "../utils/convertPath";

export function getAbsolutePath(path: string): string {
    return convertPath(resolve(process.cwd(), path));
}
