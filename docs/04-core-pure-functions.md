# 04 · Core 层：先纯函数，后 Hook

> 本篇结论：Core 层是这个库真正的资产。8 个 `create*` 纯函数工厂不依赖 React，可以在 Node 脚本、Worker、单元测试里独立使用；hooks 只是在它们外面套了一层生命周期。读完本篇你会掌握全部 8 个工厂的用法，理解「为什么先写纯函数再写 hook」，并看清库里两套防抖实现各自的定位。

## 为什么要分层

先算一笔账：如果防抖逻辑直接写在 `useDebounceFn` 内部，会发生什么？

- 想在 Node 脚本里给日志函数加防抖？做不到，它 import 了 React。
- 想单测防抖的 leading/trailing 组合？必须先 `renderHook`，测试环境要拉进 jsdom。
- 想换一个视图层方案？防抖逻辑得跟着 hooks 重写一遍。

分层之后这三个问题同时消失：`createDebouncedFn` 是纯函数，谁都能用；`useDebounceFn` 只有 20 行，做的全是「React 接线」工作。**逻辑与框架的耦合面被压缩到最薄的一层**，这层薄到出问题时你只需要检查接线，不用怀疑发动机。

## 8 个工厂速览

下表是 Core 层的完整清单，签名以源码为准：

| 工厂 | 返回 | 用途 |
|---|---|---|
| `createDebouncedFn(fn, wait?, options?)` | 可调用对象 + `cancel` / `flush` | 防抖 |
| `createThrottledFn(fn, wait?, options?)` | 可调用对象 + `cancel` | 节流 |
| `createTimeout(fn, delay)` | `{ clear() }` | 单次定时器 |
| `createInterval(fn, delay)` | `{ clear() }` | 重复定时器 |
| `createAsyncLock()` | `{ run, isLocked }` | 异步互斥锁 |
| `createCancelToken()` | `{ signal, cancel, isCancelled }` | 取消信号 |
| `createEventEmitter<T>()` | `{ on, off, emit, once, clear }` | 类型安全事件订阅 |
| `createLatestRef(value)` | `{ current }` | 最新值容器 |

它们全部从主入口导出：

```ts
import { createDebouncedFn, createAsyncLock } from "react-helper-toolkit";
```

## 定时器句柄：给 setTimeout 一个「把手」

`createTimeout` / `createInterval` 的返回值是 `TimerHandle`：

```ts
const timer = createTimeout(() => sendReport(), 30_000);
// 业务条件变化，随时反悔
timer.clear();
```

原生 `setTimeout` 返回的是数字 id，`clearTimeout(id)` 又是一对需要配对保管的变量。`TimerHandle` 把「定时器」从 id 升级成对象——把手长在定时器自己身上，传递和取消都是一件事。这看似只是风格差异，但当定时器需要跨函数传递时（比如传给一个管理器），对象比裸 id 可靠得多。

## AsyncLock：一个 if 就能讲完的互斥

`core/async-lock.ts` 全文不到 45 行，核心逻辑一句话：**锁被占用时 `run` 直接返回 `undefined`，不再排队**。

```ts
const lock = createAsyncLock();

// 三个并发调用，只有第一个真正执行，后两个拿到 undefined
lock.run(() => fetch("/api/refresh"));
lock.run(() => fetch("/api/refresh"));
lock.run(() => fetch("/api/refresh"));

lock.isLocked; // 执行期间为 true
```

注意它和队列式锁的区别：这个锁**丢弃**并发请求而不是排队。对「防重复提交」场景这正是想要的行为；如果你要的是「排队等前一个完成」，这个锁不适用，需要自己用 Promise 链实现。释放时机用 `try/finally` 保证——fn 抛异常锁也会开（07 篇讲它怎么被 `useLockFn` 使用）。

## CancelToken：AbortController 的最小包装

```ts
const token = createCancelToken();

fetch("/api/search?q=react", { signal: token.signal }).catch((e) => {
  if (token.isCancelled) return; // 主动取消，不是错误
  throw e;
});

// 组件卸载 / 输入过期时
token.cancel("superseded");
```

`AbortController` 本身已经很好用，这个包装加了三样东西：`isCancelled` 状态查询（不用读 `signal.aborted` 这种间接表达）、默认取消原因（`"Cancelled"`）、以及一个可以随意传递的领域对象——调用链深处不需要知道 AbortController 的存在，只认识 `cancel()` 和 `isCancelled`。重复调用 `cancel` 不会覆盖第一次的原因（AbortController 的语义就是如此，包装只是把它写进契约）。

## EventEmitter：把事件名变成类型

`createEventEmitter<T>()` 的泛型参数是「事件名到载荷」的映射：

```ts
type Events = {
  change: string;
  reset: void;
};

const emitter = createEventEmitter<Events>();

emitter.on("change", (value) => console.log(value.toUpperCase())); // value: string
emitter.emit("change", "hello");
emitter.emit("change", 42); // ❌ 类型错误：载荷必须是 string
emitter.once("reset", () => cleanup()); // 触发一次后自动解绑
```

事件名写错、载荷类型不匹配都在编译期报错。实现上有一个值得学的细节：`emit` 时先对监听器集合做**快照**（展开成数组再遍历），保证某个回调里新增或删除订阅不会影响本轮派发——否则遍历过程中集合被修改，行为会变得不可预测（`core/event-emitter.ts` 有注释标注）。

不传泛型时退化为宽松模式（`Record<PropertyKey, unknown>`），兼容无类型的老代码。

## LatestRef：hooks 层的地基

`createLatestRef(initialValue)` 返回 `{ current }`，一句话：**一个不依赖 React 的可变引用容器**。它本身极少直接用，但它是 05 篇主角 `useLatest` 的 core 版本——`useLatest` 可以看成「`useRef` + 每次渲染同步赋值」的组合，而「最新值容器」这个概念被下沉到了 core，供框架无关场景复用。

## 两套防抖：并存的设计决策

库里有防抖的两个实现，各有明确的辖区：

| | `core/debounce.ts` | `utils/debounce.ts` |
|---|---|---|
| 默认等待 | 1000ms | 200ms |
| 配置 | `leading` / `trailing` | `immediate`（首次立即执行） |
| 返回值 | 带 `cancel`/`flush` 的可调用对象 | 裸函数 |
| 定位 | 工程可控的新实现 | 保持参考实现行为兼容 |
| 谁在用 | `useDebounceFn`、`useResizeObserver` | `useDraggable`、`useWatermark` |

`utils` 版的注释写着「保持参考实现的 trailing 防抖和 immediate 首次执行语义」——它是从 Vue 参考项目移植过来的行为基线，凡是移植来的 hooks（拖拽、水印）都用它，保证行为和参考实现一致；新写的 hooks 用 core 版。**并存是有意的：用实现版本标记「这段逻辑的来历」**。11 篇讲移植方法论时会回到这个话题。

**误解：「core 层是 hooks 的内部实现细节，业务不该碰。」** 反了。core 层就是为独立使用设计的——它有自己的单测（`core/__tests__/` 下 7 个测试文件），导出到主入口，README 里为它单独立了表格。在 Node 脚本里给日志加防抖、在 Worker 里做节流采样，都是它的正当用法。

## 自查清单

- [ ] 能说出分层解决了哪三个问题
- [ ] 知道 AsyncLock 是丢弃式而非排队式，适用与不适用的场景各一个
- [ ] 能解释 EventEmitter 的 emit 快照为什么必要
- [ ] 能说出两套防抖的辖区划分，以及为什么 `useDraggable` 用的是 utils 版
