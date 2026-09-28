# 05 · 引用稳定性与闭包陷阱

> 本篇结论：`useLatest` 和 `usePersistFn` 加起来只有 20 行代码，却是整个库所有 hooks「回调永远读最新值、引用永远不变」两项承诺的地基。读完本篇你能诊断闭包陷阱，知道这两个工具各自该用在什么位置，以及 `useCallback` 为什么替代不了它们。

## 先复现陷阱

闭包陷阱（stale closure，旧闭包）是 React hooks 时代最经典的 bug：

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // 永远打印 0
      setCount(count + 1); // 永远设置 1
    }, 1000);
    return () => clearInterval(id);
  }, []); // 空依赖：effect 只运行一次，捕获的 count 永远是首次渲染的 0

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

原因：JS 函数会**捕获定义那一刻的变量**。effect 在首次渲染时执行，里面的回调捕获了当时的 `count`（值为 0）。之后每秒执行的都是这份旧快照。

标准修法是往依赖数组里加 `count`——但那会让定时器每秒销毁重建，轮询节奏完全乱了。真正的修法是：**定时器只建一次，但每次执行时读最新的值**。这正是 `useLatest` 的工作。

## useLatest：永远最新的杂志架

签名：`useLatest<T>(value: T): React.MutableRefObject<T>`。实现全文：

```ts
export function useLatest<T>(value: T): React.MutableRefObject<T> {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}
```

类比：它是一个**杂志架**。每一期新刊（每次渲染的新值）送来时都放在架子的固定位置，你什么时候去拿（`ref.current`），拿到的都是最新一期。

用它修上面的 bug：

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useLatest(count);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(countRef.current + 1); // 每次读最新值
    }, 1000);
    return () => clearInterval(id);
  }, []); // 依赖数组保持空，定时器节奏稳定

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

实现上有一个关键决定：**赋值 `ref.current = value` 发生在渲染函数体里，而不是 `useEffect` 里**。这保证了一个语义——任何时点（包括其他 effect 还没跑、事件回调正在执行的间隙）去读 `ref.current`，都是本次渲染的最新值。如果在 effect 里赋值，赋值时机会推迟到 commit 之后，某些并发场景会读到旧值。

代价也要说清楚：在渲染期写 ref 属于「渲染函数不纯」的操作，React 官方对并发渲染下的这种写法持保留态度。它之所以被 React 生态广泛接受（ahooks 的 `useLatest`、React 官方 useEvent RFC 的草案实现都是这个形状），是因为它只写「不参与渲染输出的最新值快照」，不会引发渲染歧义。知道这个 trade-off，你在代码评审里遇到这个模式时能给出准确的判断。

## usePersistFn：引用永不变的代理

签名：`usePersistFn<T extends AnyFunction>(fn: T): T`——传什么函数，返回「同一个签名的引用稳定版本」。实现全文：

```ts
export function usePersistFn<T extends AnyFunction>(fn: T): T {
    const fnRef = useRef(fn);
    fnRef.current = fn;

    const persistRef = useRef<T>();

    if (!persistRef.current) {
        persistRef.current = ((...args: Parameters<T>) => fnRef.current(...args)) as T;
    }

    return persistRef.current;
}
```

结构是 `useLatest` 的应用：`fnRef` 存最新函数；`persistRef` 里存一个**只在首次渲染创建**的代理函数，代理体内转发给 `fnRef.current`。

类比：公司前台**永远不会换人**（引用稳定），但你每次找「销售部」时，她帮你转接的都是**当前当班的销售**（执行最新逻辑）。销售换了多少轮，前台的电话号码不变。

它解决的问题是真实的：`addEventListener`、事件订阅、第三方库实例的回调注册，这些 API 都「认引用」——引用变了就得解绑重绑，或者更糟，根本不生效：

```tsx
// ❌ 用裸函数：每次渲染新引用，effect 反复销毁重建监听
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, [handleResize]); // handleResize 每次渲染都变

// ✅ 用 usePersistFn：监听只注册一次
const stableResize = usePersistFn(handleResize);
useEffect(() => {
  window.addEventListener("resize", stableResize);
  return () => window.removeEventListener("resize", stableResize);
}, [stableResize]); // 永不变化
```

## useCallback 为什么不够

| | `useCallback(fn, deps)` | `usePersistFn(fn)` |
|---|---|---|
| 引用稳定性 | 依赖不变时稳定 | **永远稳定** |
| 依赖管理 | 要列依赖数组，列错就出 bug | 无依赖数组 |
| 语义 | 「缓存这个函数」 | 「永远执行最新版」 |

`useCallback` 的稳定是**有条件的**。一旦依赖数组里出现了每次渲染都变的值（对象字面量、内联函数），缓存就失效，下游的 effect 跟着雪崩。更麻烦的是它的语义是「冻结」——它缓存的是那份旧闭包，回调里读到的 state 还是旧的，你还得自己用函数式更新或 ref 补救。

`usePersistFn` 把语义换成「永远透传最新版」，从根上同时解决两个问题：引用永不变化，闭包永不过期。代价是放弃了「函数身份变化」这个信号——你不能靠它触发下游更新，需要触发时应该用 state。

**误解：「usePersistFn 是 useCallback 的上位替代，全项目替换。」** 不是。给 DOM 元素的 `onClick` 用它毫无意义——React 的事件绑定不认引用稳定性，白白多一层代理。它的主场是**注册给外部系统的回调**：事件监听、订阅、定时器、第三方实例。

## 库内实战：这两个工具怎么协作

看 `useEventListener` 的接线（`hooks/useEventListener.ts`，节选）：

```ts
const handlerRef = useLatest(handler);       // 存最新回调

useEffect(() => {
  const eventListener = (event: Event) => {
    return handlerRef.current(event);        // 触发时读最新
  };
  targetElement.addEventListener(event, eventListener, { capture, once, passive });
  return () => targetElement.removeEventListener(event, eventListener, { capture });
}, [capture, event, handlerRef, once, passive, target]);
```

一次注册，两处功夫：绑定的包装函数是 effect 里新建的（引用只在 event/target/选项变化时更换），包装体内经 `handlerRef.current` 转发最新业务回调。这正是「引用稳定」和「执行最新」的合体形态。库内 16 个 hooks 全部按这个模式接线，你在 02、03 篇已经见过它的各种变体。

## 自查清单

- [ ] 能向同事讲清楚闭包陷阱的成因（快照捕获），并用 useLatest 修复一个轮询 bug
- [ ] 能说出 useLatest 的赋值发生在渲染期而非 effect 期，以及这样做的收益
- [ ] 知道 usePersistFn 的代理函数只在首次渲染创建，转发发生在调用时
- [ ] 能判断一个回调该不该用 usePersistFn（标准：是否注册给外部系统）
- [ ] 能说出 useCallback 两个不够用的场景（有条件稳定、冻结旧闭包）
