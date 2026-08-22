/**
 * 使用 JSON 序列化读写 Web Storage 的最小接口。
 *
 * 没有可用 Storage 时，写操作不执行，读取返回 `null`。
 */
export interface StorageProxy {
    /** 将值 JSON 序列化后写入 */
    setItem<T>(key: string, value: T): void;
    /**
     * 读取并 JSON 解析值；键不存在或非浏览器环境返回 `null`。
     *
     * @throws {SyntaxError} 存储内容不是合法 JSON 时抛出
     */
    getItem<T>(key: string): T | null;
    /** 删除指定键 */
    removeItem(key: string): void;
    /** 清空当前 Storage 的全部键 */
    clear(): void;
}

class BrowserStorageProxy implements StorageProxy {
    constructor(private readonly storage?: Storage) {}

    setItem<T>(key: string, value: T): void {
        if (!this.storage) return;
        this.storage.setItem(key, JSON.stringify(value));
    }

    getItem<T>(key: string): T | null {
        if (!this.storage) return null;
        const value = this.storage.getItem(key);
        return value === null ? null : (JSON.parse(value) as T);
    }

    removeItem(key: string): void {
        this.storage?.removeItem(key);
    }

    clear(): void {
        this.storage?.clear();
    }
}

/** 创建访问 `window.localStorage` 的 JSON 代理 */
export function storageLocal(): StorageProxy {
    return new BrowserStorageProxy(typeof window === "undefined" ? undefined : window.localStorage);
}

/** 创建访问 `window.sessionStorage` 的 JSON 代理 */
export function storageSession(): StorageProxy {
    return new BrowserStorageProxy(typeof window === "undefined" ? undefined : window.sessionStorage);
}
