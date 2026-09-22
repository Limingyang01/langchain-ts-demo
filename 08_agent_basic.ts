import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// Agent 入门 —— 自己写一个"最小 tool-calling 循环"
//   跟 01 的差别：01 是"手动调一次工具"，Agent 是"模型自主决定调几次"
//
// 关键原语：
//   ChatPromptTemplate     —— 多角色 prompt（system / human / placeholder）
//   tool()                 —— 用 zod schema 描述参数的工具
//   model.bindTools(tools) —— 让模型知道有哪些工具可用
//   AIMessage.tool_calls   —— 模型决定要调的工具列表（每轮可能多个）
//   ToolMessage             —— 把工具执行结果回传给模型
import { tool } from "@langchain/core/tools";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { RunnableLambda } from "@langchain/core/runnables";
import type { ToolCall } from "@langchain/core/messages/tool";
import { z } from "zod";

// ---------- 1. 准备两个工具 ----------
const getOrderTool = tool(
  async ({ userId }: { userId: string }) => {
    const db: Record<string, object> = {
      U001: { userId: "U001", product: "MacBook Pro", status: "已发货" },
      U002: { userId: "U002", product: "iPhone 16", status: "待发货" },
    };
    return JSON.stringify(db[userId] ?? { error: "用户不存在" });
  },
  {
    name: "get_order",
    description: "根据用户ID查询订单信息，输入形如 'U001'",
    schema: z.object({ userId: z.string().describe("用户ID，例如 U001") }),
  },
);

const addTool = tool(
  async ({ a, b }: { a: number; b: number }) => String(a + b),
  {
    name: "add",
    description: "把两个数相加，输入 a 和 b",
    schema: z.object({
      a: z.number().describe("第一个数"),
      b: z.number().describe("第二个数"),
    }),
  },
);

const tools = [getOrderTool, addTool];
// Map 的 value 用 (typeof tools)[number] 才能让 invoke 不被 union 卡住
const toolsByName = new Map<string, (typeof tools)[number]>(
  tools.map((t) => [t.name, t]),
);

// 兼容个别模型（如 abab6.5s-chat）不按结构化 tool_calls 返回，
// 而把调用写成了正文里的 code block，例如：
//   ```typescript
//   functions.add({"a":9999,"b":1999})
//   ```
// 这里把它解析回 { name, args }，解析不到返回 null。
function parseTextToolCall(
  content: string,
): { name: string; args: Record<string, unknown> } | null {
  const cleaned = content.replace(/```[\w-]*\n?/g, ""); // 去掉 markdown 代码围栏
  const m = cleaned.match(/functions\.([A-Za-z_]\w*)\s*\((\{[\s\S]*\})\)/);
  if (!m || !m[1] || !m[2]) return null;
  try {
    const args = JSON.parse(m[2]) as Record<string, unknown>;
    return { name: m[1], args };
  } catch {
    return null;
  }
}

async function main() {
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0,
  }).bindTools(tools); // 模型知道有哪些工具可用

  // ---------- 2. 准备 prompt ----------
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个能调用工具的助手。需要时主动调用工具，不要瞎编数据。"],
    ["human", "{input}"],
  ]);

  // ---------- 3. 拼出一个"对话生成器" Runnable ----------
  //     输入 {userPrompt: "..."} → 输出 [messages]（带 system + human）
  const toMessages = RunnableLambda.from(async (input: { input: string }) => {
    const messages = await prompt.formatMessages({ input: input.input });
    return messages;
  });

  // ---------- 4. Agent 循环（AgentExecutor 的最简实现）----------
  //     思路：
  //     1) 让模型看当前消息列表，给出下一步（要么 AIMessage 附带 tool_calls，要么纯文本）
  //     2) 如果有 tool_calls → 逐个执行 → 把结果包成 ToolMessage 追加进消息 → 再回到 1
  //     3) 如果没有 tool_calls → 模型认为"答完了"，输出最终答案
  async function runAgent(userInput: string): Promise<string> {
    let messages = await toMessages.invoke({ input: userInput });
    const maxRounds = 5; // 防止无限循环
    for (let round = 0; round < maxRounds; round++) {
      console.log(`\n🔁 第 ${round + 1} 轮 · 消息条数 ${messages.length}`);
      const aiMsg = (await model.invoke(messages)) as AIMessage;
      let toolCalls: ToolCall[] = aiMsg.tool_calls ?? [];
      console.log(
        `   模型回复：content=${JSON.stringify(aiMsg.content)}, tool_calls=${toolCalls.length}`,
      );
      // 兼容：模型没走结构化 tool_calls，而把调用写成了正文 code block
      // （abab6.5s-chat 在复合问题里出现过：functions.add({...})）
      if (toolCalls.length === 0) {
        const raw =
          typeof aiMsg.content === "string"
            ? aiMsg.content
            : JSON.stringify(aiMsg.content);
        const textCall = parseTextToolCall(raw);
        if (textCall) {
          const syntheticCall: ToolCall = {
            name: textCall.name,
            args: textCall.args,
            id: `text-r${round}`,
            type: "tool_call",
          };
          // 升级成结构化 tool_call，保证后面追加的 ToolMessage 与 tool_call_id 匹配
          aiMsg.tool_calls = [syntheticCall];
          toolCalls = [syntheticCall];
          console.log(
            `   ↩️  模型把调用写成了文本，按工具调用处理：${textCall.name}`,
          );
        }
      }
      // 没有工具调用 → 模型给了最终答案，结束
      if (toolCalls.length === 0) {
        const final =
          typeof aiMsg.content === "string"
            ? aiMsg.content
            : JSON.stringify(aiMsg.content);
        return final;
      }
      // 有工具调用 → 执行 + 把结果追加进消息
      messages = [...messages, aiMsg];
      for (const call of toolCalls) {
        const t = toolsByName.get(call.name);
        if (!t) {
          messages.push(
            new ToolMessage({
              tool_call_id: call.id ?? "",
              name: call.name,
              content: `未知工具 ${call.name}`,
            }),
          );
          continue;
        }
        // 两个工具的 invoke 签名 union 不兼容，cast 成统一签名
        const toolIface = t as unknown as {
          invoke: (input: Record<string, unknown>) => Promise<unknown>;
        };
        const result = await toolIface.invoke(
          call.args as Record<string, unknown>,
        );
        console.log(
          `   🛠️  执行工具 ${call.name}(${JSON.stringify(call.args)}) → ${result}`,
        );
        messages.push(
          new ToolMessage({
            tool_call_id: call.id ?? "",
            name: call.name,
            content: String(result),
          }),
        );
      }
    }
    return "(达到最大轮次仍未给出答案)";
  }

  // ---------- 5. 跑 3 个不同问题 ----------
  console.log("=== 问题 1：查订单 ===");
  console.log("💬", await runAgent("帮我查一下 U001 的订单状态"));

  console.log("\n=== 问题 2：算加法 ===");
  console.log("💬", await runAgent("123 加 456 等于多少？"));

  console.log("\n=== 问题 3：复合问题（两轮工具） ===");
  console.log(
    "💬",
    await runAgent("查一下 U002 的订单，再算一下它商品价 9999 和 1999 的和"),
  );
}

main();
