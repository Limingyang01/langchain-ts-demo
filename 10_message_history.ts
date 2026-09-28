import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// 04 是手写记忆：自己 push 数组、自己裁剪。
// 本节用官方封装，框架替你做"读历史 → 拼进 prompt → 调模型 → 写回历史"：
//   RunnableWithMessageHistory —— 给任意链加上记忆能力
//   InMemoryChatMessageHistory —— 内存版历史存储（真实业务换成 Redis / 数据库实现）
//   sessionId                  —— 每个用户 / 会话一份独立历史
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0.3,
  });

  // ---------- 1. 普通链：prompt 里给 history 留坑 ----------
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个简洁的助手，回答不超过 40 字。"],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  // ---------- 2. 会话仓库：sessionId → 历史 ----------
  //     ponytail: 内存 Map，进程重启就丢；上线换成 Redis 等持久化实现（进阶篇 23）
  const store = new Map<string, InMemoryChatMessageHistory>();
  function getHistory(sessionId: string): InMemoryChatMessageHistory {
    let history = store.get(sessionId);
    if (!history) {
      history = new InMemoryChatMessageHistory();
      store.set(sessionId, history);
    }
    return history;
  }

  // ---------- 3. 包一层记忆 ----------
  //     inputMessagesKey   —— 输入里哪个字段是"用户这次说的话"（会被写进历史）
  //     historyMessagesKey —— prompt 里 MessagesPlaceholder 的名字
  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: getHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "history",
  });

  // 调用时通过 config.configurable.sessionId 指定会话
  async function chat(sessionId: string, input: string) {
    const answer = await chainWithHistory.invoke(
      { input },
      { configurable: { sessionId } },
    );
    console.log(`[${sessionId}] 👤 ${input}`);
    console.log(`[${sessionId}] 🤖 ${answer}\n`);
  }

  // ---------- 4. 两个会话互不干扰 ----------
  await chat("alice", "我叫 Alice，我最喜欢的语言是 TypeScript。");
  await chat("bob", "我叫 Bob，我是 Python 开发。");
  await chat("alice", "我叫什么？我喜欢什么语言？");
  await chat("bob", "我叫什么？我用什么语言？");

  // ---------- 5. 看看仓库里存了什么 ----------
  for (const [sessionId, history] of store) {
    const messages = await history.getMessages();
    console.log(`📜 ${sessionId}：${messages.length} 条消息`);
    for (const m of messages) {
      console.log(`   [${m.getType()}] ${String(m.content).slice(0, 40)}`);
    }
  }
}

main();
