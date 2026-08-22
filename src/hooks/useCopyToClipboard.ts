import { useState } from "react";
import { usePersistFn } from "./usePersistFn";

export interface CopyTextOptions {
    target?: HTMLElement;
}

export function copyTextToClipboard(input: string, options: CopyTextOptions = {}): boolean {
    if (typeof document === "undefined") return false;
    const target = options.target ?? document.body;
    const textarea = document.createElement("textarea");
    const focused = document.activeElement;
    textarea.value = input;
    textarea.readOnly = true;
    textarea.style.contain = "strict";
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    textarea.style.fontSize = "12pt";
    const selection = document.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : undefined;
    target.append(textarea);
    textarea.select();
    textarea.selectionStart = 0;
    textarea.selectionEnd = input.length;
    let copied = false;
    try {
        copied = document.execCommand("copy");
    } finally {
        textarea.remove();
        if (range && selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
        if (focused instanceof HTMLElement) focused.focus();
    }
    return copied;
}

export interface UseCopyToClipboardResult {
    clipboardValue: string;
    copied: boolean;
    update(value: string): void;
}

/** 复制文本并以 React 状态暴露当前值和复制结果。 */
export function useCopyToClipboard(defaultValue = ""): UseCopyToClipboardResult {
    const [clipboardValue, setClipboardValue] = useState(defaultValue);
    const [copied, setCopied] = useState(false);
    const update = usePersistFn((value: string) => {
        setClipboardValue(value);
        const text = value.trim().length === 0 ? defaultValue : value;
        setCopied(text.length > 0 ? copyTextToClipboard(text) : false);
    });
    return { clipboardValue, copied, update };
}
