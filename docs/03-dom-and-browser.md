# 03 · DOM 事件与浏览器能力

> 本篇结论：`useEventListener`、`useClickAway`、`useDark`、`useCopyToClipboard`、`useLoader` 五个 hooks 覆盖了浏览器交互的最高频需求。它们的共同点是：把「注册—更新—清理」的完整生命周期管完，你只写业务回调。读完本篇你能正确处理事件目标的三种形态、外点关闭的判断逻辑，以及动态资源加载的清理边界。

## useEventListener：事件监听的标准姿势

签名：`useEventListener(event: string, handler: (event: Event) => void, options?: UseEventListenerOptions): void`。

先看它解决的问题。手写事件监听，这三件事最容易漏：

```tsx
// ❌ 手写版：三个隐患
useEffect(() => {
  window.addEventListener("resize", handler); // 1. 没写 cleanup，监听器泄漏
  // 2. handler 变化时不会重新绑定，回调里读到旧闭包
  // 3. target 想换成某个元素时，绑定/解绑逻辑要重写
}, []);
```

库版一次管完：

```tsx
useEventListener("resize", (event) => {
  console.log(window.innerWidth);
});

// 指定目标：三种形态都可以
useEventListener("click", handler, { target: buttonRef });        // React ref
useEventListener("scroll", handler, { target: () => listRef.current }); // getter 函数
useEventListener("keydown", handler, { target: document.body });  // 直接传 EventTarget
```

`UseEventListenerOptions` 完整字段：`target`（默认 `window`）、`capture`、`once`、`passive`，全部透传给原生 `addEventListener`。

重订阅规则写在源码注释里，值得背下来（`hooks/useEventListener.ts:39`）：**回调更新不触发重新订阅；`event`、`target` 或监听选项变化时才清理并重建监听**。实现方式是回调经 `useLatest` 存进 ref，真正绑定的包装函数永远只读 `handlerRef.current`——绑定关系稳定，回调内容实时。

还有一个防御细节：目标不存在或没有 `addEventListener` 方法时直接跳过（`if (!targetElement?.addEventListener) return`），配合 `typeof window === "undefined"` 的检查，SSR 环境不会炸。

**误解：「`once: true` 就不需要 cleanup 了。」** `once` 只表示触发一次后浏览器自动解绑；如果组件在触发前就卸载了，没有 cleanup 的话监听器仍然挂着。cleanup 和 `once` 管的是不同阶段，两者都要。

## useClickAway：区域外点击关闭

签名：`useClickAway<T>(onClickAway, target?, events?: readonly string[]): RefObject<T | null>`，`events` 默认 `['click']`。

两种用法，取决于你有没有现成的 ref：

```tsx
// 用法一：让它返回 ref，你绑到元素上
function Dropdown() {
  const [open, setOpen] = useState(false);
  const ref = useClickAway<HTMLDivElement>(() => setOpen(false));
  return <div ref={ref}>{open && <Menu />}</div>;
}

// 用法二：已有 ref 直接传入
const panelRef = useRef<HTMLDivElement>(null);
useClickAway(() => setOpen(false), panelRef);
```

判断逻辑在 `hooks/useClickAway.ts:57`：监听绑在 `document` 上，触发时用 `element.contains(event.target)` 判断点击点是否在目标内部，内部直接 return，外部才执行回调。`contains` 自动处理了嵌套子元素，你不需要遍历 DOM 树。

监听是逐个绑定 `events` 数组里的每个事件名的，cleanup 时对应逐个解绑。想同时响应触摸和点击：

```tsx
useClickAway(() => setOpen(false), ref, ["click", "touchstart"]);
```

**误解：「mousedown 才是「按下」，所以应该监听 mousedown。」** 外点关闭的正确事件通常是 `click`——用户在弹窗内按下、拖到外面松开时，`mousedown` 目标在内部、`click` 目标在外部。多数交互期望按「松开位置」判定，直接换成 `mousedown` 会产生误关闭。特殊交互（如拖拽选择）才需要换事件，`events` 参数就是留给这种场景的。

## useDark：暗色模式的观察与切换

签名：`useDark(options?: { className?: string; selector?: "html" | "body" }): { isDark: boolean; toggleDark(): void }`。

```tsx
function ThemeToggle() {
  const { isDark, toggleDark } = useDark();
  return <button onClick={toggleDark}>{isDark ? "☀️ 亮" : "🌙 暗"}</button>;
}
```

它做的事：`toggleDark` 在 `html` 元素上 toggle `dark` class（Tailwind 等方案的标准约定）；`isDark` 状态通过 **`MutationObserver`** 与 DOM 保持同步——监听的是 `attributes` 变化且 `attributeFilter: ["class"]`，只有 class 变了才触发。

这里有个值得注意的设计：**初始状态是 `false`，挂载后才读一次 DOM 同步真实状态**。如果你的页面由其他代码（比如主题脚本）提前设了 dark class，`isDark` 会在挂载后的第一次 effect 里纠正过来。`toggleDark` 经 `usePersistFn` 包装，引用稳定，可以放心放进子组件的 props。

`MutationObserver` 在 cleanup 里 `disconnect()`——又一个「谁注册谁清理」的示范。

## useCopyToClipboard：复制与状态

这个模块包含一个纯函数和一个 hook：

```tsx
function CopyButton({ text }: { text: string }) {
  const { copied, update } = useCopyToClipboard();
  return (
    <button onClick={() => update(text)}>
      {copied ? "已复制" : "复制"}
    </button>
  );
}
```

返回值三个字段（`UseCopyToClipboardResult`）：

| 字段 | 含义 |
|---|---|
| `clipboardValue` | 最近一次传入 `update` 的原始值 |
| `copied` | 最近一次复制是否成功 |
| `update(value)` | 更新值并立即尝试复制 |

两个边界行为，源码注释写得明确：`update` 收到**空白文本**时会改为复制 hook 的 `defaultValue`，但 `clipboardValue` 仍保留原始输入——「展示值」和「实际复制的值」是分离的。

底层纯函数 `copyTextToClipboard` 用的是 `document.execCommand("copy")` 这条传统路径（创建临时 textarea、选中、复制、恢复选区和焦点），成功与否同步返回 boolean。相比异步的 `navigator.clipboard.writeText`，它的优势是不需要 HTTPS 和用户手势授权的严格前置，在非安全环境（HTTP 内网页面）也能工作。失败时返回 `false` 而不抛异常，`copied` 状态天然反映结果。

## useLoader：动态加载 CSS 和脚本

签名：`useLoader(destroy = true): { loadCss; loadScript }`，加载方法接收 `{ src, element? }` 或其数组，返回 `Promise<LoadResult[]>`。

```tsx
function ChartPage() {
  const { loadScript } = useLoader(); // destroy 默认 true

  useEffect(() => {
    loadScript({ src: "https://cdn.example.com/echarts.min.js" })
      .then(([result]) => console.log(result.message)); // "加载成功"
  }, [loadScript]);

  return <div id="chart" />;
}
```

三条规则：

1. **卸载时自动移除本次加载的节点**（`destroy: true` 默认值）。加载的资源按 Hook 实例记账（内部用 `Set<Element>` 收集），组件死了资源就撤。想加载全局共享的脚本（如统计 SDK），传 `useLoader(false)`。
2. **相同地址的已有节点会被替换**。源码里用 `cloneNode` 替换旧节点，一是重新触发 load/error 事件，二是把新节点纳入当前实例的清理范围。
3. **插入位置有默认值**：CSS 进 `head`，脚本进 `body`，`element` 字段可指定 `head` / `body` / 具体元素。

**误解：「脚本加载过一次，第二次 loadScript 会跳过。」** 当前实现不做去重，同地址会替换重载。如果你的场景是「全局只加载一次」，要么用 `useLoader(false)` 且由业务侧保证只调一次，要么自己在外层做标记。

## 自查清单

- [ ] 能说出 `useEventListener` 的重订阅规则，以及「回调更新不重订阅」是怎么实现的
- [ ] 知道 `useClickAway` 两种用法的区别和 `contains` 判断的位置
- [ ] 能解释为什么外点关闭默认监听 `click` 而非 `mousedown`
- [ ] 知道 `useLoader` 的 `destroy` 参数和同地址替换行为，什么场景传 `false`
- [ ] 知道 `useCopyToClipboard` 空白输入时「复制值」和「展示值」的不同走向
