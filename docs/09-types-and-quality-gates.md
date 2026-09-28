# 09 · 类型工程与质量闸门

> 本篇结论：这个库的公共 API 签名由两类自动化测试把守——运行时行为交给 vitest 单测，编译期类型交给「类型级测试」。两者合成一条命令 `pnpm check`。读完本篇你能读懂并编写 `Expect<Equal<...>>` 类型断言，理解 `DebouncedFn<T>` 泛型为什么这样设计，并能给自己的项目搭出同款质量闸门。

## 为什么类型也需要测试

先看一个没有类型测试时会发生的事故。假设有人把 `useDebounceFn` 的返回类型从泛型改成宽泛的函数类型：

```ts
// 改动前：参数类型保留
const debounced = useDebounceFn((keyword: string) => save(keyword));
debounced("hello"); // ✅ string

// 改动后：有人"简化"成 (...args: any[]) => void
const debounced = useDebounceFn((keyword: string) => save(keyword));
debounced(123); // ❌ 编译器不报错了，运行时才炸
```

单测抓不住这类改动——单测只验证运行时行为，而类型损伤发生在编译期。类型测试的职责就是**把「签名单向劣化」变成编译错误**。

## Expect / Equal：类型级断言的机械原理

`src/type-tests/` 下 8 个 `*.typecheck.ts` 文件共用两个基础工具（`type-tests/foundation-utils.typecheck.ts:8`）：

```ts
type Equal<TLeft, TRight> =
    (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2
        ? true
        : false;
type Expect<T extends true> = T;
```

用法：

```ts
type DelayResult = Expect<Equal<ReturnType<typeof delay>, Promise<void>>>;
```

这行代码没有任何运行时产物，它做的事是**让编译器在编译期验证一个类型等式**：`delay` 的返回类型必须与 `Promise<void>` 完全相等，否则 `Equal` 结果为 `false`，`Expect<false>` 违反约束 `T extends true`，编译报错。

两个组件分别拆开看：

**Equal 为什么绕两个弯**。直接写 `TLeft extends TRight` 太宽松：`any` 与任何类型互相兼容、`{ a: 1 }` 和 `{ a: 1, b?: undefined }` 也会通过。两层的条件类型包上了一个未绑定的泛型参数 `T`，TypeScript 对这种「内部类型未解析」的函数签名做**同一性比较**——只有两个类型在内部表示完全一致才判 true。这是社区通行的严格相等写法（type-challenges 项目同款）。

**Expect 是断言的「目的地」**。`Expect<T extends true> = T` 唯一的作用是要求入参必须是 `true` 字面类型。任何断言失败都表现为「类型不满足约束」的编译错误。

配合负向断言——`@ts-expect-error` 声明「下一行必须报错」，如果有人把错误也修没了，这行反而会报「未用到的 @ts-expect-error」：

```ts
// @ts-expect-error amount options digit 必须是 number。
priceToThousands(100, { digit: "2" });
// @ts-expect-error Coordinate 只包含两个数字。
const invalidCoordinate: Coordinate = [1, 2, 3];
```

正例锁「该过的过」，负例锁「该挡的挡」。类型测试的完整形态就是这两类断言的组合。

## 这些测试怎么被纳入检查

`tsconfig.json` 的 `exclude` 只排除了 `**/*.test.ts`，**typecheck 文件参与 `tsc --noEmit`**。所以 `pnpm typecheck` 一跑，全部类型断言得到验证。文件末尾的 `export type` 不是装饰——没有导出的类型断言在某些配置下可能被裁剪，导出一个合成类型确保文件被当作模块完整检查。

再配 vitest 与 jsdom 跑运行时行为（`vitest.config.mts`：`environment: "jsdom"`，扫描 `src/**/*.test.{ts,tsx}`），hooks 的测试用 `@testing-library/react` 的 `renderHook` + `act`。看一个真实断言（`hooks/__tests__/ported-hooks.test.ts`）：

```ts
it("监听 class 并切换暗色状态", async () => {
    const { result } = renderHook(() => useDark());
    expect(result.current.isDark).toBe(false);
    act(() => result.current.toggleDark());
    await act(async () => Promise.resolve());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(result.current.isDark).toBe(true);
});
```

注意它断言的是**真实 DOM 副作用**（`documentElement.classList`），而不只是 hook 返回值——副作用型 hook 的测试必须落到 DOM 上才算数。

## 泛型设计：DebouncedFn<T> 怎么保住参数类型

防抖函数最难的不是运行时，是类型：包装一层之后怎么让调用方还能拿到正确的参数检查。库的答案（`core/debounce.ts:1`）：

```ts
type AnyFunction = (...args: never[]) => unknown;

export interface DebouncedFn<T extends AnyFunction> {
    (...args: Parameters<T>): void;
    cancel(): void;
    flush(): void;
}

export function createDebouncedFn<T extends AnyFunction>(
    fn: T,
    wait = 1000,
    options: DebounceOptions = {},
): DebouncedFn<T> {
```

两个关键选择：

**约束为什么是 `never[]`**。函数参数位置是逆变的：`(...args: never[]) => unknown` 是「接受任何参数都能调」的超类型，任何具体函数都能赋给它。用 `any[]` 做不到这一点吗？能，但 `any` 会污染推导链——后续 `Parameters<T>` 一旦经过 `any` 就失去检查。`never[]` 让所有函数都满足约束，同时 `Parameters<T>` 依然还原出真实参数元组。这是「约束要宽、推导要准」的配合。

**返回值为什么丢弃成 `void`**。`debounce(fn)` 的返回值没有意义——你不知道它什么时候真正执行，把 `T` 的返回类型透传出去等于承诺一个时机不明的值。丢弃并写成 `void` 是诚实的类型（对比 `utils/debounce.ts` 的 `DelayedFunction` 注释：「不暴露返回值的延迟调用函数」）。

同款模式贯穿 core 层：`ThrottledFn<T>`、`EventEmitter<T>` 的事件映射、`AsyncLock.run` 的双泛型（参数元组 + 结果类型），都是「泛型进、精确类型出」。

## pnpm check：三段式闸门

```bash
pnpm check   # = tsc --noEmit && vitest run && tsup
```

三段各把一道关，顺序有讲究：

| 阶段 | 检查内容 | 失败示例 |
|---|---|---|
| `tsc --noEmit` | 业务代码 + 8 个类型测试文件的类型正确性 | 改坏了公共签名、类型断言失效 |
| `vitest run` | 全部运行时行为 | 防抖边界算错、清理逻辑遗漏 |
| `tsup` | 产物可构建、dts 可生成 | 类型引用断裂、入口缺失 |

类型检查放最前：它最快，且类型崩了单测必然崩，早失败省时间。任何贡献（哪怕是改注释）合入前都过这一条命令。

## 给自己的项目搭同款闸门

最小可用配置四步：

1. 建 `src/type-tests/` 目录，写一个带 `Equal`/`Expect` 的 `.typecheck.ts`，对公共 API 做正例断言；
2. 给最危险的误用场景加 `@ts-expect-error` 负例（参数类型、必填字段、枚举值）；
3. 确认 `tsconfig.json` 的 include 覆盖这些文件（不要 exclude 掉）；
4. package.json 里加 `"check": "tsc --noEmit && vitest run && build命令"`，让它成为 CI 的唯一门禁。

维护纪律只有一条：**每次改公共 API，先改类型测试再改实现**——让断言先红，再看着它变绿，确定你改的签名正是你想要的签名。

## 自查清单

- [ ] 能向同事解释 Equal 的双层条件类型为什么比 `extends` 严格
- [ ] 知道 @ts-expect-error 的双向作用（断言报错存在，也断言报错不消失）
- [ ] 能说出 AnyFunction 约束用 never 而不用 any 的原因
- [ ] 理解 pnpm check 三段的顺序逻辑
- [ ] 在自己的项目里至少写出一个类型断言并跑通
