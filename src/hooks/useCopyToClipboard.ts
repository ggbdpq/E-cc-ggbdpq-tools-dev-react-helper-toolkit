import { useState } from "react";
import { usePersistFn } from "./usePersistFn";

/** 传统 DOM 复制流程的挂载配置 */
export interface CopyTextOptions {
    /** 临时文本域的挂载节点，默认使用 `document.body` */
    target?: HTMLElement;
}

/**
 * 通过临时文本域和 `document.execCommand("copy")` 复制文本。
 *
 * 调用结束后会恢复原有选区和焦点；非浏览器环境或浏览器拒绝复制时返回 `false`。
 */
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

/** `useCopyToClipboard` 暴露的复制状态和更新方法 */
export interface UseCopyToClipboardResult {
    /** 最近一次传入 `update` 的原始值 */
    clipboardValue: string;
    /** 最近一次复制操作是否成功 */
    copied: boolean;
    /** 更新当前值并立即尝试复制；空白值会回退到 Hook 的默认值 */
    update(value: string): void;
}

/**
 * 复制文本并以 React 状态暴露当前值和复制结果。
 *
 * `update` 收到空白文本时会改为复制 `defaultValue`，但 `clipboardValue` 仍保留原始输入。
 */
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
