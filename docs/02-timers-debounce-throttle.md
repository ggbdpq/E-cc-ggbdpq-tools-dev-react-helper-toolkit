# 02 · 定时器、防抖与节流

> 本篇结论：这四个 hooks（`useTimeout`、`useInterval`、`useDebounceFn`、`useThrottleFn`）各自解决「一件事什么时候发生」的问题，它们共享两个设计承诺——回调永远读最新值、组件卸载自动清理。读完本篇你能正确选型、正确传配置，并理解「delay 传 null 是暂停而不是立即执行」这类边界行为。

## 先分清四个问题

定时器和流控工具容易混着用。用四个问题给它们分工：

| 问题 | 工具 | 生活类比 |
|---|---|---|
| 「N 毫秒后做一次，中途可以反悔」 | `useTimeout` | 闹钟：响了之前可以按掉 |
| 「每隔 N 毫秒做一次」 | `useInterval` | 闹钟每隔 5 分钟响一次 |
| 「一堆人挤过来，只服务最后那个」 | `useDebounceFn` | 电梯关门：有人进来就重新等待 |
| 「人再多，也按固定节奏服务」 | `useThrottleFn` | 水龙头滴水：不管你拧多急，固定间隔一滴 |

防抖和节流的选择标准就一句话：**关心「最终状态」用防抖**（搜索框只要最后一次输入），**关心「过程节奏」用节流**（滚动监听、resize 只要固定频率）。

## useTimeout：可暂停的单次定时器

签名：`useTimeout(fn: () => void, delay: number | null | undefined): void`。

```tsx
function Toast({ message, duration }: { message: string; duration: number | null }) {
  useTimeout(() => setVisible(false), duration);
  // duration 从数字变成 null 的那一刻，旧定时器被清掉且不启动新的。
  return <div>{message}</div>;
}
```

`delay` 传 `null` 或 `undefined` 时不启动定时器；已经是数字再变成 `null`，等于撤销这个定时器。这让「条件性延迟」变得很自然：`duration` 放在 state 里，置 `null` 就暂停。

源码很短，完整贴出（`hooks/useTimeout.ts`）：

```ts
export function useTimeout(fn: () => void, delay: number | null | undefined): void {
    const timerFn = usePersistFn(fn);

    useEffect(() => {
        if (delay === undefined || delay === null) return;

        const timer = setTimeout(() => {
            timerFn();
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [delay, timerFn]);
}
```

两个值得咀嚼的点：

1. **`timerFn` 来自 `usePersistFn`，引用永远稳定**。所以 effect 的依赖数组里它是常量，定时器只随 `delay` 变化重建。你在组件里改传进来的回调，定时器不会重置，但触发时执行的是最新逻辑。
2. **cleanup 里 `clearTimeout`**。组件卸载或 `delay` 变化时，pending 的定时器被取消。这就是 StrictMode 安全的来源（06 篇展开）。

**常见误解：「delay 传 0 和传 null 差不多，都是马上不执行。」** 传 `0` 会启动一个真实的宏任务定时器（下一个事件循环执行）；传 `null` 压根不启动。语义差异在「暂停后恢复」场景会暴露：`null → 3000` 会重新计时，`0` 只是执行极快。

## useInterval：带 immediate 选项的轮询

签名：`useInterval(fn, delay, options?: { immediate?: boolean })`。

```tsx
function Poller() {
  const [data, setData] = useState(null);

  useInterval(async () => {
    setData(await fetchStatus());
  }, 5000, { immediate: true }); // 挂载后立即拉一次，再进入 5 秒轮询

  return <Status data={data} />;
}
```

`immediate: true` 时会在启动定时器前同步执行一次回调。没有这个选项时，「先执行一次再轮询」需要你在 effect 外面手动补一次调用。

和 `useTimeout` 一样：`delay` 为 `null` 暂停轮询，回调始终读最新值（内部用 `useLatest`）。

## useDebounceFn：防抖，带 cancel 和 flush

签名：`useDebounceFn<T>(fn: T, options?: UseDebounceFnOptions): DebouncedFn<T>`，其中 `UseDebounceFnOptions = { wait?: number; leading?: boolean; trailing?: boolean }`。

```tsx
function SearchBox() {
  const debouncedSearch = useDebounceFn(
    (keyword: string) => fetchResults(keyword),
    { wait: 300 },
  );

  return (
    <>
      <input onChange={(e) => debouncedSearch(e.target.value)} />
      <button onClick={() => debouncedSearch.cancel()}>取消</button>
      <button onClick={() => debouncedSearch.flush()}>立即搜索</button>
    </>
  );
}
```

返回值是一个**可调用对象**：本体执行防抖调用，`.cancel()` 丢弃还没执行的排队任务，`.flush()` 让排队的任务立即执行。类型层面 `DebouncedFn<T>` 保留了原函数的参数类型——你传什么签名的 `fn`，调用时就检查什么参数（09 篇拆这个泛型怎么写的）。

三个默认值和两个边界行为，直接决定使用体验：

| 配置 | 默认值 | 含义 |
|---|---|---|
| `wait` | `1000` | 静默等待毫秒数 |
| `leading` | `false` | 首次调用是否立即执行 |
| `trailing` | `true` | 静默期结束后是否执行最后一次 |

**边界一：`wait`、`leading`、`trailing` 变化会重建防抖实例**（`hooks/useDebounceFn.ts` 里 `useMemo` 的依赖就是这三项），重建前旧实例的 pending 任务被 `useEffect` cleanup 取消。所以配置是响应式的，但重建会丢掉排队中的调用。

**边界二：回调更新不重建实例**。`fn` 通过 `useLatest` 包了一层传给 core，计时器不受业务回调变化影响。这是「配置变化重建、回调变化不重建」的精确分工。

**误解：「搜索框要加 `leading: true`，不然第一次点击没反应。」** 恰恰相反。防抖的典型场景是连续输入，`leading: true` 会让第一个字符「a」立刻触发一次搜索，之后每次输入重置静默期，停顿后以「abc」再搜一次——首字符那次请求纯属浪费。`leading` 适合的是按钮防连点这类「第一次必须立刻响应」的场景。

## useThrottleFn：节流，注意 leading 默认值

签名：`useThrottleFn<T>(fn: T, options?: UseThrottleFnOptions): ThrottledFn<T>`，配置结构与防抖相同，但 **`leading` 默认 `true`**（防抖默认 `false`）。

```tsx
const throttledLog = useThrottleFn(() => {
  reportScrollPosition(window.scrollY);
}, { wait: 200 });
// 滚动事件里调用 throttledLog()，最多每 200ms 上报一次
```

两者都为 `false` 时函数完全不执行（core 层直接短路，`core/throttle.ts` 第一行判断）。core 版还处理了一个罕见但真实的边界：**系统时间回拨**。如果用户机器时钟被回调，`remaining` 会算出大于 `wait` 的值，此时同样按「开启新节流窗口」处理，不会卡死（`core/throttle.ts` 里有注释标注这个决策）。

返回值是 `ThrottledFn<T>`：可调用 + `.cancel()`。没有 `.flush()`——节流语义下「立即执行被跳过的那次」需要业务自己决定时机，库不替你猜。

## 选型速查

| 场景 | 推荐 | 配置 |
|---|---|---|
| 搜索框输入 | `useDebounceFn` | `wait: 300`，保持默认 |
| 按钮防连点（弱需求） | `useLockFn`（07 篇） | 异步场景优先于防抖 |
| 滚动/resize 高频回调 | `useThrottleFn` | `wait: 100~200` |
| 条件性延迟执行 | `useTimeout` | `delay` 接 state，`null` 暂停 |
| 轮询 + 首次立即拉取 | `useInterval` | `{ immediate: true }` |

## 自查清单

- [ ] 能说出 `delay: null` 和 `delay: 0` 的语义差异
- [ ] 知道「回调变化不重建计时器、配置变化重建」分别在源码里对应哪段逻辑
- [ ] 能为「搜索框」「滚动上报」「首次必须立刻响应」三种场景选对工具和配置
- [ ] 知道 `useDebounceFn` 的返回值上有哪些控制方法，`useThrottleFn` 为什么少一个
