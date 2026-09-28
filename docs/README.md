# react-helper-toolkit 从入门到精通

> 11 篇系列文章，以本库的真实源码为教材，从「会用一个 hook」走到「能设计并移植一个 hooks 库」。

## 这套文章写给谁

你会写 React 组件，知道 `useState` 和 `useEffect` 的基本用法，但遇到这些问题时会卡住：

- `setTimeout` 回调里读到的 state 永远是旧值；
- 组件卸载后定时器还在跑，事件监听器越积越多；
- React 18 StrictMode 下组件挂载两次，副作用执行了两遍；
- 想封装一个自己的 hook，却不知道怎么保证它 StrictMode 安全、引用稳定。

系列按「会用 → 懂原理 → 能造轮子」三个阶段递进，每一篇都以 `src/` 下的真实实现为例，所有代码示例都与源码对账，可以直接运行验证。

## 学习路径

| 阶段 | 篇目 | 你将掌握 |
|---|---|---|
| 入门：会用 | [01 认识 react-helper-toolkit](./01-getting-started.md) | 库的定位、三层结构、安装与第一段代码 |
| 入门：会用 | [02 定时器、防抖与节流](./02-timers-debounce-throttle.md) | useTimeout / useInterval / useDebounceFn / useThrottleFn |
| 入门：会用 | [03 DOM 事件与浏览器能力](./03-dom-and-browser.md) | useEventListener / useClickAway / useDark / useCopyToClipboard / useLoader |
| 进阶：懂原理 | [04 Core 层：先纯函数，后 Hook](./04-core-pure-functions.md) | 8 个 create\* 工厂、框架无关设计、两套防抖的取舍 |
| 进阶：懂原理 | [05 引用稳定性与闭包陷阱](./05-reference-stability.md) | useLatest / usePersistFn，为什么回调永远读到最新值 |
| 进阶：懂原理 | [06 StrictMode 与副作用清理](./06-strictmode-and-cleanup.md) | 双挂载机制、cleanup 纪律、泄漏排查 |
| 进阶：懂原理 | [07 异步控制：锁、取消与事件](./07-async-control.md) | useLockFn / createAsyncLock / createCancelToken / createEventEmitter |
| 进阶：懂原理 | [08 高级交互 Hooks 内幕](./08-advanced-interactions.md) | useResizeObserver / useScrollTo / useDraggable / useWatermark / useECharts |
| 精通：能造轮子 | [09 类型工程与质量闸门](./09-types-and-quality-gates.md) | 类型级测试、泛型设计、`pnpm check` 验证体系 |
| 精通：能造轮子 | [10 子路径导出与构建](./10-exports-and-build.md) | exports 映射、tree-shaking、tsup 双格式产物 |
| 精通：能造轮子 | [11 移植方法论与适配器设计](./11-porting-and-adapters.md) | Vue→React 移植纪律、迁移边界、adapter 依赖倒置 |

路径说明：入门三篇只讲怎么用，跳过原理；进阶五篇是全书核心，拆解本库「hooks 为什么这样写」的每个决定；精通三篇面向库作者，讲质量护栏和工程方法论。只想查用法的读者读完 01–03 即可；想给自己的项目写安全 hooks 的读者，04–06 必读。

## 环境准备

系列所有示例基于本仓库源码。克隆后执行：

```bash
pnpm install   # 安装依赖（含 react 18、vitest、tsup 等开发依赖）
pnpm test      # 运行全部单测，预期全绿
pnpm check     # tsc --noEmit + vitest run + tsup，库的完整质量闸门
```

在自己的项目里使用时：

```bash
pnpm add react-helper-toolkit
```

前置依赖只有一个：`react >= 16.8`。

## 阅读约定

- 文中引用的源码路径均相对 `src/`，例如 `hooks/useDebounceFn.ts`；
- 每篇末尾有「自查清单」，用于确认你已经掌握该篇的核心判断点；
- 代码示例中的 API 签名与库的实际导出一致，参数默认值以源码 JSDoc 契约为准。

## 库的能力全景（速查）

| 层 | 内容 | 数量 | 导入方式 |
|---|---|---|---|
| Core 纯函数 | createDebouncedFn / createThrottledFn / createTimeout / createInterval / createAsyncLock / createCancelToken / createEventEmitter / createLatestRef | 8 | 主入口 |
| React Hooks | 16 个 use\* hooks + copyTextToClipboard、easeInOutQuad 两个工具函数 | 16+2 | 主入口 |
| UI 适配契约 | MessageAdapter / ModalAdapter / ThemeAdapter（纯接口） | 3 | 主入口（仅类型） |
| 通用工具 | date / url / uuid / tree / array / amount / color / coordtransform 等 | 20 个文件 | `react-helper-toolkit/utils/*` 子路径 |
| 浏览器工具 | download / storage / device / svg 等 | 9 个文件 | `react-helper-toolkit/browser/*` 子路径 |
| Node 工具 | packageSize / path | 2 个文件 | `react-helper-toolkit/node/*` 子路径 |
| 图表集成 | useECharts（adapter 注入，不绑定 echarts 实例） | 1 | `react-helper-toolkit/echarts` 子路径 |
