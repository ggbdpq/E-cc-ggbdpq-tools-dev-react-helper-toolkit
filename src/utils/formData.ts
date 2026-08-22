export interface FormDataFileContext {
    file: Blob;
    key: string;
    formData: FormData;
}

export interface FormDataOptions {
    fileKey?: string;
    filter?: readonly unknown[];
    handleFile?: (context: FormDataFileContext) => void;
}

export function formDataHander(object: Record<string, unknown>): FormData {
    const result = new FormData();
    for (const [key, value] of Object.entries(object)) result.append(key, String(value));
    return result;
}

/** 将嵌套对象、数组和 Blob 编码为 FormData。 */
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
