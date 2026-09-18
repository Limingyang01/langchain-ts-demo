import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// LangChain 核心原语：从 @langchain/core 导入
import { PromptTemplate } from "@langchain/core/prompts";

async function main() {
  // 1. 用 fromTemplate 创建一个模板
  //    {topic} {style} 是占位符，运行时会替换成实际变量
  const prompt = PromptTemplate.fromTemplate(
    "请用 {style} 的风格，用一句话向一个 {audience} 介绍 {topic}。",
  );

  // 2. format()：同步把模板渲染成最终字符串（不进模型）
  const formatted = await prompt.format({
    topic: "量子力学",
    style: "幽默",
    audience: "5 岁小朋友",
  });
  console.log("📝 渲染后的 Prompt:\n", formatted);

  // 3. 初始化模型（沿用 M3，dotenv 已注入 OPENAI_API_KEY / OPENAI_BASE_URL）
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0.7,
  });

  // 4. prompt.invoke() 返回 PromptValue，模型可以直接吃
  const promptValue = await prompt.invoke({
    topic: "LangChain",
    style: "严肃学术",
    audience: "CS 专业研究生",
  });
  const aiMessage = await model.invoke(promptValue);

  console.log("\n🤖 AI 回答:\n", aiMessage.content);
}

main();
