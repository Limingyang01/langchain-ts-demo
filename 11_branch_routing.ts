import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// 05 学的是"并行"：同一个输入同时走多条链。
// 本节学"分支"：根据输入内容，只走其中一条链（相当于链里的 if / else）。
//   RunnableBranch —— [条件, 链] 列表 + 默认链，从上往下第一个为 true 的条件胜出
//   常见套路："先让模型分类，再按分类路由到专门的链"
import { RunnableBranch, RunnableLambda } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0,
  });
  const parser = new StringOutputParser();

  // ---------- 1. 分类链：判断问题属于哪一类 ----------
  const classifyChain = ChatPromptTemplate.fromMessages([
    [
      "system",
      "把用户问题归类为 code、math、other 之一，只输出这一个单词，不要任何解释。",
    ],
    ["human", "{question}"],
  ])
    .pipe(model)
    .pipe(parser);

  // ---------- 2. 三条专门的链 ----------
  const codeChain = ChatPromptTemplate.fromMessages([
    ["system", "你是资深程序员，用简短代码 + 一句话解释回答。"],
    ["human", "{question}"],
  ])
    .pipe(model)
    .pipe(parser);

  const mathChain = ChatPromptTemplate.fromMessages([
    ["system", "你是数学老师，先列式再给结果，不超过 3 行。"],
    ["human", "{question}"],
  ])
    .pipe(model)
    .pipe(parser);

  const generalChain = ChatPromptTemplate.fromMessages([
    ["system", "你是友好的助手，用一句话回答。"],
    ["human", "{question}"],
  ])
    .pipe(model)
    .pipe(parser);

  // ---------- 3. RunnableBranch：按 topic 分流 ----------
  //     输入形如 { topic, question }；条件函数返回 true 就走对应链
  type Routed = { topic: string; question: string };
  const branch = RunnableBranch.from<Routed, string>([
    [(x) => x.topic.includes("code"), codeChain],
    [(x) => x.topic.includes("math"), mathChain],
    generalChain, // 最后一项是默认分支（都不命中时走这里）
  ]);

  // ---------- 4. 拼起来：分类 → 分流 ----------
  //     先并入 topic 字段，再交给 branch
  const router = RunnableLambda.from(async (input: { question: string }) => {
    const topic = (await classifyChain.invoke(input)).trim().toLowerCase();
    console.log(`   🏷️  分类结果：${topic}`);
    return { topic, question: input.question };
  }).pipe(branch);

  for (const question of [
    "TypeScript 里怎么把数组去重？",
    "一个圆半径是 3，面积是多少？",
    "推荐一本适合周末读的书",
  ]) {
    console.log(`\n❓ ${question}`);
    console.log(`🤖 ${await router.invoke({ question })}`);
  }

  // ---------- 5. 补充：不需要 RunnableBranch 的写法 ----------
  //     RunnableLambda 里直接 return 一个 Runnable，LangChain 会自动继续执行它
  //     分支少时这种写法更直观，官方文档也更推荐
  const router2 = RunnableLambda.from(
    async (input: { question: string }) => {
      const topic = (await classifyChain.invoke(input)).toLowerCase();
      if (topic.includes("code")) return codeChain;
      if (topic.includes("math")) return mathChain;
      return generalChain;
    },
  );
  console.log("\n--- RunnableLambda 返回 Runnable 的写法 ---");
  console.log(`🤖 ${await router2.invoke({ question: "17 乘以 23 等于多少？" })}`);
}

main();
