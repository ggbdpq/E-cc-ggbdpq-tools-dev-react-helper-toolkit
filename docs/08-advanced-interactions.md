# 08 · 高级交互 Hooks 内幕

> 本篇结论：`useResizeObserver`、`useScrollTo`、`useDraggable`、`useWatermark`、`useECharts` 这五个 hooks 处理的是「React 状态模型不好管的命令式世界」——尺寸观察、滚动动画、鼠标拖拽、Canvas 水印、图表实例。读完本篇你不仅会用它们，还能看懂每个实现里的关键权衡：为什么动画要用 rAF 合并、为什么水印的「防删除」只守护节点存在。

## 命令式能力的受控出口

这批 hooks 的共同形态：**React 管「要不要」，controller 管「怎么动」**。返回值不再是单纯的状态，而是一个控制器对象（`{ start, stop }`、`{ open, close, reset }`、`{ setWatermark, clear }`）。React 声明式模型擅长描述「界面在状态 X 时长什么样」，但滚动到哪一像素、拖拽到哪个坐标、canvas 怎么画，本质是命令式过程——硬用 state 表达每帧坐标会让渲染次数爆炸。控制器模式的分界线就画在这里：状态变化触发 `controller.start()`，动画过程完全不经过 React。

**误解：「在 React 里直接操作 DOM 是反模式。」** 需要区分两件事：绕过 React 管「内容与状态」是反模式；对「过程性、高频、纯视觉」的操作（动画、拖拽、canvas），由 hook 封装的命令式出口恰恰是正确分层。判断标准是操作结果是否需要反映到 React 渲染输出——需要的（如拖拽后的 `transform` 坐标）就同步进 state，不需要的（滚动过程中的中间帧）就留在命令式世界。

## useResizeObserver：观察尺寸变化

签名：`useResizeObserver(target, callback, options?): { stop, restart }`。`target` 支持四种形态：元素、CSS 选择器字符串、React ref、以及它们的数组。

```tsx
const { stop, restart } = useResizeObserver(
  panelRef,
  (entries) => redrawChart(entries[0].contentRect),
  { time: 100 }, // 回调防抖 100ms，默认 40ms
);
// 条件渲染导致 ref 时有时无时：restart() 重新解析目标并建立观察
```

三个实现决策值得知道：

1. **回调默认防抖 40ms**（`time` 可调）。窗口拖拽时 ResizeObserver 每帧都触发，直接回调会让重绘风暴雪上加霜，防抖把高频抖动收敛成一次。
2. **`immediate` 默认 `true`，首次通知是手动构造的**。源码注释写明原因：ResizeObserver 没有同步读取 API，挂载后想知道「当前多大」只能等浏览器异步通知。库用 `getBoundingClientRect()` 立即构造一条 entry 回调给你，省去「初始渲染拿不到尺寸」的等待。
3. **观察器生命周期显式化**。`stop` 断开观察并取消防抖任务，`restart` 重新解析目标重建观察器。内部把两者都做成 `usePersistFn`，effect cleanup 直接引用 `stop`——「谁注册谁注销」纪律的又一处落实。

## useScrollTo：可控的滚动动画

签名：`useScrollTo(options): { start, stop }`，`options = { el, to, directions, duration?, callback? }`。

```tsx
const { start, stop } = useScrollTo({
  el: containerRef,          // 元素或 ref
  to: 0,                     // 滚到顶部
  directions: "scrollTop",   // 垂直轴；水平用 "scrollLeft"
  duration: 300,             // 动画时长，默认 0（立即到底）
  callback: (msg) => {       // "滚动完毕" | "无需滚动"
    if (msg === "无需滚动") console.log("已经在顶部了");
  },
});
// 挂载后不会自动滚动，业务事件里调用
start();
```

实现里有四个值得学习的细节：

**范围钳制**。`to` 会被限制在元素可滚动范围内：`Math.max(0, Math.min(to, scrollHeight - clientHeight))`。调用方传 `99999` 意图「滚到底」，不需要自己算边界。

**缓动函数独立导出**。`easeInOutQuad`（二次缓入缓出）是独立的纯函数，也在主入口导出。动画插值和动画循环分离——想换缓动曲线或自己写循环，插值函数直接可用。

**帧率假设**。动画增量是 `Math.max(1, duration / 60)`，即按 60fps 把总时长切成步长。这不是精确帧同步，是「每帧走一小步、累计到达终点」的简化实现，对滚动场景足够平滑。

**严格的 start/stop 纪律**。源码注释写明：「一次 `start` 后需要先执行 `stop` 才能开始下一次滚动」。进行中再调 `start` 会被直接忽略（`scrollingRef` 守卫），这是刻意保留的调用语义——滚动动画是独占过程，叠加两次动画（尤其方向相反）结果不可预测。想要「随时重新滚」，调用侧先 `stop()` 再 `start()`。

## useDraggable：视口内的元素拖拽

签名：`useDraggable(target, handle, options?): DraggableController`，返回 `{ draggable, dragging, transform, init, open, close, reset }`。

```tsx
const drag = useDraggable(panelRef, headerRef, { resize: 100 });

useEffect(() => {
  drag.open(); // 注意：不会自动注册，必须显式开启
  // 完整重置用 drag.init()：close + 复位 + open
}, [drag]);

return <div ref={panelRef}><div ref={headerRef}>按住拖动</div></div>;
```

实现里最有含金量的是**拖拽边界数学**（`hooks/useDraggable.ts:84`）。mousedown 时以元素当前矩形为基准算出四个方向的位移上限：

```ts
const minX = -rect.left + initial.offsetX;                        // 左边界
const maxX = viewportWidth - rect.left - rect.width + initial.offsetX; // 右边界
// 移动时双向钳制
offsetX: Math.min(Math.max(initial.offsetX + dx, minX), maxX)
```

效果：元素无论怎么拖都完整留在视口内。所有坐标都基于「拖动开始那一刻的矩形」计算，拖动中不再重算，避免抖动。

第二个关键决策是 **rAF 合并 mousemove**。mousemove 触发频率远超屏幕刷新率，直接在里面写 `style.transform` 会造成无意义的重复布局写入。库的做法：mousemove 只更新 state 引用和 React 状态，真正写 DOM 用 `requestAnimationFrame` 包裹且每次取消上一帧——**每帧最多一次布局写入，且永远是最后一次位置**。这是所有拖拽实现的标准优化，值得记住。

第三个：`resize` 选项（默认 `60` 毫秒防抖）在窗口缩放后检查元素是否越界，越界就 `reset()` 回原位——拖拽边界是按「当时视口」算的，视口变了边界就失效，需要校正。

## useWatermark：Canvas 水印与「防删除」

签名：`useWatermark(target?, resizeRedraw = false): { setWatermark, clear }`。

```tsx
const { setWatermark, clear } = useWatermark(document.body, true);

useEffect(() => {
  setWatermark("内部资料 · 禁止外传", {
    rotate: -20,
    gradient: [{ value: 0, color: "#c0c0c0" }, { value: 1, color: "#808080" }],
    forever: true, // 用户在控制台删掉水印节点时自动补回
  });
  return clear;
}, [setWatermark, clear]);
```

实现是一条经典管线：文字画到 canvas（支持旋转、渐变、多行）→ `toDataURL` 转成图片 → 作为水印层 div 的 `background` 平铺。水印层 `pointer-events: none` 不挡任何交互，`zIndex` 默认 `100000` 压在业务之上。

两个设计决策值得展开：

**`forever` 的守护范围刻意收窄**。源码注释写明：「forever 只守护水印节点是否仍在宿主中，不监听样式篡改，避免递归触发观察器」。MutationObserver 监听的属性越多，水印层自身的样式写入也会触发观察回调，处理不当就是无限循环。安全第一版只做 `childList` 监听 + 节点被删时 `appendChild` 补回。

**`resizeRedraw` 是第二个参数，不是 options 字段**。这是参考实现的签名形状，保持兼容（11 篇会讲这类「兼容痕迹」）。开启后窗口 resize 时按防抖节奏重设水印层宽高——水印层尺寸是按宿主 `clientWidth/Height` 算的，宿主尺寸变了不重设就会出现空白区。

## useECharts：adapter 注入第三方实例

签名：`useECharts(target, options): EChartsController`。核心约束写在类型上——`options.echarts` 是必传的 `EChartsAdapter`：

```tsx
import * as echarts from "echarts";

const chartRef = useRef<HTMLDivElement>(null);
const chart = useECharts(chartRef, {
  echarts: { init: (el, theme) => echarts.init(el, theme) },
});

chart.setOptions({ xAxis: { type: "category", data: ["A", "B"] }, yAxis: {}, series: [{ type: "bar", data: [1, 2] }] });
```

本包不 `import echarts`——它只声明了 `EChartsInstance` 最小接口（`setOption`/`resize`/`dispose`/`on` 等方法签名）和 `EChartsAdapter`（一个 `init` 方法），真实实例由调用方注入。这是依赖倒置的直接应用：hooks 依赖抽象，echarts 依赖具体，主包因此保持零第三方依赖，换图表库或按需引入 echarts 模块都不受影响。契约细节也值得一看：`setOptions` 默认先 `clear` 再 `setOption`（可用 `option.clear: false` 关闭）；卸载时 `off()` 清事件、`dispose()` 销毁实例（06 篇盘点过）；实例方法分「可选代理」（实例不存在时静默跳过）和「严格代理」（`getDom`/`getWidth` 等要求实例存在，否则按契约抛运行时错误）。

## 自查清单

- [ ] 能说出「命令式出口」的判断标准，以及哪些操作适合放进 controller
- [ ] 知道 useResizeObserver 的 immediate 首次通知为什么是手动构造的
- [ ] 能解释 useScrollTo 的 start/stop 纪律为什么值得保留
- [ ] 能复述拖拽的边界数学和 rAF 合并 mousemove 的动机
- [ ] 知道水印 forever 的守护范围为什么刻意收窄
- [ ] 能画出 useECharts 的依赖方向：hooks → 抽象接口 ← echarts 实现
