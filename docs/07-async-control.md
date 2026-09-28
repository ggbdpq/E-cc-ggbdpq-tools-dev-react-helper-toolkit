# 07 · 异步控制：锁、取消与事件

> 本篇结论：异步代码的三大失控场景——重复触发、无法反悔、完成时无人认领——在本库里各有对应武器：`useLockFn` 管互斥，`createCancelToken` 管取消，`createEventEmitter` 管「完成后通知所有关心的人」。读完本篇你能为表单提交、过期请求、模块间通信选对工具，并理解它们的实现为什么这样设计。

## 场景一：防重复提交 —— useLockFn

用户的经典操作：点击「提交」，网络转圈，没反应，再点三下。结果订单建了四条。

```tsx
function SubmitButton({ form }: { form: FormData }) {
  const submit = useLockFn(async (data: FormData) => {
    await api.post("/orders", data);
    message.success("提交成功");
  });

  return <button onClick={() => submit(form)}>提交</button>;
}
```

签名：`useLockFn<TArgs, TResult>(fn: (...args: TArgs) => Promise<TResult>): (...args: TArgs) => Promise<TResult | undefined>`。

三个契约细节（JSDoc 和 core 实现里写明的）：

1. **执行期间再次调用直接忽略**，返回 `undefined`——不会排队，也不会抛错，调用方无须 try/catch 这个「正常情况」；
2. **无论成功还是异常，锁都会释放**（core 层 `try/finally` 保证），不会出现「一次报错永久锁死按钮」；
3. 返回的函数引用稳定（`usePersistFn` 包装），可以放进 `useEffect` 依赖或传给子组件。

它和 02 篇防抖的分工：防抖管「触发频率」（连续点击只留最后一次），锁管「执行互斥」（上一次没结束前忽略新的）。按钮防连点两者都行，但异步提交必须用锁——防抖只延迟触发，挡不住「第一次还没返回时第二次已执行」。

**误解：「把按钮 `disabled` 掉就够了。」** `disabled` 只挡住这一个按钮，挡不住回车键提交、挡不住其他入口调用同一个函数。锁加在函数上，所有调用入口一次管住；`disabled` 的视觉反馈照常做，两者配合而不是二选一。

## 场景二：让请求作废 —— createCancelToken

另一个高频 bug：输入框连续搜索，「re」的请求比「react」的后返回，旧结果覆盖新结果。

```tsx
function Search({ keyword }: { keyword: string }) {
  const [results, setResults] = useState<Item[]>([]);
  const tokenRef = useRef<CancelToken | null>(null);

  useEffect(() => {
    tokenRef.current?.cancel("superseded"); // 上一次搜索作废
    const token = createCancelToken();
    tokenRef.current = token;

    fetch(`/api/search?q=${keyword}`, { signal: token.signal })
      .then((res) => res.json())
      .then((data) => setResults(data))
      .catch((e) => {
        if (token.isCancelled) return; // 主动作废，不当中文名称的错误处理
        throw e;
      });
  }, [keyword]);

  return <List items={results} />;
}
```

签名：`createCancelToken(): { signal: AbortSignal; cancel(reason?: string): void; isCancelled: boolean }`。

相比裸用 `AbortController`，包装的价值在 `isCancelled` 这个语义出口：catch 里区分「我主动取消的」和「真的出错了」，前者静默，后者上报。取消原因有默认值 `"Cancelled"`，重复 cancel 不会覆盖第一次的原因。

这个模式同时解决 06 篇结尾的警告：组件卸载时把进行中的请求 cancel 掉，「卸载后 setState」从根上消失。把 `tokenRef.current?.cancel()` 放进 effect 的 cleanup 即可。

## 场景三：完成时通知所有人 —— createEventEmitter

跨模块解耦的常见需求：用户信息更新后，顶栏、侧边栏、权限模块都要知道。逐个调用 setter 会把「通知方」和「被通知方」焊死在一起。

```ts
type AppEvents = {
  "user:updated": UserProfile;
  "user:logout": void;
};

const bus = createEventEmitter<AppEvents>();

// 任何模块订阅
bus.on("user:updated", (user) => sidebar.refresh(user));
bus.on("user:updated", (user) => permission.reload(user));

// 登录流程只管发布
bus.emit("user:updated", profile);

// 只关心第一次
bus.once("user:logout", () => redirect("/login"));

// 组件卸载记得退订
const handler = (user: UserProfile) => track(user);
bus.on("user:updated", handler);
bus.off("user:updated", handler);
```

事件名和载荷都受 `AppEvents` 约束，写错在编译期报错（04 篇已介绍它的 emit 快照实现）。这里补一个使用纪律：**订阅方必须在适当时机 `off`**。React 场景下订阅通常发生在 `useEffect` 里，cleanup 里对应 `off`——又回到 06 篇的「谁注册谁注销」纪律。`bus.clear()` 清空全部订阅，适合应用级销毁。

## 三个工具怎么组合

真实的业务往往是三者叠加。一个「自动保存」功能：

```tsx
function useAutoSave(docId: string) {
  const save = useLockFn(async (content: string) => {
    const token = createCancelToken();
    cancelRef.current?.cancel("newer-save");
    cancelRef.current = token;
    await api.put(`/docs/${docId}`, content, { signal: token.signal });
    bus.emit("doc:saved", { docId, at: Date.now() });
  });
  // save 自动互斥；旧保存请求自动作废；保存完成广播给状态栏
  return save;
}
```

锁挡住并发保存，token 作废仍在途的旧请求，事件通知关心「最近保存时间」的组件。每个工具职责单一，组合不产生纠缠。

## 选型决策表

| 症状 | 工具 | 一句话理由 |
|---|---|---|
| 按钮可被连点，接口重复提交 | `useLockFn` | 函数级互斥，覆盖所有调用入口 |
| 旧请求晚到覆盖新结果 | `createCancelToken` | 让过期请求作废而不是白白等它 |
| 卸载后 setState 警告 | `createCancelToken` + cleanup | 卸载时中止在途请求 |
| 一个变化要通知多个模块 | `createEventEmitter` | 发布订阅解耦通知方与被通知方 |
| 高频触发只想留最后一次 | `useDebounceFn`（02 篇） | 频率问题用流控，互斥问题用锁 |

**误解：「有了 EventEmitter 就不需要 state 管理，全局状态都用它广播。」** 事件总线传递的是「发生了什么」的通知，不是「现在是什么」的状态。订阅方拿到通知后仍需要可靠的状态来源，否则事件顺序、订阅时机都会成为 bug 温床。事件管通知，state 管现状，各司其职。

## 自查清单

- [ ] 能说出 useLockFn 的三个契约（忽略不排队、finally 释放、引用稳定）
- [ ] 能写出「取消上一次搜索」的完整模式，并解释 isCancelled 在 catch 里的作用
- [ ] 知道事件订阅必须配对退订，以及 clear 的适用场景
- [ ] 能为五个症状各选对工具，说清锁与防抖的分工
