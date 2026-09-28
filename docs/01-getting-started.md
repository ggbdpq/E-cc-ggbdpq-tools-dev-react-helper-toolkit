# 01 · 认识 react-helper-toolkit

> 本篇结论：这是一个 React Hooks 工具库，它的特别之处在于「两层结构」——底层是一批零依赖的纯函数（Core 层），上层是对它们做生命周期封装的 hooks。读完本篇，你会安装它、写出第一段代码，并理解它和市面其他 hooks 库的边界在哪里。

## 一句话定义

react-helper-toolkit 是一个**UI 无关、零运行时依赖**的 React Hooks 工具集：它把防抖、节流、事件监听、拖拽、水印这类常见能力做成了 16 个 hooks，外加 20 多个框架无关的工具函数。

「UI 无关」的意思是：它不绑定 Ant Design、shadcn/ui 之类的组件库。需要弹窗、消息提示、主题这些 UI 能力时，它只给你**接口**（`MessageAdapter`、`ModalAdapter`、`ThemeAdapter`），具体实现由你注入。「零运行时依赖」的意思是：`package.json` 里唯一的依赖声明是 `peerDependencies.react >= 16.8`，装它不会拖进任何第三方包。

## 一个类比：发动机与整车

理解这个库只需要一个类比：

- **Core 层是发动机**。`src/core/` 下有 8 个纯函数工厂，比如 `createDebouncedFn` 创建一个防抖函数。它们不认识 React，你在 Node 脚本、Web Worker 里都能用。
- **Hooks 层是整车**。`src/hooks/` 下 16 个 hooks 把发动机装进 React 的生命周期底盘——组件卸载时自动熄火（清理定时器、移除监听器），StrictMode 双挂载时也不会冒黑烟。

你日常开车只用整车（hooks），但知道发动机单独能转（core 可独立使用），很多事就多了一种解法。这个分层是整个库的脊柱，04 篇会专门拆。

## 快速开始

```bash
pnpm add react-helper-toolkit
```

前置依赖 `react >= 16.8`。写一个带防抖的搜索框：

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

三个细节值得注意，它们代表了库的设计取向：

1. `useDebounceFn` 返回的函数可以直接调用，还挂着 `.cancel()` 和 `.flush()` 两个控制方法；
2. `useTimeout` 的第二个参数传 `null` 可以暂停定时器，组件卸载时自动清理；
3. `useEventListener` 不传目标就监听 `window`，回调函数更新时不会重新订阅。

这三条背后的实现分别涉及 Core 工厂、effect cleanup、最新引用三个机制，是 02、05、06 篇的主角。现在先建立直觉：**这些 hook 的「省心」不是碰巧，是三层结构设计出来的**。

## 三层结构全景

`src/` 目录按「依赖只允许向下」的原则分了层：

```
src/
├── core/          # 8 个纯函数工厂，零 React 依赖
│   ├── debounce.ts      # createDebouncedFn
│   ├── throttle.ts      # createThrottledFn
│   ├── timer.ts         # createTimeout / createInterval
│   ├── async-lock.ts    # createAsyncLock
│   ├── cancel-token.ts  # createCancelToken
│   ├── event-emitter.ts # createEventEmitter
│   └── latest-ref.ts    # createLatestRef
├── hooks/         # 16 个 React hooks，薄封装 core
├── integrations/  # 3 个 UI 适配契约（纯 TypeScript 接口）
├── echarts/       # useECharts，通过 adapter 注入 echarts 实例
├── utils/         # 20 个通用工具文件（框架无关）
├── browser/       # 9 个浏览器工具（下载、存储、设备检测等）
├── node/          # 2 个 Node 工具（包体积统计、路径处理）
└── index.ts       # 主入口：只导出 core + hooks + 适配契约
```

打开 `src/index.ts`（主入口）看导出清单，会发现一个刻意的安排：**utils、browser、node 全都不在主入口里**。它们通过子路径导入：

```ts
// 主入口：React 能力
import { useDebounceFn, createAsyncLock } from "react-helper-toolkit";

// 子路径：框架无关的工具，一个文件一个入口
import { getQueryMap } from "react-helper-toolkit/utils/url";
import { downloadByData } from "react-helper-toolkit/browser/download";
import { getPackageSize } from "react-helper-toolkit/node/packageSize";
```

这样设计的动机：一个纯 Node 脚本引用 `utils/url` 时，不应该被迫加载任何 React 相关代码；反过来，浏览器项目也不会把 Node 工具打进 bundle。10 篇会拆 `package.json` 的 exports 映射是怎么做到这一点的。

## 初学者最容易踩的误解

**误解：hooks 库都差不多，会一个就会全部，随便挑一个用就行。**

实际情况是这个库对几类需求明确说「不」，这些边界值得在动手前知道（完整对照表见根 README 的「迁移指引」）：

| 你可能期望的能力 | 本库的做法 | 原因 |
|---|---|---|
| 主题切换 hook（内置状态管理） | 不自带，提供 `ThemeAdapter` 接口自行接入 | 主题实现与 UI 库强耦合，接口化才能 UI 无关 |
| loading 状态管理 hook | 提供 `useLockFn` 管加锁，状态你自己存 | 拆分关注点：加锁和 UI 状态是两件事 |
| `useAttrs` / 全局状态 hook | 不提供 | Vue 语义硬翻成 React 会变成伪 hook，React 用 props 和 Context |

另一个高频误解：**「utils 里的 `debounce` 和 hooks 里的 `useDebounceFn` 是重复实现」**。它们确实都存在——`utils/debounce.ts` 是保持参考实现行为兼容的版本（默认 200ms，支持 `immediate` 首次执行），`core/debounce.ts` 是工程可控的新版（返回带 `cancel`/`flush` 的对象）。库内部两处各用各的，04 篇会讲为什么留着两套。

## 验证它确实能用

库自带完整验证链，改任何代码后跑一条命令：

```bash
pnpm check   # 依次执行 tsc --noEmit（类型）、vitest run（单测）、tsup（构建）
```

三个阶段各自把守一道关：类型检查确认公共 API 签名没被破坏（包括 `src/type-tests/` 下的类型级测试），单测确认行为正确（jsdom 环境，覆盖全部 hooks），构建确认产物能正常生成。09 篇会讲这条闸门是怎么搭的。

## 下一步

下一篇进入最高频的四个 hooks：`useTimeout`、`useInterval`、`useDebounceFn`、`useThrottleFn`。你会看到「delay 传 null 表示暂停」和「回调变了不会重置计时器」这两个行为分别是怎么实现的，以及防抖节流的 `leading`/`trailing` 配置在什么业务场景下选什么值。

自查清单：

- [ ] 能说出 Core 层和 Hooks 层的分工，以及为什么 core 可以脱离 React 使用
- [ ] 知道主入口和子路径分别导出什么，为什么 utils 不进主入口
- [ ] 能列出这个库「不提供」的三类能力及理由
- [ ] 本地跑通了 `pnpm check`
