export interface BrowserInfo {
    browser: string;
    version: string;
}

export function deviceDetection(): boolean {
    if (typeof document === "undefined") return false;
    const agent = navigator.userAgent.toLowerCase();
    return ["midp", "ucweb", "android", "iphone os", "windows ce", "rv:1.2.3.4", "windows mobile"].some(
        (name) => agent.includes(name),
    );
}

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
