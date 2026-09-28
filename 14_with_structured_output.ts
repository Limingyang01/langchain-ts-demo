import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// 07 的做法：prompt 里手写 JSON 格式 → JsonOutputParser → zod 再校验一遍。
// 官方更推荐的做法：model.withStructuredOutput(zodSchema)
//   - 框架自动把 schema 告诉模型（底层用 tool calling 或 JSON mode）
//   - 返回值直接是符合 schema 的 JS 对象，TS 类型也自动推导
//   - 不用在 prompt 里写格式说明
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// 和 07 同一个 schema，方便对比
const reviewSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]).describe("情感倾向"),
  score: z.number().min(0).max(1).describe("强度，0=极弱，1=极强"),
  reason: z.string().describe("为什么这样判断，15 字以内"),
});

async function main() {
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0,
  });

  // ---------- 1. 包一层结构化输出 ----------
  //     name 会作为工具名传给模型（默认走 tool calling）
  const structuredModel = model.withStructuredOutput(reviewSchema, {
    name: "review_analysis",
  });

  // prompt 里不再需要写 JSON 格式说明
  const chain = ChatPromptTemplate.fromMessages([
    ["system", "你是评论情感分析器。"],
    ["human", "{text}"],
  ]).pipe(structuredModel);

  const samples = [
    "这产品太赞了，界面清爽，速度飞快！",
    "售后态度差，等了三天才回复我。",
    "今天去吃了那家新开的拉面馆，味道还行。",
  ];

  for (const text of samples) {
    console.log("\n📝 评论：", text);
    try {
      // result 的类型就是 z.infer<typeof reviewSchema>，不用 as
      const result = await chain.invoke({ text });
      console.log("🧠 分析：", result);
    } catch (err) {
      // 模型不支持 tool calling / 返回不符合 schema 时，zod 校验会抛错
      // 实测 abab6.5s-chat 的工具参数不按 schema 填，这里基本都会失败：
      //   这正是 07 手写 prompt + 校验存在的意义；换 GPT-4o / Claude 等模型即可看到成功效果
      console.log("⚠️ 结构化输出失败（模型能力不足）：", (err as Error).message.slice(0, 120));
    }
  }
}

main();
