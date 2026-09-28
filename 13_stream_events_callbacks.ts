import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// 03 的 .stream() 只能拿到"最后一步"的输出。
// 链一长，你会想知道：每一步什么时候开始、输入输出是什么、模型吐了哪些 token。
//   .streamEvents(input, { version: "v2" }) —— 按事件流拿到链内部每一步
//   callbacks                              —— 在 invoke 时挂钩子，适合打日志 / 统计 token
//   runName                                —— 给步骤起名字，事件和回调里都能看到
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda } from "@langchain/core/runnables";

async function main() {
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0.7,
  });

  // 一条三步链：预处理 → prompt → 模型 → parser
  const clean = RunnableLambda.from((input: { topic: string }) => ({
    topic: input.topic.trim(),
  })).withConfig({ runName: "清洗输入" });

  const chain = clean
    .pipe(
      ChatPromptTemplate.fromMessages([
        ["human", "用两句话介绍 {topic}。"],
      ]),
    )
    .pipe(model)
    .pipe(new StringOutputParser());

  // ---------- 1. streamEvents：看链内部的每一步 ----------
  console.log("--- 1. streamEvents ---");
  const events = chain.streamEvents(
    { topic: "  LangChain  " },
    { version: "v2" },
  );
  for await (const e of events) {
    // 事件名形如 on_chain_start / on_chat_model_stream / on_parser_end
    if (e.event === "on_chat_model_stream") {
      // 模型每吐一个 token 就来一条事件（链里有多个模型时可用 e.name / e.run_id 区分）
      process.stdout.write(String(e.data.chunk?.content ?? ""));
    } else if (e.event.endsWith("_start") || e.event.endsWith("_end")) {
      console.log(`\n   📍 ${e.event.padEnd(22)} ${e.name}`);
    }
  }

  // ---------- 2. callbacks：在 invoke 时挂钩子 ----------
  //     适合做日志、耗时统计、token 计费
  console.log("\n\n--- 2. callbacks ---");
  const startedAt = new Map<string, number>();
  const answer = await chain.invoke(
    { topic: "RAG" },
    {
      callbacks: [
        {
          handleChainStart(_chain, _inputs, runId, _parentRunId, _tags, _metadata, _runType, runName) {
            startedAt.set(runId, Date.now());
            console.log(`   ▶️  开始 ${runName ?? "chain"}`);
          },
          handleChainEnd(_outputs, runId) {
            const ms = Date.now() - (startedAt.get(runId) ?? Date.now());
            console.log(`   ⏹️  结束（${ms}ms）`);
          },
          handleLLMEnd(output) {
            // usage 字段因模型厂商而异，拿不到就是 undefined
            console.log("   🔢 token 用量：", output.llmOutput?.tokenUsage);
          },
          handleChainError(err) {
            console.log("   ❌ 出错：", err.message);
          },
        },
      ],
    },
  );
  console.log("🤖", answer);
}

main();
