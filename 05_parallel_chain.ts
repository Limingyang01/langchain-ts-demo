import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// 这次再认识 3 个新原语，全部来自 @langchain/core/runnables：
//   RunnablePassthrough —— 不做任何处理，原样把输入传给下一步（"传送带空转"）
//   RunnableParallel   —— 同时跑多条子链，结果合并成 {key1: v1, key2: v2}
//   RunnableLambda     —— 把任意 JS 函数包装成 Runnable，方便插进 LCEL
import {
  RunnablePassthrough,
  RunnableParallel,
  RunnableLambda,
} from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
  // ---------- 1. 准备两条子链 ----------
  //   子链 A：把句子翻译成英文
  const translatePrompt = PromptTemplate.fromTemplate(
    "把下面这句翻译成英文，只输出译文：\n\n{text}",
  );
  //   子链 B：给句子写一句"评论家点评"
  const critiquePrompt = PromptTemplate.fromTemplate(
    "用一句话点评下面这句中文（不超过 20 字）：\n\n{text}",
  );
  //   子链 C：给句子写一个 ≤6 字的英文短标题
  const headlinePrompt = PromptTemplate.fromTemplate(
    "为下面这句中文起一个 ≤6 字的英文标题，只输出标题：\n\n{text}",
  );

  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0.7,
  });
  const parser = new StringOutputParser();

  // pipe 完就是 Runnable，可以被任何其他 Runnable 调用
  const translateChain = translatePrompt.pipe(model).pipe(parser);
  const critiqueChain = critiquePrompt.pipe(model).pipe(parser);
  const headlineChain = headlinePrompt.pipe(model).pipe(parser);

  // ---------- 2. RunnableParallel：并行跑多个子链，结果合并成对象 ----------
  //   输入 { text } 会同时被三条子链消费；输出形如 { translation, critique, headline }
  const parallelBranch = RunnableParallel.from({
    translation: translateChain,
    critique: critiqueChain,
    headline: headlineChain,
  });

  // ---------- 3. RunnablePassthrough：保留原输入一起往下传 ----------
  //   最终我们想拿到 { original, translation, critique, headline }
  //   所以先经过 passthrough，原封不动地 { text: "..." } 透传出去
  const withOriginal = RunnablePassthrough.assign({
    // .assign() 会把新字段合并进去，相当于 Object.assign(passthroughOutput, newFields)
    translation: translateChain,
    critique: critiqueChain,
    headline: headlineChain,
  });

  // ---------- 4. 最后一步：把整段拼成一个 tweet ----------
  const finalPrompt = PromptTemplate.fromTemplate(`
请你把下面素材拼成一条推文（英文，不超过 140 字）：

原文：{text}
英译：{translation}
标题：{headline}
点评：{critique}

只输出推文本身，不要任何额外说明。`);
  const finalChain = withOriginal.pipe(finalPrompt).pipe(model).pipe(parser);

  // ---------- 5. 一行 invoke 看效果 ----------
  const text =
    "LangChain 把 Prompt、Model、Parser 拼成一条链，调用起来非常直观。";
  console.log("--- 串行（passthrough.assign）---");
  console.log("📝 原句  ：", text);
  const tweet = await finalChain.invoke({ text });
  console.log("🐦 推文  ：", tweet);

  console.log("\n--- 并行（RunnableParallel）独立跑一次，看完整输出 ---");
  const parallelResult = await parallelBranch.invoke({ text });
  console.log(parallelResult);

  // ---------- 6. RunnableLambda：把普通函数塞进链里 ----------
  //   有时你只想要 JS 加工（比如截断、统计），不必起一个 LLM 子链
  const summarize = RunnableLambda.from(async (input: { text: string }) => {
    return {
      text: input.text,
      charCount: input.text.length,
      firstHalf: input.text.slice(0, Math.ceil(input.text.length / 2)),
    };
  });

  console.log("\n--- RunnableLambda 演示 ---");
  const summary = await summarize.invoke({ text });
  console.log(summary);
}

main();
