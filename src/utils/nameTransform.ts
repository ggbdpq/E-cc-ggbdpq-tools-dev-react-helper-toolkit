const HYPHENATED_CHARACTER = /-(\w)/g;
const UPPERCASE_CHARACTER = /\B([A-Z])/g;

/**
 * 将横线命名转换为驼峰命名。
 *
 * @param name 横线命名字符串
 * @returns 转换后的驼峰命名字符串
 */
export function nameCamelize(name: string): string {
    return name.replace(HYPHENATED_CHARACTER, (_, character: string) => character.toUpperCase());
}

/**
 * 将驼峰命名转换为小写横线命名。
 *
 * @param name 驼峰命名字符串
 * @returns 转换后的小写横线命名字符串
 */
export function nameHyphenate(name: string): string {
    return name.replace(UPPERCASE_CHARACTER, "-$1").toLowerCase();
}
