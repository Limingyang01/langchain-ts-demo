# LangChain.js 学习路线（基础 → 进阶 → 高级）

> 技术栈：TypeScript + `@langchain/core` + `@langchain/openai`（通过 OpenAI 兼容接口接 MiniMax）
> 运行方式：`npm run start:XX`（XX 为序号），或 `npx tsx XX_xxx.ts`
> 图例：✅ 已完成  🆕 本次补充  ⬜ 待学习

---

## 一、基础篇（Core 原语：一个人能写出完整的小应用）

目标：理解 LangChain 的"积木"——模型、消息、Prompt、Parser、Runnable/LCEL、工具，
并能把它们拼成链、带记忆、接知识库、调用工具。

| 序号 | 文件 | 主题 | 关键 API | 状态 |
| --- | --- | --- | --- | --- |
| 01 | `01_quickstart.ts` | 快速上手 + 工具调用初体验 | `ChatOpenAI`、`tool()`、`bindTools` | ✅ |
| 02 | `02_prompt_template.ts` | 字符串 Prompt 模板 | `PromptTemplate.fromTemplate`、`format` / `invoke` | ✅ |
| 03 | `03_output_parser.ts` | 输出解析 + LCEL 管道 + 流式 | `StringOutputParser`、`.pipe()`、`.stream()` | ✅ |
| 04 | `04_chat_history.ts` | 手写对话记忆 | `HumanMessage` / `AIMessage`、历史裁剪 | ✅ |
| 05 | `05_parallel_chain.ts` | 并行 / 透传 / 函数节点 | `RunnableParallel`、`RunnablePassthrough.assign`、`RunnableLambda` | ✅ |
| 06 | `06_rag_basic.ts` | RAG 原理（手写向量库） | `Document`、`Embeddings`、余弦相似度 | ✅ |
| 07 | `07_structured_output.ts` | JSON 输出 + zod 校验 | `JsonOutputParser`、`zod.safeParse` | ✅ |
| 08 | `08_agent_basic.ts` | 手写 Agent 循环 | `ChatPromptTemplate`、`ToolMessage`、`tool_calls` | ✅ |
| 09 | `09_chat_prompt_fewshot.ts` | 多角色 Prompt + Few-shot 示例 | `ChatPromptTemplate.fromMessages`、`MessagesPlaceholder`、`FewShotChatMessagePromptTemplate` | 🆕 |
| 10 | `10_message_history.ts` | 官方记忆封装（多会话） | `RunnableWithMessageHistory`、`InMemoryChatMessageHistory`、`sessionId` | 🆕 |
| 11 | `11_branch_routing.ts` | 条件分支 / 路由 | `RunnableBranch`、先分类再分流 | 🆕 |
| 12 | `12_batch_retry_fallback.ts` | 批量、重试、降级 | `.batch()` + `maxConcurrency`、`.withRetry()`、`.withFallbacks()` | 🆕 |
| 13 | `13_stream_events_callbacks.ts` | 流式事件 + 回调（调试/观测） | `.streamEvents()`、`callbacks`、`runName` | 🆕 |
| 14 | `14_with_structured_output.ts` | 官方结构化输出（⚠️ abab6.5s-chat 实测不支持，需换模型才能看到成功） | `model.withStructuredOutput(zodSchema)` | 🆕 |

**基础篇学完你应该能回答：**
- 什么是 Runnable？为什么 Prompt、Model、Parser、整条链都能 `invoke / stream / batch`？
- `PromptTemplate` 和 `ChatPromptTemplate` 的区别？`MessagesPlaceholder` 解决什么问题？
- 手写记忆（04）和 `RunnableWithMessageHistory`（10）各自适合什么场景？
- 模型的 tool calling 本质是什么？Agent 循环的终止条件是什么？
- 结构化输出三种方式：Prompt 约束 + JsonOutputParser（07）、`withStructuredOutput`（14）、tool calling，各有什么取舍？

---

## 二、进阶篇（生态组件：做出"能用"的应用）

目标：用官方组件替换基础篇里的手写实现，接入真实数据和外部服务。

| 序号 | 主题 | 关键内容 | 需要的包 |
| --- | --- | --- | --- |
| 15 | 文档加载器 | Text / PDF / CSV / 网页加载 | `@langchain/community`、`langchain` |
| 16 | 文本切分器 | `RecursiveCharacterTextSplitter`、chunkSize / overlap 调参 | `@langchain/textsplitters` |
| 17 | 真实 Embeddings | `OpenAIEmbeddings` 或兼容模型、向量维度 | `@langchain/openai` |
| 18 | 向量库 | `MemoryVectorStore` → Chroma / pgvector / Qdrant | `langchain`、`@langchain/community` |
| 19 | Retriever 进阶 | MMR、元数据过滤、`MultiQueryRetriever`、`ContextualCompressionRetriever` | `langchain` |
| 20 | RAG 完整版 | 带引用来源、多轮对话式 RAG（问题改写 history-aware） | — |
| 21 | 官方 Agent | `createAgent`（LangChain v1）、中间件（middleware） | `langchain` |
| 22 | 工具进阶 | 工具错误处理、`ToolMessage` artifact、并行工具调用、`StructuredTool` | — |
| 23 | 持久化记忆 | Redis / 数据库存历史、摘要记忆、token 裁剪 `trimMessages` | `@langchain/redis` 等 |
| 24 | 多模态 | 图片输入、`content` 数组消息 | — |
| 25 | 多模型切换 | `initChatModel`、Anthropic / Ollama 本地模型 | `@langchain/anthropic`、`@langchain/ollama` |
| 26 | 缓存与成本 | 模型缓存、token 统计 `usage_metadata` | — |

---

## 三、高级篇（LangGraph + 工程化：做出"可上线"的系统）

目标：掌握有状态工作流、多 Agent 协作，以及上线必备的观测、评估与部署。

| 序号 | 主题 | 关键内容 | 需要的包 |
| --- | --- | --- | --- |
| 27 | LangGraph 入门 | `StateGraph`、node / edge、`Annotation` 状态定义 | `@langchain/langgraph` |
| 28 | 条件边与循环 | `addConditionalEdges`、用图重写 08 的 Agent 循环 | 同上 |
| 29 | 持久化与断点 | `MemorySaver` checkpointer、`thread_id`、时间旅行 | 同上 |
| 30 | 人在回路 | `interrupt()`、审批后继续执行 | 同上 |
| 31 | 多 Agent | Supervisor / Swarm 模式、子图 | `@langchain/langgraph-supervisor` 等 |
| 32 | Agentic RAG | 自我反思 RAG、Corrective RAG、查询路由 | — |
| 33 | MCP 集成 | 把 MCP Server 的工具接入 Agent | `@langchain/mcp-adapters` |
| 34 | 可观测性 | LangSmith tracing、自定义 CallbackHandler | `langsmith` |
| 35 | 评估 | 数据集 + LLM-as-judge、回归测试 | `langsmith` |
| 36 | 安全与护栏 | Prompt 注入防护、输出校验、限流、超时 | — |
| 37 | 部署 | 封装成 HTTP API（Express / Hono）、SSE 流式输出、LangGraph Platform | — |

---

## 学习建议

1. **每个 demo 先跑一遍，再改参数**：温度、prompt、k 值……改一个看一个变化。
2. **遇到"手写版"就去找"官方版"**：04 → 10、06 → 16/18、07 → 14、08 → 21/28，对比能帮你理解框架到底帮你省了什么。
3. **一切皆 Runnable**：看不懂一个对象时，先问"它的输入和输出是什么类型"。
4. **打开调试**：13 里的 `streamEvents` / callbacks，或者设置 `LANGSMITH_TRACING=true`，能看到链内部每一步。
5. **本项目用的是 `abab6.5s-chat`**：它对 tool calling / 结构化输出的支持不如 GPT-4o、Claude 等稳定（见 08 的兼容代码），遇到怪行为先怀疑模型能力。
