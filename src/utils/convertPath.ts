const WINDOWS_EXTENDED_PATH = /^\\\\\?\\/;
const NON_ASCII_CHARACTER = /[^\u0000-\u0080]+/;
const WINDOWS_SEPARATOR = /\\/g;

/**
 * 将普通 ASCII Windows 路径的反斜杠转换为正斜杠。
 *
 * 为保持参考实现兼容，Windows 扩展路径和包含非 ASCII 字符的路径原样返回。
 *
 * @param path 路径字符串
 * @returns 转换后的路径字符串
 */
export function convertPath(path: string): string {
    if (WINDOWS_EXTENDED_PATH.test(path) || NON_ASCII_CHARACTER.test(path)) {
        return path;
    }

    return path.replace(WINDOWS_SEPARATOR, "/");
}
