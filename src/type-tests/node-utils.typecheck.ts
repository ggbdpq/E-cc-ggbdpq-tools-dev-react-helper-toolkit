import { getPackageSize, type PackageSizeOptions } from "../node/packageSize";
import { getAbsolutePath } from "../node/path";

const options = { folder: "dist", format: false } satisfies PackageSizeOptions;
const size: Promise<number | string> = getPackageSize(options);
const path: string = getAbsolutePath("src");
void size;
void path;

// @ts-expect-error folder 必须是字符串。
getPackageSize({ folder: 1 });
