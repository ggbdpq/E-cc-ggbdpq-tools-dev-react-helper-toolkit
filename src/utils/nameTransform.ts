const HYPHENATED_CHARACTER = /-(\w)/g;
const UPPERCASE_CHARACTER = /\B([A-Z])/g;

/** 将横线命名转换为驼峰命名 */
export function nameCamelize(name: string): string {
    return name.replace(HYPHENATED_CHARACTER, (_, character: string) => character.toUpperCase());
}

/** 将驼峰命名转换为小写横线命名 */
export function nameHyphenate(name: string): string {
    return name.replace(UPPERCASE_CHARACTER, "-$1").toLowerCase();
}
