import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// 02 学的 PromptTemplate 只能产出"一整段字符串"；
// 聊天模型真正吃的是"消息数组"（system / human / ai 各有角色）。
// 本节认识：
//   ChatPromptTemplate.fromMessages —— 按角色写模板，产出消息数组
//   MessagesPlaceholder              —— 在模板里给"一段消息数组"留位置（04 里用字符串拼接，这里是正规做法）
//   FewShotChatMessagePromptTemplate —— 把几组"示范问答"塞进 prompt，让模型照葫芦画瓢
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  FewShotChatMessagePromptTemplate,
} from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0,
  });
  const parser = new StringOutputParser();

  // ---------- 1. ChatPromptTemplate：多角色模板 ----------
  //     每一项是 [角色, 模板字符串]，模板里照样可以用 {变量}
  const rolePrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一名{role}，回答不超过 30 字。"],
    ["human", "{question}"],
  ]);

  // formatMessages：只渲染不调用模型，方便看清楚最终发给模型的是什么
  const msgs = await rolePrompt.formatMessages({
    role: "资深前端工程师",
    question: "Vue 和 React 选哪个？",
  });
  console.log("--- 1. 渲染出的消息数组 ---");
  for (const m of msgs) console.log(`   [${m.getType()}] ${m.content}`);

  const roleChain = rolePrompt.pipe(model).pipe(parser);
  console.log(
    "🤖",
    await roleChain.invoke({
      role: "资深前端工程师",
      question: "Vue 和 React 选哪个？",
    }),
  );

  // ---------- 2. MessagesPlaceholder：给历史消息留坑 ----------
  //     跟 04 的区别：04 把 history 渲染成一段文字塞进 human 消息，
  //     这里 history 保持"消息对象"原样插入，模型能看到真实的角色分隔
  const historyPrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个简洁的助手。"],
    new MessagesPlaceholder("history"),
    ["human", "{question}"],
  ]);
  const historyChain = historyPrompt.pipe(model).pipe(parser);
  console.log("\n--- 2. MessagesPlaceholder ---");
  console.log(
    "🤖",
    await historyChain.invoke({
      history: [
        new HumanMessage("我叫小明，我在学 LangChain。"),
        new AIMessage("你好小明，有问题随时问我。"),
      ],
      question: "我叫什么？我在学什么？",
    }),
  );

  // ---------- 3. Few-shot：给模型看示范 ----------
  //     场景：把口语需求转成"Git 提交信息"，格式要固定为 <type>: <描述>
  //     只靠文字描述格式，模型常常跑偏；给 2~3 个例子，效果立竿见影
  const examples = [
    { input: "修了登录页按钮点不动的问题", output: "fix: 修复登录按钮无法点击" },
    { input: "加了个导出 Excel 的功能", output: "feat: 新增 Excel 导出" },
    { input: "README 里补了安装步骤", output: "docs: 补充安装说明" },
  ];

  // 每个例子怎么渲染成消息：一问（human）一答（ai）
  const examplePrompt = ChatPromptTemplate.fromMessages([
    ["human", "{input}"],
    ["ai", "{output}"],
  ]);

  const fewShot = new FewShotChatMessagePromptTemplate({
    examples,
    examplePrompt,
    inputVariables: [], // 示例本身不需要外部变量
  });

  // 先把示例渲染成消息数组（human/ai 交替），再用 MessagesPlaceholder 插进主模板
  // （官方 Python 文档里能直接把 fewShot 塞进 fromMessages，TS 版在严格类型下不兼容，这样写最稳）
  const exampleMessages = await fewShot.formatMessages({});

  const commitPrompt = ChatPromptTemplate.fromMessages([
    ["system", "把用户的描述转成一行 Git 提交信息，只输出提交信息本身。"],
    new MessagesPlaceholder("examples"), // 示例消息会被展开插在这里
    ["human", "{input}"],
  ]);

  console.log("\n--- 3. Few-shot 渲染结果（看看示例是怎么插进去的）---");
  const fewShotMsgs = await commitPrompt.formatMessages({
    examples: exampleMessages,
    input: "把首页加载速度优化了一倍",
  });
  for (const m of fewShotMsgs) console.log(`   [${m.getType()}] ${m.content}`);

  const commitChain = commitPrompt.pipe(model).pipe(parser);
  for (const input of [
    "把首页加载速度优化了一倍",
    "删掉了没用的工具函数",
    "给订单模块补了单元测试",
  ]) {
    const commit = await commitChain.invoke({ examples: exampleMessages, input });
    console.log(`📝 ${input}  →  ${commit}`);
  }
}

main();
