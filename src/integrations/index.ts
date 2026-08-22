/**
 * UI 相关能力的最小适配契约。
 *
 * 本模块只定义 TypeScript 接口，具体 UI 框架实现由调用方注入。
 */

/** 与具体 UI 框架解耦的消息提示契约 */
export interface MessageAdapter {
    /** 展示普通提示 */
    info(content: string): void;
    /** 展示成功提示 */
    success(content: string): void;
    /** 展示警告提示 */
    warning(content: string): void;
    /** 展示错误提示 */
    error(content: string): void;
}

/** 确认框和提示框共享的配置 */
export interface ModalConfirmOptions {
    /** 弹窗标题 */
    title: string;
    /** 可选正文 */
    content?: string;
    /** 确认后的同步或异步回调 */
    onOk?: () => void | Promise<void>;
    /** 取消回调 */
    onCancel?: () => void;
}

/** 与具体 UI 框架解耦的弹窗契约 */
export interface ModalAdapter {
    /** 打开确认框 */
    confirm(options: ModalConfirmOptions): void;
    /** 打开无需取消回调的提示框 */
    alert(options: Omit<ModalConfirmOptions, "onCancel">): void;
}

/** 跨 UI 框架使用的最小主题令牌集合 */
export interface ThemeToken {
    /** 品牌或主要操作使用的颜色 */
    colorPrimary: string;
    /** 页面和容器的基础背景色 */
    colorBgBase: string;
    /** 正文的基础文字颜色 */
    colorTextBase: string;
    /** 组件默认圆角，单位由适配器与消费方共同约定 */
    borderRadius: number;
    /** 默认字体族，格式与 CSS `font-family` 一致 */
    fontFamily: string;
    /** 允许具体 UI 框架透传额外的字符串或数字令牌 */
    [key: string]: string | number;
}

/** 读取主题令牌和切换主题的适配契约 */
export interface ThemeAdapter {
    /** 获取当前主题 token */
    getToken(): ThemeToken;
    /** 切换主题 */
    setTheme(theme: "light" | "dark" | string): void;
}
