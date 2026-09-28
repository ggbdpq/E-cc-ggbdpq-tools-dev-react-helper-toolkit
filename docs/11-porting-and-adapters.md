# 11 · 移植方法论与适配器设计

> 本篇结论：这个库有两位「老师」——一位是被系统性移植的 Vue 工具库 pure-admin-utils（行为的来源），一位是 ahooks 风格的社区 API（接口的参照）。本篇拆解它怎么做到「行为忠实移植、工程表达重写」，哪些能力明确拒绝移植，以及 adapter 模式怎么把 UI 框架和图表库挡在包外。读完本篇你能掌握一套可复用的跨框架移植方法，并能按 checklist 给本库贡献新 hook。

## 移植的总原则：行为忠实，表达重写

对照同一函数的两个版本，最能看清这条原则。原版（Vue 参考项目 `pure-admin-utils` 的 `utils/space.ts`）：

```ts
/**
 * @description 去掉字符串左边空格
 * @param str 字符串
 * @returns 去掉左边空格后的字符串
 * @see 详细文档 https://pure-admin-utils.netlify.app/utils/space/space#removeleftspace
 */
export const removeLeftSpace = (str: string): string => {
  return str.replace(/^\s*/, "");
};
```

本库版本（`src/utils/space.ts`）：

```ts
const LEADING_WHITESPACE = /^\s*/;

/** 删除字符串左侧的全部空白字符 */
export function removeLeftSpace(text: string): string {
    return text.replace(LEADING_WHITESPACE, "");
}
```

函数名、正则、行为完全一致；变化的全部是工程表达：

| 维度 | 原版 | 本库 |
|---|---|---|
| 注释 | `@see` 外链文档 | 自足的中文契约（不依赖外部站点存活） |
| 正则 | 内联在函数体 | 提升为模块常量（免重复创建，且有名字） |
| 函数形态 | 箭头函数 | 函数声明（可读的 hoisting 与命名栈帧） |
| 行为 | —— | 逐字符一致，由单测锁定 |

移植中最容易犯的两个方向性错误，这里都有解药。错误一是**连表达一起抄**：把外链注释、内联魔数原样搬来，移植完成后代码库里多出一个「说外语的飞地」。错误二是**顺手改行为**：「这个正则看起来可以优化一下」——一旦行为偏离参考实现，参考实现积累的边界处理（往往是生产环境踩坑换来的）就全部作废。本库的解法是**行为差异必须显式声明**，后面会看到「保留但不用」的字段是怎么标注的。

## 迁移边界：明确说「不」的清单

Vue hooks 不是都能「翻译」成 React hooks 的。README 的「Vue Hook 迁移边界」一节列出了硬边界：

| Vue 能力 | 不移植的理由 | React 的对应做法 |
|---|---|---|
| `useAttrs` | attrs 是 Vue 的响应式透传概念，React 里没有对应物 | 直接用 props；需要过滤用对象解构或纯函数 |
| `useDynamicComponent` | 服务 Vue 的动态组件注册机制 | 组件注册表或 `React.lazy` |
| `useGlobal` | 服务 Vue 的 globalProperties | `createContext` + `useContext` |
| `install.ts` | 只服务 Vue 的 `app.use`/`app.component` 安装生命周期 | React 没有等价生命周期，无可移植语义 |

这四条的共同判据：**Vue 语义在 React 里没有原生对应物时，不做伪 hook**。硬翻译的产物是「名字像 hook、行为像框架补丁」的四不像——用 React 的心智模型理解不了它，出问题时两套心智模型互相打架。宁可不留，也不留错的。

## 兼容痕迹：给「来历」留证据

移植工程有个反直觉的决定：有些「看起来该删」的东西被刻意保留了。在源码里能找到三类痕迹：

**痕迹一：中文状态消息。** `useLoader` 的 `LoadResult.message` 类型是 `"加载成功" | "加载失败"`，JSDoc 注明「与参考实现兼容的中文加载状态」。按「UI 无关」原则，状态文案不该出现在工具库里，但下游如果已经按参考实现的文案做了判断，改掉就是一次破坏性升级。

**痕迹二：DOM id 前缀。** `useLoader` 给动态节点起的 id 是 `pure-utils-${type}-${Date.now()}-${resourceId++}`——`pure-utils` 这个前缀来自参考项目的旧名，是整条移植链的活化石。

**痕迹三：保留但不用。** `useWatermark` 的 options 里有三个字段被明确标注：「`image`：保留的参考实现字段；当前版本不会绘制该图片」。类型上保留（下游代码不报错），实现上不执行（不承诺行为），文档上声明（不误导用户）。

这三类痕迹共享一个原则：**兼容性是显式决策，而非无意的累加**。每一处都带着注释说明来历和现状，后来者不会误以为是活跃功能去依赖它，也不会误以为是垃圾把它删掉。

两套防抖的并存（04 篇讲过）也是同一逻辑的延伸：移植来的 hooks（拖拽、水印）用参考行为基线的 `utils/debounce`，新写的 hooks 用工程可控的 `core/debounce`——**用哪个实现本身就在标注代码的来历**。

## adapter：把第三方世界挡在包外

库对「外部世界」的两类依赖，用了同一套解法：**库定义接口，调用方注入实现**。

第一类是 UI 框架。`src/integrations/index.ts` 只定义契约，没有任何实现：

```ts
export interface MessageAdapter {
    info(content: string): void;
    success(content: string): void;
    warning(content: string): void;
    error(content: string): void;
}

export interface ThemeToken {
    colorPrimary: string;
    colorBgBase: string;
    colorTextBase: string;
    borderRadius: number;
    fontFamily: string;
    [key: string]: string | number; // 允许 UI 框架透传额外令牌
}

export interface ThemeAdapter {
    getToken(): ThemeToken;
    setTheme(theme: "light" | "dark" | string): void;
}
```

`ThemeToken` 的索引签名值得注意：契约只约束五个最小字段，Ant Design 的 token、shadcn 的 CSS 变量都能装进来——**最小接口 + 透传通道**，既不绑架具体框架，也不把扩展性堵死。

第二类是图表库。08 篇讲过 `useECharts` 的 `EChartsAdapter`：库声明 `EChartsInstance` 最小接口和 `init` 适配器，echarts 实例由调用方注入。两者的依赖方向是一致的：

```
┌─────────────┐      实现        ┌──────────────┐
│ Ant Design   │ ──────────────▶ │ MessageAdapter │ ◀────── 依赖抽象
└─────────────┘                  └──────────────┘           ▲
┌─────────────┐      实现        ┌──────────────┐           │
│   echarts    │ ──────────────▶ │ EChartsAdapter │ ──────────┘
└─────────────┘                  └──────────────┘   react-helper-toolkit
```

这就是依赖倒置：高层模块（hooks）和低层模块（UI 库、图表库）都依赖抽象（adapter 接口）。收益在 10 篇的构建数据里已经兑现——主包零第三方运行时依赖，`echarts` 甚至不在 dependencies 里，只有用到那个子路径的人才自己安装它。

## 中文契约：文档即验收标准

每个公开导出的 JSDoc 都按同一规范书写，以 `core/async-lock.ts` 为例：

```ts
/**
 * 同一时刻最多执行一个异步任务的轻量锁。
 *
 * 锁定期间再次调用 `AsyncLock.run` 会被直接忽略，并返回 `undefined`。
 */
export interface AsyncLock {
    /**
     * 在锁未占用时执行异步函数，执行期间其它 `run` 调用将被忽略。
     *
     * @param fn - 需要串行保护的异步函数
     * @param args - 透传给 `fn` 的参数
     * @returns 如果成功获取锁则返回函数结果，否则返回 `undefined`
     */
    run<TArgs extends unknown[], TResult>(...): Promise<TResult | undefined>;
    /** 当前是否处于锁定状态 */
    readonly isLocked: boolean;
}
```

规范的四条要求：一句话说清是什么；边界行为写进主注释（「直接忽略，返回 undefined」）；每个参数和返回值单独说明（含默认值，如 `wait - 静默等待时间，单位毫秒，默认 1000`）；保留字段显式标注「保留的参考实现字段；当前版本不会使用」。配合 09 篇的类型测试，契约的上半句由文档承诺、下半句由编译器把守——**文档写了什么，类型就得真的长什么样**。

## 实战：给本库贡献一个新 hook 的完整流程

假设要加一个 `useFps`（实时帧率监测）。按库的纪律走七步：

1. **查边界**：它是不是伪 hook？帧率是真实的浏览器能力，有 React 对应语义（挂载监测、卸载停止），可做。
2. **写 core**（若逻辑框架无关）：`core/fps.ts` 放 `createFpsSampler()` 纯函数工厂，rAF 采样逻辑不碰 React。
3. **写契约注释**：按上文四条规范给 core 和 hook 写中文 JSDoc，边界行为（如标签页后台时 rAF 暂停）写进主注释。
4. **写 hook 接线**：`hooks/useFps.ts`，回调经 `useLatest`/`usePersistFn`，rAF 循环在 effect 里启动、cleanup 里 `cancelAnimationFrame`（06 篇模板）。
5. **补两套测试**：`hooks/__tests__/` 行为单测（jsdom 下 mock rAF）+ `type-tests/` 类型断言（`Expect<Equal<ReturnType<typeof useFps>, FpsController>>`）。
6. **接导出**：`core/index.ts`、`hooks/index.ts`、`src/index.ts` 三处补齐值导出和类型导出。
7. **过闸门**：`pnpm check` 三段全绿；README 的 API 表补一行。

前三步决定「该不该与是什么」，后四步决定「稳不稳」。顺序反过来（先写实现再补契约）是质量滑坡的开始。

## 移植方法论总结

把本库的实践提炼成五条可迁移的原则：

1. **行为基线先行**：先锁定参考实现的边界行为（最好以测试形式），再动手写新实现；行为差异必须显式声明。
2. **表达全面重写**：注释、命名、代码形态向目标工程的规范看齐，不做「说外语的飞地」。
3. **语义边界优先于功能完整性**：目标框架没有对应语义的能力，宁缺毋滥，文档里写清替代做法。
4. **兼容痕迹显式化**：为兼容保留的每个字段、每个常量都注明来历和现状。
5. **抽象挡住外部世界**：第三方框架和 UI 库一律从接口后面进，保持核心零依赖。

## 自查清单

- [ ] 能对照 space.ts 两个版本，说出哪些属于「行为」哪些属于「表达」
- [ ] 能向同事解释四条迁移边界的共同判据
- [ ] 能指出源码里三类兼容痕迹的位置及其注释写法
- [ ] 能画出 adapter 模式的依赖方向图
- [ ] 能按七步 checklist 独立完成一个新 hook 的贡献
