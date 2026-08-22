/** 基于 user agent 解析出的浏览器名称和主版本号 */
export interface BrowserInfo {
    /** 小写浏览器名称；无法识别或非浏览器环境时为空字符串 */
    browser: string;
    /** 主版本号；无法识别或非浏览器环境时为空字符串 */
    version: string;
}

/** 使用 user agent 关键字粗略判断是否为移动设备；非浏览器环境返回 `false` */
export function deviceDetection(): boolean {
    if (typeof document === "undefined") return false;
    const agent = navigator.userAgent.toLowerCase();
    return ["midp", "ucweb", "android", "iphone os", "windows ce", "rv:1.2.3.4", "windows mobile"].some(
        (name) => agent.includes(name),
    );
}

/** 使用兼容旧浏览器的 user agent 规则解析浏览器名称和主版本号；非浏览器环境返回空值结构 */
export function getBrowserInfo(): BrowserInfo {
    if (typeof document === "undefined") return { browser: "", version: "" };
    const userAgent = navigator.userAgent;
    let temporary: RegExpMatchArray | null;
    let match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) ?? [];
    if (/trident/i.test(match[1])) {
        temporary = /\brv[ :]+(\d+)/g.exec(userAgent);
        return { browser: "ie", version: temporary?.[1] ?? "" };
    }
    if (match[1] === "Chrome") {
        temporary = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
        if (temporary) return { browser: temporary[1].replace("OPR", "Opera").toLowerCase(), version: temporary[2] };
    }
    match = match[2] ? [match[1], match[2]] : [navigator.appName, navigator.appVersion, "-?"];
    temporary = userAgent.match(/version\/(\d+)/i);
    if (temporary) match.splice(1, 1, temporary[1]);
    return { browser: (match[0] ?? "").toLowerCase(), version: match[1] ?? "" };
}
