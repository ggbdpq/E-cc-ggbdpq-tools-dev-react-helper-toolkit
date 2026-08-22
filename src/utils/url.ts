const URL_PATTERN = new RegExp(
    "^" +
        "(?:(https?|ftp|rtsp|mms|ws|wss):\\/\\/)?" +
        "(?:\\S+(?::\\S*)?@)?" +
        "(?:" +
        "(?:localhost)" +
        "|" +
        "(?:[1-9]\\d{0,2}(?:\\.\\d{1,3}){3})" +
        "|" +
        "(?:$[0-9a-fA-F:]+$)" +
        "|" +
        "(?:(?:[a-zA-Z0-9-_]+\\.)+[a-zA-Z]{2,63})" +
        ")" +
        "(?::\\d{1,5})?" +
        "(?:[/?#]\\S*)?" +
        "$",
    "i",
);

export type QueryMap = Record<string, string | undefined>;

function isReferenceUrl(value: string): boolean {
    return URL_PATTERN.test(value);
}

/**
 * 返回浏览器当前 Location；非浏览器环境返回 undefined。
 */
export function getLocation(): Location | undefined {
    if (typeof document === "undefined") return undefined;
    return window.location;
}

/**
 * 按参考实现规则提取 URL 查询参数。
 *
 * 参数不会解码，重复键以后值覆盖前值，无等号的参数值为 undefined。
 *
 * @param url URL 字符串
 * @returns 查询参数对象；非法 URL 返回空对象
 */
export function getQueryMap(url: string): QueryMap {
    if (!isReferenceUrl(url)) {
        console.error(`${url}不符合超链接规范`);
        return {};
    }

    const queryStart = url.indexOf("?");
    const parameters = url.slice(queryStart + 1).split("&");
    const result: QueryMap = {};

    for (const parameter of parameters) {
        const [key, value] = parameter.split("=");
        result[key] = value;
    }

    return result;
}
