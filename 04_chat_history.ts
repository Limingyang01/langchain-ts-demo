import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// 这次新增两个东西：
//   PromptTemplate  我们已经认识（带变量的模板）
//   MessagesPlaceholder  —— 模板里"挖一个坑"，运行时不填字符串、而是塞一整段历史消息数组
import { PromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
//   AIMessage / HumanMessage / SystemMessage —— 三种角色消息
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
//   StringOutputParser：把 AIMessage 拆成纯字符串（03 已经用过）
//   本 demo 不直接用，因为我们已经在 chat() 里手动读 .content 了
//   留着 import 也不会报错，但为简洁起见删掉
// import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
  // ---------- 1. PromptTemplate：挖一个 {history} 坑 ----------
  //     注意 {history} 不用引号包：因为它不是字符串，是一整段消息数组
  const chatPrompt = PromptTemplate.fromTemplate(`
你是 LangChain 助手，回答要简短。
【之前的对话】
{history}
【新问题】
{input}
`);

  // ---------- 2. 模型 ----------
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0.5,
  });

  // ---------- 3. 注意：本 demo 不用 chatChain 直接 invoke ----------
  //     模板里有 MessagesPlaceholder(history)，需要我们手动渲染出 messages 数组后
  //     再喂给模型（因为 chat() 里要同步操作 history），所以这里不拼 chain

  // ---------- 4. 手写一个"记忆数组" + 维护它的 helper ----------
  //     每轮把"人类说的话"和"AI 的回答"都 push 进去，下一轮就带上下文
  //     真实业务里这个数组会被存在数据库 / Redis，对每个 session 维护一份
  const history: Array<HumanMessage | AIMessage> = [];

  // 限制历史最多 N 条，超过就从头部丢掉最早的（防 token 爆炸）
  const MAX_HISTORY = 6;

  async function chat(userInput: string): Promise<string> {
    // 4-1) 渲染模板：PromptTemplate.invoke 返回 PromptValue，
    //     用 .toChatMessages() 转成模型能直接吃的 messages 数组
    const promptValue = await chatPrompt.invoke({ history, input: userInput });
    const messages = promptValue.toChatMessages();

    // 4-2) 模型吃 messages 数组，返回 AIMessage
    const aiMessage = await model.invoke(messages);

    // 4-3) 直接读 .content（已经是 string），不需要再过 parser
    const aiText =
      typeof aiMessage.content === "string"
        ? aiMessage.content
        : JSON.stringify(aiMessage.content);

    // 4-4) 把本轮对话写进 history，下一轮能"记起来"
    history.push(new HumanMessage(userInput));
    history.push(new AIMessage(aiText));

    // 4-5) trim：超过上限就把最早的成对（user+ai）砍掉
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    return aiText;
  }

  // ---------- 5. 跑两轮，看看 AI 是否真的"记得" ----------
  console.log("👤 用户：LangChain 是什么？");
  console.log("🤖 AI  ：", await chat("LangChain 是什么？"));

  console.log("\n👤 用户：那它和直接调 OpenAI API 有什么区别？");
  console.log("🤖 AI  ：", await chat("那它和直接调 OpenAI API 有什么区别？"));

  console.log("\n👤 用户：用一句话总结一下。");
  console.log("🤖 AI  ：", await chat("用一句话总结一下。"));

  // 调试用：打印当前历史
  console.log("\n📜 当前历史条数：", history.length);
  for (const m of history) {
    console.log(`   [${m.getType()}]`, (m.content as string).slice(0, 60));
  }
}

main();
