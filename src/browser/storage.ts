export interface StorageProxy {
    setItem<T>(key: string, value: T): void;
    getItem<T>(key: string): T | null;
    removeItem(key: string): void;
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

export function storageLocal(): StorageProxy {
    return new BrowserStorageProxy(typeof window === "undefined" ? undefined : window.localStorage);
}

export function storageSession(): StorageProxy {
    return new BrowserStorageProxy(typeof window === "undefined" ? undefined : window.sessionStorage);
}
