// 05 的"无模型"简化版：所有步骤都是普通函数，不调 API、秒出结果
// 目的：只看数据在链里怎么流动，理解 05 的 4 个原语
import {
  RunnableLambda,
  RunnableParallel,
  RunnablePassthrough,
} from "@langchain/core/runnables";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // ========== 要点 1：RunnableLambda —— 把普通函数变成"积木" ==========
  //   包一层之后，函数就有了 invoke / pipe / batch 等能力，能和 Prompt、模型拼在一起
  const double = RunnableLambda.from((n: number) => n * 2);
  const addOne = RunnableLambda.from((n: number) => n + 1);

  console.log("1️⃣  RunnableLambda");
  console.log("   double.invoke(5) =", await double.invoke(5)); // 10

  // ========== 要点 2：pipe —— 串行，上一步的输出 = 下一步的输入 ==========
  //   5 → double → 10 → addOne → 11
  const serial = double.pipe(addOne);
  console.log("\n2️⃣  pipe 串行");
  console.log("   5 → double → addOne =", await serial.invoke(5)); // 11

  // ========== 要点 3：RunnableParallel —— 同一个输入，分给多条支路，结果合成对象 ==========
  //         ┌→ double  → 10 ┐
  //   5 ──  ┼→ addOne  →  6 ┼→ { doubled: 10, plusOne: 6, squared: 25 }
  //         └→ square  → 25 ┘
  const parallel = RunnableParallel.from({
    doubled: double,
    plusOne: addOne,
    squared: RunnableLambda.from((n: number) => n * n),
  });
  console.log("\n3️⃣  RunnableParallel 并行");
  console.log("   ", await parallel.invoke(5));

  // ---------- 3b：是真的"同时跑"，不是一个接一个 ----------
  //   三条支路各睡 1 秒；串行要 3 秒，并行只要约 1 秒
  const slow = (name: string) =>
    RunnableLambda.from(async (x: string) => {
      await sleep(1000);
      return `${name} 处理了 ${x}`;
    });
  const slowParallel = RunnableParallel.from({
    a: slow("A"),
    b: slow("B"),
    c: slow("C"),
  });
  const t = Date.now();
  const slowResult = await slowParallel.invoke("任务");
  console.log(`   3 条各 1 秒的支路，总耗时 ${Date.now() - t}ms`, slowResult);

  // ========== 要点 4：RunnablePassthrough —— 原样传递，什么都不做 ==========
  //   单独用没意义；放进 Parallel 里，就能在结果里"保留原始输入"
  const keepOriginal = RunnableParallel.from({
    original: new RunnablePassthrough<number>(), // 原样 → 5
    doubled: double, //                             加工 → 10
  });
  console.log("\n4️⃣  RunnablePassthrough 保留原输入");
  console.log("   ", await keepOriginal.invoke(5)); // { original: 5, doubled: 10 }

  // ========== 要点 5：RunnablePassthrough.assign —— 保留输入对象，再"追加"新字段 ==========
  //   输入必须是对象；原有字段全保留，新字段由支路（并行）算出来再合并进去
  //   { text } → { text, length, upper }
  const enrich = RunnablePassthrough.assign({
    length: (input: { text: string }) => input.text.length,
    upper: (input: { text: string }) => input.text.toUpperCase(),
  });
  console.log("\n5️⃣  RunnablePassthrough.assign 追加字段");
  console.log("   ", await enrich.invoke({ text: "hello langchain" }));

  // ========== 要点 6：组合起来 —— 就是 05 里 finalChain 的结构 ==========
  //   { text } → assign 并行算出 translation / headline → 最后一步用所有字段拼结果
  //   05 里把这两个假函数换成了"调模型的子链"，最后一步换成了 prompt + 模型
  const fakeTranslate = RunnableLambda.from(
    async (x: { text: string }) => `[EN] ${x.text}`,
  );
  const fakeHeadline = RunnableLambda.from(
    async (x: { text: string }) => `标题：${x.text.slice(0, 4)}`,
  );
  const compose = RunnableLambda.from(
    (x: { text: string; translation: string; headline: string }) =>
      `${x.headline} | 原文：${x.text} | 译文：${x.translation}`,
  );

  const finalChain = RunnablePassthrough.assign({
    translation: fakeTranslate,
    headline: fakeHeadline,
  }).pipe(compose);

  console.log("\n6️⃣  组合：assign + pipe（= 05 的 finalChain）");
  console.log("   ", await finalChain.invoke({ text: "你好世界，LangChain" }));
}

main();
