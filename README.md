# react-helper-toolkit

> React-only 常用 hooks 库 —— UI 无关，零外部 UI 框架依赖

高质量、零运行时依赖的 React Hooks 工具集。Core 层为纯函数，可在 Node/Worker 等任意 JS 环境运行；Hooks 层仅依赖 React，对 Core 进行薄封装。

## 定位与设计原则

零运行时依赖、TypeScript 强类型、Tree-shaking、统一导出和自动化验证；实现层按 React 生命周期原生设计。

- 公开导出名称和调用方式保持稳定、可预测，便于渐进接入
- 原生 React 状态与副作用模型，不引入额外的响应式抽象层
- UI 相关能力只保留适配器接口，不绑定 Ant Design、shadcn/ui 等组件库
- React 16.8+ 使用 `ref + effect cleanup` 保持最新回调和 StrictMode 安全

追求的是 React 语义下的原生实现与工程质量。

## 安装

```bash
pnpm add react-helper-toolkit
# 或
npm install react-helper-toolkit
```

**前置依赖**：`react >= 16.8`

## 快速开始

```tsx
import { useDebounceFn, useEventListener, useTimeout } from "react-helper-toolkit";

function SearchBox() {
  const debouncedSearch = useDebounceFn((keyword: string) => fetchResults(keyword), {
    wait: 300,
  });

  useTimeout(() => console.log("3 秒后执行"), 3000);

  useEventListener("resize", () => {
    console.log("窗口大小变化");
  });

  return <input onChange={(event) => debouncedSearch(event.target.value)} />;
}
```

## API 一览

### Core 层（纯函数，零 React 依赖）

| 函数                                    | 说明                                                       |
| --------------------------------------- | ---------------------------------------------------------- |
| `createDebouncedFn(fn, wait, options?)` | 防抖函数，返回 `{ run, cancel, flush }`                    |
| `createThrottledFn(fn, wait, options?)` | 节流函数，返回 `{ run, cancel }`                           |
| `createTimeout(fn, delay)`              | setTimeout 封装，返回 `{ clear }`                          |
| `createInterval(fn, delay)`             | setInterval 封装，返回 `{ clear }`                         |
| `createAsyncLock()`                     | 异步锁，`{ run, isLocked }`                                |
| `createCancelToken()`                   | AbortController wrapper，`{ signal, cancel, isCancelled }` |
| `createEventEmitter<T>()`               | 类型安全事件订阅器，`{ on, off, emit, once, clear }`       |
| `createLatestRef(value)`                | 引用容器，`{ current }`                                    |

### React Hooks 层

| Hook                                         | 说明                                  |
| -------------------------------------------- | ------------------------------------- |
| `useLatest(value)`                           | 始终返回最新值的 ref                  |
| `usePersistFn(fn)`                           | 引用稳定的函数包装                    |
| `useDebounceFn(fn, options?)`                 | 防抖 hook，卸载或配置变化时自动 cancel |
| `useThrottleFn(fn, options?)`                 | 节流 hook，卸载或配置变化时自动 cancel |
| `useTimeout(fn, delay)`                      | setTimeout hook，delay 可为 null 暂停 |
| `useInterval(fn, delay, { immediate? })`     | setInterval hook                      |
| `useLockFn(fn)`                              | 异步锁 hook，防重复提交               |
| `useEventListener(event, handler, options?)` | DOM 事件监听 hook                     |
| `useClickAway(handler, target?, events?)`    | 区域外点击 hook                       |
| `useCopyToClipboard(defaultValue?)`          | 复制文本并返回复制状态                |
| `useDark(options?)`                          | 监听并切换暗色 class                  |
| `useLoader(destroy?)`                        | 动态加载 CSS 和脚本                   |
| `useResizeObserver(target, callback, options?)` | 观察元素尺寸，支持 stop/restart    |
| `useScrollTo(options)`                       | 可启动和停止的元素滚动                |
| `useDraggable(target, handle, options?)`     | 可开启、关闭和重置的元素拖动          |
| `useWatermark(target?, resizeRedraw?)`       | 创建和清理 Canvas 水印                |

### Integration 接口（占位）

| 接口             | 说明                             |
| ---------------- | -------------------------------- |
| `MessageAdapter` | info / success / warning / error |
| `ModalAdapter`   | confirm / alert                  |
| `ThemeAdapter`   | getToken / setTheme              |

## StrictMode 注意事项

所有 hooks 均已针对 React 18 StrictMode 双挂载行为做了安全处理：

- `useEffect` cleanup 保证定时器、事件监听器正确清理
- `useDebounceFn` / `useThrottleFn` 卸载时自动 `cancel()`
- `useEventListener` / `useClickAway` 卸载时自动移除事件监听

## 防抖与节流配置

```ts
interface UseDebounceFnOptions {
  wait?: number;
  leading?: boolean;
  trailing?: boolean;
}

interface UseThrottleFnOptions {
  wait?: number;
  leading?: boolean;
  trailing?: boolean;
}
```

`wait`、`leading` 或 `trailing` 变化时，Hook 会取消旧实例中尚未执行的任务并使用新配置。两种 Hook 的回调都读取最新的 `fn`，因此业务回调变化不会单独重建计时器。

## 工具函数

框架无关的工具通过静态子路径导入，不进入 React 主入口：

```ts
import { convertPath } from "react-helper-toolkit/utils/convertPath";
import { getCurrentDate } from "react-helper-toolkit/utils/date";
import { nameCamelize } from "react-helper-toolkit/utils/nameTransform";
import { hideTextAtIndex } from "react-helper-toolkit/utils/substring";
import { removeAllSpace } from "react-helper-toolkit/utils/space";
import { getQueryMap } from "react-helper-toolkit/utils/url";
import { buildGUID } from "react-helper-toolkit/utils/uuid";
```

当前已复刻：

- `space`：四种空白清理函数。
- `nameTransform`：横线命名与驼峰命名互转。
- `convertPath`：保持参考实现规则的 Windows 路径转换。
- `date`：当前日期格式化、月份天数、年份列表和时分秒转换。
- `substring`：字符截取、数字拆分和索引隐藏。
- `url`：浏览器 Location 和参考规则的查询参数解析。
- `uuid`：UUID、GUID、前缀 UUID 和自定义长度随机字符串。
- `amount`、`math`、`color`、`coordtransform`：金额、数学、颜色和坐标工具。
- `array`、`clone`、`deep`、`equal`、`object`、`tree`、`formData`：数据结构工具。
- `is`、`debounce`：类型判断、校验、延迟、防抖和节流。

浏览器工具使用独立子路径：

```ts
import { downloadByData } from "react-helper-toolkit/browser/download";
import { storageLocal } from "react-helper-toolkit/browser/storage";
```

Node 工具与 ECharts 集成同样隔离：

```ts
import { getPackageSize } from "react-helper-toolkit/node/packageSize";
import { useECharts } from "react-helper-toolkit/echarts";
```

## Vue Hook 迁移边界

以下三个 Vue 能力不创建伪 React Hook：

- `useAttrs`：React 直接使用 props；需要过滤时使用对象解构或纯函数。
- `useDynamicComponent`：使用组件注册表或 `React.lazy`。
- `useGlobal`：使用 `createContext` 和 `useContext`。

`pure-admin-utils/src/utils/install.ts` 同样不复刻：它只服务 Vue 的 `app.use`、`app.component` 和 `globalProperties`，React 没有等价安装生命周期。

其余参考 Hook 已提供 React 生命周期实现；ECharts 通过显式 adapter 注入，避免主包绑定第三方实例。

## 迁移指引

如果你之前使用的 hooks 库有类似 API，下面是替换对照：

| 旧 Hook            | 本库替代                   | 改动说明                           |
| ------------------ | -------------------------- | ---------------------------------- |
| `useDebounceFn`    | `useDebounceFn`            | 签名兼容，自研实现                 |
| `useThrottleFn`    | `useThrottleFn`            | 签名兼容，自研实现                 |
| `useTimeout`       | `useTimeout`               | 签名一致                           |
| `useInterval`      | `useInterval`              | 签名一致                           |
| `useLockFn`        | `useLockFn`                | 签名一致                           |
| `useLatest`        | `useLatest`                | 签名一致                           |
| `usePersistFn`     | `usePersistFn`             | 签名一致                           |
| `useEventListener` | `useEventListener`         | 签名兼容，内置 target 解析         |
| `useClickAway`     | `useClickAway`             | 增强：支持传入 target 和自定义事件 |
| 主题相关 hook      | ❌ 不自带                  | 使用 `ThemeAdapter` 接口自行接入   |
| loading 相关 hook  | `useLockFn` + 自行管理状态 | 拆分关注点                         |

### 替换步骤

1. 安装本库，移除旧的 hooks 依赖
2. 全局替换 import 路径
3. 主题相关 hook 需按业务需求迁移至自定义 `ThemeAdapter` 实现
4. 运行测试确认功能正常

## 开发

```bash
pnpm install      # 安装依赖
pnpm test         # 运行单测
pnpm build        # 构建产物
pnpm dev          # 开发模式（watch）
pnpm typecheck    # 类型检查
pnpm check        # 类型检查 + 单测 + 构建
```

## 项目结构

```
src/
├── core/           # 纯函数层，零 React 依赖
│   ├── debounce.ts
│   ├── throttle.ts
│   ├── timer.ts
│   ├── async-lock.ts
│   ├── cancel-token.ts
│   ├── event-emitter.ts
│   ├── latest-ref.ts
│   ├── index.ts
│   └── __tests__/
├── hooks/          # React hooks 层，薄封装 core
│   ├── useLatest.ts
│   ├── usePersistFn.ts
│   ├── useDebounceFn.ts
│   ├── useThrottleFn.ts
│   ├── useTimeout.ts
│   ├── useInterval.ts
│   ├── useLockFn.ts
│   ├── useEventListener.ts
│   ├── useClickAway.ts
│   ├── index.ts
│   └── __tests__/
├── integrations/   # UI 适配接口占位
│   └── index.ts
└── index.ts        # 统一导出
```

## License

MIT
