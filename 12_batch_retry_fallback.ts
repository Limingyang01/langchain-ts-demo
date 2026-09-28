import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// 任何 Runnable 都自带三个"生产必备"能力，不用自己写 for 循环和 try/catch：
//   .batch(inputs, { maxConcurrency }) —— 批量调用，控制并发数
//   .withRetry({ stopAfterAttempt })   —— 失败自动重试
//   .withFallbacks([备用链])            —— 主链失败时换备用链（比如换个模型）
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda } from "@langchain/core/runnables";

async function main() {
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0,
  });
  const parser = new StringOutputParser();

  const chain = ChatPromptTemplate.fromMessages([
    ["system", "用一个 emoji 表示下面这个词，只输出 emoji。"],
    ["human", "{word}"],
  ])
    .pipe(model)
    .pipe(parser);

  // ---------- 1. batch：一次处理多个输入 ----------
  //     maxConcurrency 限制同时最多几个请求在飞，防止触发接口限流
  console.log("--- 1. batch ---");
  const words = ["太阳", "猫", "咖啡", "火箭", "雨"];
  const start = Date.now();
  const emojis = await chain.batch(
    words.map((word) => ({ word })),
    { maxConcurrency: 3 },
  );
  words.forEach((w, i) => console.log(`   ${w} → ${emojis[i]}`));
  console.log(`   耗时 ${Date.now() - start}ms（串行调用会慢得多）`);

  // ---------- 2. withRetry：失败自动重试 ----------
  //     用一个"前两次必失败"的假函数模拟网络抖动
  console.log("\n--- 2. withRetry ---");
  let attempts = 0;
  const flaky = RunnableLambda.from(async (x: string) => {
    attempts++;
    console.log(`   第 ${attempts} 次尝试`);
    if (attempts < 3) throw new Error("模拟网络抖动");
    return `成功处理：${x}`;
  });
  const reliable = flaky.withRetry({ stopAfterAttempt: 3 });
  console.log("  ", await reliable.invoke("hello"));

  // ---------- 3. withFallbacks：主链挂了走备用链 ----------
  //     故意用一个不存在的模型名当主模型，它必然报错 → 自动切到备用模型
  console.log("\n--- 3. withFallbacks ---");
  const brokenModel = new ChatOpenAI({
    modelName: "model-that-does-not-exist",
    maxRetries: 0, // 关掉 SDK 自带重试，让它快速失败
  });
  const modelWithFallback = brokenModel.withFallbacks([model]);
  const safeChain = ChatPromptTemplate.fromMessages([["human", "{q}"]])
    .pipe(modelWithFallback)
    .pipe(parser);
  console.log(
    "   🤖",
    await safeChain.invoke({ q: "用一句话说明什么是降级（fallback）。" }),
  );

  // ---------- 4. batch 里某一项失败怎么办？ ----------
  //     默认一项失败整个 batch 抛错；returnExceptions: true 则把错误当结果返回
  console.log("\n--- 4. batch + returnExceptions ---");
  const mayFail = RunnableLambda.from(async (n: number) => {
    if (n === 2) throw new Error(`输入 ${n} 处理失败`);
    return n * 10;
  });
  const results = await mayFail.batch([1, 2, 3], {}, { returnExceptions: true });
  results.forEach((r, i) =>
    console.log(
      `   [${i}]`,
      r instanceof Error ? `❌ ${r.message}` : `✅ ${r}`,
    ),
  );
}

main();
