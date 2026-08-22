/**
 * Integration 占位层 —— UI 相关适配接口契约
 *
 * 仅定义 TypeScript 接口，不做具体实现。
 * 未来可接 shadcn/ui、Ant Design 或任意 UI 库。
 */

// ========================
// Message 适配器
// ========================

/** 与具体 UI 框架解耦的消息提示契约。 */
export interface MessageAdapter {
    /** 展示普通提示。 */
    info(content: string): void;
    /** 展示成功提示。 */
    success(content: string): void;
    /** 展示警告提示。 */
    warning(content: string): void;
    /** 展示错误提示。 */
    error(content: string): void;
}

// ========================
// Modal 适配器
// ========================

/** 确认框和提示框共享的配置。 */
export interface ModalConfirmOptions {
    /** 弹窗标题。 */
    title: string;
    /** 可选正文。 */
    content?: string;
    /** 确认后的同步或异步回调。 */
    onOk?: () => void | Promise<void>;
    /** 取消回调。 */
    onCancel?: () => void;
}

/** 与具体 UI 框架解耦的弹窗契约。 */
export interface ModalAdapter {
    /** 打开确认框。 */
    confirm(options: ModalConfirmOptions): void;
    /** 打开无需取消回调的提示框。 */
    alert(options: Omit<ModalConfirmOptions, "onCancel">): void;
}

// ========================
// Theme 适配器
// ========================

/** 跨 UI 框架使用的最小主题令牌集合。 */
export interface ThemeToken {
    colorPrimary: string;
    colorBgBase: string;
    colorTextBase: string;
    borderRadius: number;
    fontFamily: string;
    [key: string]: string | number;
}

/** 读取主题令牌和切换主题的适配契约。 */
export interface ThemeAdapter {
    /** 获取当前主题 token */
    getToken(): ThemeToken;
    /** 切换主题 */
    setTheme(theme: "light" | "dark" | string): void;
}
