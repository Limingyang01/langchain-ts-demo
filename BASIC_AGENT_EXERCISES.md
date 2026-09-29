# basic_agent.ts 进化练习：从"写诗脚本"到"写诗 Agent"

规则：
- 始终只改 `basic_agent.ts` 这一个文件，每关在上一关的基础上加东西
- 每关做完先跑通，再 `git commit -m "practice: 第 N 关"`，方便回头对比每一步改了什么
- 卡住了先看"参考"列的 demo；做完一关可以把代码发给我 review

| 关卡 | 主题 | 参考 |
| --- | --- | --- |
| 1 | 用链改写 | 02、03 |
| 2 | 流式输出 | 03 |
| 3 | 多角色 Prompt | 09 |
| 4 | Few-shot 稳定格式 | 09 |
| 5 | 结构化输出 | 07 |
| 6 | 一诗多用（并行） | 05 |
| 7 | 批量 + 重试 | 12 |
| 8 | 意图路由 | 11 |
| 9 | 多轮对话记忆 | 04、10 |
| 10 | 工具 + Agent 循环 | 01、08 |
| 11 | 观测每一步 | 13 |

---

## 第 1 关：用链改写

**现状**：手动 `prompt.invoke` → `model.invoke`，拿到的 `content` 还可能不是字符串。

**要求**
- 把 `topC` 改成有意义的名字（如 `poet`），再加一个变量 `theme`（主题，如"思乡""送别"）
- 用 `prompt.pipe(model).pipe(new StringOutputParser())` 组成 `poemChain`
- 一行 `poemChain.invoke({ poet, theme })` 拿到**纯字符串**

**验收**：打印 `typeof result`，结果是 `string`。

---

## 第 2 关：流式输出

**要求**：用 `poemChain.stream(...)` 配合 `for await` 和 `process.stdout.write`，让诗一个字一个字地打出来。

**验收**：能看到打字机效果。

**思考**：`invoke` 和 `stream` 用的是同一条链，你改了链本身吗？

---

## 第 3 关：多角色 Prompt

**要求**
- `PromptTemplate` 换成 `ChatPromptTemplate.fromMessages`
- system：你是古诗创作助手，只输出诗本身，不要任何解释
- human：请用 {poet} 的风格，写一首关于 {theme} 的诗
- 调用前用 `formatMessages` 打印出最终的消息数组

**验收**：打印里能看到 `[system]` 和 `[human]` 两条消息；输出里没有"好的，这是一首……"这类废话。

---

## 第 4 关：Few-shot 稳定格式

**要求**
- 规定输出格式：第一行《标题》，后面 4 行诗句
- 用 `FewShotChatMessagePromptTemplate` 加 2 个示例（一问一答），再通过 `MessagesPlaceholder` 插进 prompt（09 里有这个写法的原因）

**验收**：连跑 3 次，格式都一样。对比去掉示例后的效果。

---

## 第 5 关：结构化输出

**要求**
- 用 zod 定义 `poemSchema`：`{ title: string, poet: string, lines: string[]（长度 4）, explanation: string }`
- prompt 里写明 JSON 格式（花括号写成 `{{ }}`），链尾换成 `JsonOutputParser`
- 用 `safeParse` 校验：成功就格式化打印，失败就打印错误和原始输出，**程序不崩**

**验收**：故意把 schema 改成要 5 行，能看到清晰的校验错误。

---

## 第 6 关：一诗多用（并行）

**要求**：用 `RunnablePassthrough.assign` 在写完诗之后，**同时**生成：
- `modern`：白话文翻译
- `english`：英文翻译

最终得到一个对象：`{ poet, theme, poem, modern, english }`。

**验收**：打印这个对象；用 `console.time` 证明两个翻译是并行的（总耗时约等于一次翻译，而不是两次）。

**思考**：为什么这里用 `assign`，而不是 `RunnableParallel`？

---

## 第 7 关：批量 + 重试

**要求**
- 准备 `[{ poet: "李白", theme }, { poet: "杜甫", theme }, { poet: "白居易", theme }]`
- 用 `.batch(..., { maxConcurrency: 2 })` 一次跑完
- 给 model 加 `.withRetry({ stopAfterAttempt: 2 })`

**验收**：一次输出三位诗人的作品；把 `maxConcurrency` 改成 1 和 3，对比耗时。

---

## 第 8 关：意图路由

**要求**：输入变成一句自然语言，先分类，再分流：
- `write`：如"用李白的风格写首思乡诗" → 先用一个链抽出 `{ poet, theme }`，再走写诗链
- `explain`：如"解释一下《静夜思》" → 走赏析链
- `other`：其他 → 礼貌地说明自己只会写诗和赏诗

用 `RunnableLambda` 返回对应链的写法（11 的写法二）。

**验收**：三类问题各测一次，都走对了分支。

---

## 第 9 关：多轮对话记忆

**要求**
- 用 `node:readline/promises` 做一个输入循环，输入 `exit` 退出
- 用 `RunnableWithMessageHistory` 包住第 8 关的路由
- 支持追问：先"写一首李白风格的思乡诗"，再"改得更悲伤一点""换成杜甫的风格"

**验收**：追问时它知道你说的是哪首诗。

---

## 第 10 关：工具 + Agent 循环

**要求**：定义两个工具，让模型**自己决定**什么时候调用：
- `check_meter`：输入诗句数组，返回每句字数，以及是否统一为五言或七言（本地代码计算）
- `get_poet_info`：输入诗人名，返回假数据（朝代、代表作）

写诗流程：模型写诗 → 调用 `check_meter` 检查格律 → 不合格就重写，最多 3 轮。

**验收**：日志里能看到工具调用的过程。

**注意**：`abab6.5s-chat` 的工具调用不稳定，可能把调用写成正文。08 里有兼容代码，想想怎么复用。

---

## 第 11 关：观测每一步

**要求**：用 `callbacks` 或 `streamEvents`：
- 打印每一步的名字和耗时（用 `withConfig({ runName: "写诗" })` 给步骤起名）
- 统计一次对话的总 token

**验收**：跑一轮完整对话，能说清楚时间都花在了哪一步。

---

## 毕业标准

11 关都做完后，你的 `basic_agent.ts` 应该能做到：在终端里多轮聊天，写诗、赏诗、追问修改，自己检查格律，并打印每一步的耗时和 token。回头看 `git log`，每个 commit 就是一个知识点。
