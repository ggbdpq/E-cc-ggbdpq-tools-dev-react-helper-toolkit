# 10 · 子路径导出与构建

> 本篇结论：这个库能让 Node 脚本只加载 2KB 的路径工具、让浏览器项目完全不接触 Node API，靠的是 `package.json` 的 exports 子路径映射 + tsup 的按文件入口构建 + `sideEffects: false` 的 tree-shaking 兜底。读完本篇你能看懂这三个机制各自的职责边界，并能判断自己的库该不该做子路径、怎么验证产物。

## 问题：一个入口装不下三类运行环境

假设所有东西都从主入口导出，会发生什么：

```ts
// Node 脚本只想用路径转换
import { convertPath } from "react-helper-toolkit";
// ❌ 实际加载了：全部 16 个 hooks（连带 react peer）+ browser 工具（连带 window 访问）
```

Node 端被迫拉进 React 和浏览器代码；反向更糟——浏览器项目一旦碰到 `node/packageSize.ts`（读文件系统算体积），打包直接报错或产物暴涨。**入口的粒度决定了依赖的隔离性**，子路径导出就是把「按环境取用」变成包层面的契约。

## exports 映射逐条拆

`package.json` 的完整导出契约：

```jsonc
{
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.mts",
  "exports": {
    ".": {                    // 主入口：core + hooks + 适配契约
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./utils/*": {            // 20 个通用工具，一文件一路径
      "types": "./dist/utils/*.d.mts",
      "import": "./dist/utils/*.mjs",
      "require": "./dist/utils/*.js"
    },
    "./browser/*": { "...": "..." },  // 9 个浏览器工具
    "./node/*": { "...": "..." },     // 2 个 Node 工具
    "./echarts": { "...": "..." }     // 图表 hook
  }
}
```

四个要点：

1. **`exports` 是白名单**。它生效后，包外只能 import 列出的路径——`react-helper-toolkit/src/utils/url` 这类「抄近道」会被 Node 和打包器直接拒绝。包的公共表面从此由 exports 定义，源码目录结构变成实现细节。
2. **`*` 通配符保持映射关系**。`import ... from "react-helper-toolkit/utils/url"` 按模式落到 `dist/utils/url.mjs`，一个模式覆盖 20 个文件。
3. **双条件双格式**。`import` 条件给 ESM（`.mjs`），`require` 给 CJS（`.js`），Node 和打包器按自己的模块系统自动选。`main`/`module`/`types` 三个顶层字段是给不认识 `exports` 的老工具链的兼容兜底。
4. **`types` 排在每个条件组首位**。TypeScript 按「exports 里第一个匹配的条件」找类型声明，`types` 声明放前面才能被正确解析。

## tsup：按文件构建，子路径才有东西可指

exports 声明的每个 `dist/utils/*.mjs` 都必须真实存在，这由 `tsup.config.ts` 的入口配置保证：

```ts
export default defineConfig({
  entry: [
    "src/index.ts",           // 主入口
    "src/utils/*.ts",         // 20 个工具各自成块
    "src/browser/*.ts",       // 9 个浏览器工具
    "src/node/*.ts",          // 2 个 Node 工具
    "src/echarts/index.ts",   // 图表 hook
  ],
  dts: true,        // 生成 .d.mts 类型声明
  treeshake: true,  // 产物级摇树
  format: ["esm", "cjs"],
  minify: true,
  external: ["react", "react-dom"],
  splitting: false, // 不抽公共 chunk，保证单文件子路径自足
});
```

`entry` 用 glob 展开后，每个源文件产出独立的 `.mjs` + `.js` + `.d.mts` 三件套，与 exports 的通配符一一对应。两个选项的选择理由：

- **`splitting: false`**：ESM 代码分割会把共享代码抽成 chunk，子路径文件之间产生相互引用。关掉 splitting，每个子路径都是自足的单文件——加载 `utils/url` 时不会连带加载其他 util。
- **`external: ["react", "react-dom"]`**：React 是 peerDependency，绝不打进产物，交给消费方提供。

构建后验证产物结构：

```bash
pnpm build && ls dist dist/utils | head -20
# 预期：dist/ 下有 index.mjs/index.js/index.d.mts，dist/utils/ 下每个源文件对应三件套
```

## sideEffects：tree-shaking 的开关

就算都从主入口导入，`"sideEffects": false` 也给打包器发了通行证：**这个包的任何模块都没有「import 即生效」的副作用**（不改全局变量、不注册全局监听、不执行顶层 DOM 访问），没被引用的导出可以安全删除。

```ts
import { useLatest } from "react-helper-toolkit";
// 打包器：useLatest 没用到 core 里的 event-emitter → 删
// 最终 bundle 只含 useLatest 的依赖闭包
```

这个声明要对包的行为负全责。检查一遍源码可以确认它成立：所有模块都是纯声明，顶层唯一的「执行」是 `useWatermark.ts` 里的 `let watermarkId = 0`（模块级计数器）——它只影响模块内部行为，不与外部世界交互，属于可安全摇树的范畴。

**误解：「有 sideEffects: false 就不需要子路径导出了。」** tree-shaking 只在打包环节生效，且只对**打包器可见的引用图**起作用。三个缺口它堵不住：Node 的 CommonJS `require`（无打包、无摇树）、运行时动态 import、以及最关键的——**摇树能删掉没用到的代码，却删不掉「被引用但环境不该有」的代码**。Node 脚本 import 主入口里任何一个 hook，摇树后 hooks 还在，React 引用也还在。子路径管「哪些代码可能被加载」（环境隔离），摇树管「加载的代码里哪些没用」（体积优化），两者是不同维度。

## 决策框架：我的库要不要做子路径

| 你的情况 | 建议 |
|---|---|
| 全部代码面向同一环境（纯 React hooks，无 Node/浏览器分裂） | 主入口 + sideEffects: false 足够 |
| 存在特定环境才能用的模块（Node fs、浏览器 DOM） | 至少按环境拆子路径，这是隔离刚需 |
| 工具数量多且单件体积差异大 | 子路径 + 按文件入口，给极致按需的消费者 |
| 核心逻辑与框架封装分层 | core 单独成路径或单独发包，复用面完全不同 |

本库是「环境分裂 + 分层」的双料情况，所以子路径开到了四组。

## 发布视角的完整清单

`package.json` 里与发布质量相关的字段，这个库的取值与理由：

| 字段 | 取值 | 理由 |
|---|---|---|
| `files` | `["dist"]` | 只发布产物，源码和测试不进包 |
| `sideEffects` | `false` | 打包器可放心摇树 |
| `peerDependencies` | `react >= 16.8` | 宿主提供 React，避免双实例 |
| `exports` 条件组 | types 优先，import/require 并列 | 类型解析 + 双模块格式 |
| `main`/`module`/`types` | 顶层兜底 | 兼容不识别 exports 的工具链 |

发布前验证：`pnpm check`（闸门）→ `pnpm build`（产物）→ `npm pack --dry-run`（确认包内容只有 dist）→ 在临时目录 `npm i <tarball>` 用三种导入方式各跑一次。

## 自查清单

- [ ] 能说出 exports 白名单、双条件、types 优先三个机制各自解决什么问题
- [ ] 知道 tsup 为什么 entry 用 glob、为什么 splitting 关掉
- [ ] 能向同事讲清「子路径管环境隔离，摇树管体积」的分工，以及摇树的三个盲区
- [ ] 会用 `npm pack --dry-run` 和 `ls dist` 验证发布物
