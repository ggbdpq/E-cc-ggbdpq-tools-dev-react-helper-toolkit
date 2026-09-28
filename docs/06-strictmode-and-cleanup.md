# 06 · StrictMode 与副作用清理

> 本篇结论：React 18 的 StrictMode 会在开发环境把组件挂载—卸载—再挂载跑一遍，这是故意的压力测试：所有没写 cleanup 的副作用，在这里都会现出原形。本库 16 个 hooks 全部通过这个测试，靠的是一条统一纪律。读完本篇你理解双挂载机制，能按库内的模式写出 StrictMode 安全的 hook，并能排查生产环境的资源泄漏。

## StrictMode 双挂载是什么

打开 React 18 项目，入口大概是这样：

```tsx
<StrictMode>
  <App />
</StrictMode>
```

开发环境下，StrictMode 里的每个组件经历的真实生命周期是：

```
mount（挂载，effect 执行）→ unmount（卸载，cleanup 执行）→ mount（再挂载，effect 再执行）
```

注意第二遍挂载用的是**同一份 state**。这个设计的用意是模拟「组件可能被反复挂载」的现实（未来可复用状态特性、Offscreen 组件都会导致），逼你把每个 effect 的 cleanup 写完整。**生产环境没有双挂载**，但——

**误解：「双挂载只在开发环境，生产没事，cleanup 可以不写。」** 生产环境没有双挂载，但有卸载：路由切换、条件渲染、弹窗关闭。没清理的定时器和监听器在生产里照样泄漏，而且因为没有 StrictMode 提前报错，往往上线很久才被发现——表现为页面越用越卡、接口被重复调用、卸载后的组件还在改 state。StrictMode 是免费的泄漏检测器，不是麻烦制造者。

## 双挂载下会翻车的代码

用轮询举例：

```tsx
// ❌ 双挂载后：两个 interval 同时在跑
useEffect(() => {
  const id = setInterval(poll, 5000);
  // 没有 return cleanup
}, []);
```

StrictMode 下的执行序列：挂载 → interval A 启动 → 卸载 → interval A 还在跑 → 再挂载 → interval B 启动。现在每 5 秒 poll 两次，接口双倍负载。修复只需一行：

```tsx
useEffect(() => {
  const id = setInterval(poll, 5000);
  return () => clearInterval(id); // 卸载时回收
}, []);
```

第二遍挂载前，interval A 被 cleanup 清掉，系统里永远只有一个活跃 interval。

## 库内清理模式盘点

把这个库所有 hooks 的「注册了什么、卸载时怎么清理」列成一张表——这本身就是一份「React 副作用类型大全」：

| Hook | 注册的副作用 | 卸载时的清理 | 源码位置 |
|---|---|---|---|
| `useTimeout` / `useInterval` | 定时器 | `clearTimeout` / `clearInterval` | `hooks/useTimeout.ts:19` |
| `useEventListener` | DOM 事件监听 | `removeEventListener` | `hooks/useEventListener.ts:71` |
| `useClickAway` | document 级多事件监听 | 逐个解绑 | `hooks/useClickAway.ts:70` |
| `useDark` | MutationObserver | `disconnect()` | `hooks/useDark.ts:39` |
| `useDebounceFn` / `useThrottleFn` | 防抖/节流实例 | `cancel()` 丢弃 pending 任务 | `hooks/useDebounceFn.ts:51` |
| `useLoader` | DOM 中的 link/script 节点 | 节点 `remove()` | `hooks/useLoader.ts:81` |
| `useResizeObserver` | ResizeObserver | `disconnect()` + 取消防抖 | `hooks/useResizeObserver.ts:51` |
| `useScrollTo` | requestAnimationFrame | `cancelAnimationFrame` | `hooks/useScrollTo.ts:102` |
| `useDraggable` | mousemove/mouseup 监听 + 动画帧 | 解绑 + 取消帧 + 移除 resize 监听 | `hooks/useDraggable.ts:142` |
| `useWatermark` | 水印 DOM 节点 + MutationObserver + resize 监听 | 移除节点 + 断开观察 | `hooks/useWatermark.ts:138` |
| `useECharts` | echarts 实例 + resize 监听 | `off()` 事件 + `dispose()` 实例 | `echarts/useECharts.ts:178` |

浏览器能注册的异步资源种类，一张表全部覆盖：定时器、事件监听、观察器（MutationObserver / ResizeObserver）、动画帧、DOM 节点、第三方实例。规律完全一致：**谁注册，谁在 cleanup 里反向注销**。

## 两个进阶清理场景

**场景一：清理的不是 effect 自己创建的东西。** `useLoader` 的节点是调用 `loadCss()` 时才创建的，不在 effect 里。它的解法是实例级记账——`useRef` 持有一个 `Set<Element>`，每次加载都往里记，effect 的 cleanup 统一销毁：

```ts
// hooks/useLoader.ts（节选）
const ownedElements = useRef(new Set<Element>());

useEffect(() => {
  const elements = ownedElements.current;
  return () => {
    if (destroy) for (const element of elements) element.remove();
    elements.clear();
  };
}, [destroy]);
```

这打破了「cleanup 只清理本 effect 创建的资源」的直觉，但记账模式让「实例生命周期」和「资源创建时机」解耦。命令式 API（返回 controller 的 hooks）几乎都需要这个模式。

**场景二：实例是惰性创建的，卸载时可能存在也可能不存在。** `useECharts` 的实例在第一次 `setOptions` 时才创建。它的卸载清理全部写成可选链：

```ts
// echarts/useECharts.ts（节选）
useEffect(() => {
  return () => {
    const instance = instanceRef.current;
    instance?.off();
    instance?.getZr().off();
    instance?.dispose();
    instanceRef.current = null;
  };
}, []);
```

注意最后一行 `instanceRef.current = null`：把引用也清掉，避免极端情况下残留的实例引用阻碍 GC。清理要清干净——资源、监听、引用三个层面。

## 手写一个 StrictMode 安全的 hook

把库的模式提炼成一个可直接套用的模板。需求：一个 `useHeartbeat` hook，每秒触发一次回调：

```tsx
import { useEffect, useMemo } from "react";
import { usePersistFn } from "./usePersistFn";

export function useHeartbeat(onBeat: () => void, intervalMs = 1000) {
  const beat = usePersistFn(onBeat); // 回调实时最新

  const start = useMemo(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    return {
      open() {
        if (id !== null) return;
        id = setInterval(beat, intervalMs);
      },
      close() {
        if (id !== null) clearInterval(id);
        id = null;
      },
    };
  }, [beat, intervalMs]);

  useEffect(() => {
    controller.open();
    return () => controller.close(); // 挂载与清理严格配对
  }, [controller]);

  return controller;
}
```

模板的三个要点，全部来自库内既有模式：

1. **可变状态（id）锁在 useMemo 里**，不放组件作用域——双挂载会创建新实例，但旧实例的 close 已经被 cleanup 调过，两代实例互不干扰；
2. **注册与清理写在同一个 effect 里**，open/close 共享同一个 `id` 变量，不存在「清错对象」的可能。注意别写成 `useEffect(() => controller.open, [])`——箭头函数体里只写了函数名而不调用，React 会把这个函数引用当作 cleanup，挂载时什么都不执行；
3. **业务回调经 `usePersistFn`**，调用方改回调不会重启心跳。

写完先跑 StrictMode 验证：开发环境 `index.tsx` 确认包着 `<StrictMode>`，然后打开 React DevTools 的 Profiler 看组件是否挂载了两次——两次之后功能依然正确、资源依然单份，才算过关。

## 泄漏排查速查

接手老代码时按这张表反查：

| 症状 | 先查什么 |
|---|---|
| 接口被重复调用，越用越多 | 定时器/轮询有没有 cleanup；事件重复绑定 |
| 切页后接口还在打 | 卸载路径是否漏了 `clearInterval` / 取消请求 |
| 内存随操作次数增长 | 监听器、Observer 是否解绑；第三方实例是否 dispose |
| 卸载后才返回的异步回调还在改 state（React 18 已移除控制台警告，问题依旧存在） | 异步回调里 setState，卸载时没有中止任务（配合 07 篇的 CancelToken） |

## 自查清单

- [ ] 能复述双挂载的执行序列和它的设计用意
- [ ] 能说出「生产没有双挂载但照样泄漏」的原因
- [ ] 脑中有那张副作用类型表：定时器、监听、观察器、动画帧、DOM 节点、实例，六类各有对应的清理 API
- [ ] 能用模板独立写出一个 StrictMode 安全的 hook
- [ ] 知道记账模式（useRef + Set）适用于「资源创建时机不固定」的命令式 hook
