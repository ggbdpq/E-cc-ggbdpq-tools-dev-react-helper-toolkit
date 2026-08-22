/**
 * `react-hooks-me` 主入口，只导出 Core、React Hooks 和 UI 适配契约。
 *
 * 浏览器、Node 和通用工具保留在独立子路径，避免主入口引入不需要的运行时能力。
 */
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

export type {
    MessageAdapter,
    ModalAdapter,
    ModalConfirmOptions,
    ThemeAdapter,
    ThemeToken,
} from "./integrations";
