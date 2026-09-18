import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// 这次我们要"让模型直接吐出 JSON 并校验"，用到：
//   z                —— TS 界的 schema 校验库
//   JsonOutputParser —— @langchain/core 自带：把模型输出变成 JS 对象（不校验）
//   自己用 zod 安全解析 —— 在 parser 之后再校验一道
import { z } from "zod";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// ---------- 1. 用 zod 定义"输出长什么样" ----------
//    含义：模型必须吐一个 { sentiment: "positive|negative|neutral", score: 0-1, reason: "..." }
//    任意字段缺失 / 类型不对都会被 zod 抓住
const reviewSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]).describe("情感倾向"),
  score: z.number().min(0).max(1).describe("强度，0=极弱，1=极强"),
  reason: z.string().describe("为什么这样判断，15 字以内"),
});

// 类型推导：把 schema 转成 TS 类型，下游代码就有强类型
type ReviewAnalysis = z.infer<typeof reviewSchema>;

// ---------- 2. JsonOutputParser ----------
//     只负责把模型输出变成 JS 对象；schema 校验我们手写
const parser = new JsonOutputParser<ReviewAnalysis>();

async function main() {
  // 强制 JSON 输出（依赖底层 OpenAI 兼容接口支持 response_format，不支持的话降级去掉）
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0,
  });

  // 把 schema 直接写进 prompt，比靠 formatInstructions 注入更可控
  const prompt = PromptTemplate.fromTemplate(`
请分析下面这条评论的情感，并按下面规定的 JSON 格式输出（不要任何额外文字）：

【评论】
{text}

【输出格式】（字段必须齐全）
{{
  "sentiment": "positive" 或 "negative" 或 "neutral",
  "score": 0 到 1 之间的小数（0=极弱，1=极强）,
  "reason": "为什么这样判断，15 字以内"
}}
`);

  // ---------- 4. 拼链：prompt → 模型 → JsonOutputParser ----------
  //     链的输出是 unknown（parser 只保证是 JSON，不保证符合 schema）
  const chain = prompt.pipe(model).pipe(parser);

  const samples = [
    "这产品太赞了，界面清爽，速度飞快！",
    "售后态度差，等了三天才回复我。",
    "今天去吃了那家新开的拉面馆，味道还行。",
    "用 Vue 写前端，React 写后台，LangChain 写 demo，挺好。",
  ];

  for (const text of samples) {
    console.log("\n----------------------------------------");
    console.log("📝 评论：", text);

    // 5-1) 拿原始 JSON（链里已经拼好 prompt，无需 format_instructions 占位）
    const raw = (await chain.invoke({ text })) as unknown;

    // 5-2) 用 zod 安全解析：成功 → 直接用；失败 → 打日志不抛
    const parsed = reviewSchema.safeParse(raw);
    if (!parsed.success) {
      console.log("⚠️ 模型输出不符合 schema：", parsed.error.issues);
      console.log("   原始输出：", raw);
      continue;
    }
    const result: ReviewAnalysis = parsed.data;
    console.log("🧠 分析：", result);
    console.log(`   sentiment = ${result.sentiment}, score = ${result.score}`);
  }
}

main();
