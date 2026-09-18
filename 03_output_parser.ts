import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// LangChain 核心原语
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
  // 1. PromptTemplate：把模板和变量声明一次写清楚
  const translationPrompt = PromptTemplate.fromTemplate(
    "请把下面这句中文翻译成 {targetLang}，只输出译文，不要任何解释：\n\n{text}",
  );

  // 2. 模型
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0,
  });

  // 3. Parser：把 AIMessage 拆成纯字符串
  const parser = new StringOutputParser();

  // 4. LCEL：用 .pipe() 把三步拼成一条链
  //    链的输入 = PromptTemplate 需要的变量，输出 = 纯字符串
  const translationChain = translationPrompt.pipe(model).pipe(parser);

  console.log("🔗 链结构:\n", translationChain);
  console.log("\n--- 开始调用 ---\n");

  // 5. 一行 invoke 走完"模板渲染 → 模型推理 → 解析输出"
  const english = await translationChain.invoke({
    targetLang: "English",
    text: "LangChain 把 Prompt、Model、Parser 拼成一条链，调用起来非常直观。",
  });
  console.log("🇺🇸 English:", english);

  const japanese = await translationChain.invoke({
    targetLang: "日本語",
    text: "LangChain 把 Prompt、Model、Parser 拼成一条链，调用起来非常直观。",
  });
  console.log("🇯🇵 日本語:", japanese);

  // 6. 同一根链也能 .stream()，逐块拿到译文（打字机效果）
  console.log("\n--- 流式调用（法语）---");
  const stream = await translationChain.stream({
    targetLang: "Français",
    text: "LangChain 把 Prompt、Model、Parser 拼成一条链，调用起来非常直观。",
  });
  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
  console.log("\n");
}

main();
