/** 自定义 Blob 写入逻辑收到的上下文 */
export interface FormDataFileContext {
    /** 当前待写入的 Blob 或 File */
    file: Blob;
    /** 包含父级路径的 FormData 字段名 */
    key: string;
    /** 正在构建的 FormData，可由回调直接追加字段 */
    formData: FormData;
}

/** `createFormData` 的编码配置 */
export interface FormDataOptions {
    /** 未提供 `handleFile` 时使用的文件字段名，默认 `file` */
    fileKey?: string;
    /** 使用严格相等跳过的值集合 */
    filter?: readonly unknown[];
    /** 自定义 Blob 写入方式；提供后默认文件写入逻辑不再执行 */
    handleFile?: (context: FormDataFileContext) => void;
}

/** 将对象第一层字段按字符串形式写入 FormData，不递归处理嵌套值 */
export function formDataHander(object: Record<string, unknown>): FormData {
    const result = new FormData();
    for (const [key, value] of Object.entries(object)) result.append(key, String(value));
    return result;
}

/**
 * 将嵌套对象、数组和 Blob 编码为 FormData。
 *
 * 嵌套键使用 `parent[index]` / `parent[key]` 形式；普通值通过 `String` 转换。
 */
export function createFormData(object: Record<string, unknown>, options: FormDataOptions = {}): FormData {
    const result = new FormData();
    const fileKey = options.fileKey ?? "file";
    const filteredValues = options.filter ?? [];

    function append(key: string, value: unknown, parentKey?: string): void {
        const fullKey = parentKey ? `${parentKey}[${key}]` : key;
        if (filteredValues.includes(value)) return;
        if (value instanceof Blob) {
            if (options.handleFile) options.handleFile({ file: value, key: fullKey, formData: result });
            else result.append(fileKey, value, value instanceof File ? value.name : "blob");
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item, index) => append(String(index), item, fullKey));
            return;
        }
        if (value && typeof value === "object" && value.constructor === Object) {
            for (const [childKey, childValue] of Object.entries(value)) append(childKey, childValue, fullKey);
            return;
        }
        result.append(fullKey, String(value));
    }

    for (const [key, value] of Object.entries(object)) append(key, value);
    return result;
}
