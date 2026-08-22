// ========================
// Core —— 纯函数，零 React 依赖
// ========================
export {
    createDebouncedFn,
    createThrottledFn,
    createTimeout,
    createInterval,
    createAsyncLock,
    createCancelToken,
    createEventEmitter,
    createLatestRef,
} from "./core";

export type {
    DebouncedFn,
    DebounceOptions,
    ThrottledFn,
    ThrottleOptions,
    TimerHandle,
    AsyncLock,
    CancelToken,
    EventEmitter,
    LatestRef,
} from "./core";

// ========================
// React Hooks —— 薄封装 Core
// ========================
export {
    useLatest,
    usePersistFn,
    useDebounceFn,
    useThrottleFn,
    useTimeout,
    useInterval,
    useLockFn,
    useEventListener,
    useClickAway,
    copyTextToClipboard,
    useCopyToClipboard,
    useDark,
    useLoader,
    useResizeObserver,
    easeInOutQuad,
    useScrollTo,
    useDraggable,
    useWatermark,
} from "./hooks";

export type {
    UseDebounceFnOptions,
    UseThrottleFnOptions,
    UseIntervalOptions,
    UseEventListenerOptions,
    CopyTextOptions,
    UseCopyToClipboardResult,
    UseDarkOptions,
    UseDarkResult,
    LoadResourceOptions,
    LoadResult,
    UseLoaderResult,
    ResizeTarget,
    UseResizeObserverOptions,
    UseResizeObserverResult,
    EaseInOutQuadOptions,
    ScrollController,
    ScrollDirection,
    ScrollElement,
    ScrollOptions,
    DragTransform,
    DraggableController,
    DraggableOptions,
    DraggableTarget,
    WatermarkController,
    WatermarkGradientStop,
    WatermarkOptions,
} from "./hooks";

// ========================
// Integration 接口契约（占位，不含实现）
// ========================
export type {
    MessageAdapter,
    ModalAdapter,
    ModalConfirmOptions,
    ThemeAdapter,
    ThemeToken,
} from "./integrations";
