import { ChatOpenAI } from "@langchain/openai";
// verbatimModuleSyntax 下只能用纯副作用 import 写法
import "dotenv/config";

// Tool Calling 能力
import { tool } from "@langchain/core/tools";
import { z } from "zod";

async function main() {
  // 1. 定义一个让 M3 调用的 CRM 系统查询工具
  const getUserOrderTool = tool(
    async ({ userId }) => {
      console.log(
        `\n[系统日志] M3 触发了 TS 工具函数，正在查询用户 ${userId} 的订单...`,
      );
      return JSON.stringify({
        orderId: "ORD-20260918",
        status: "已发货",
        items: ["MiniMax M3 算力充值套餐", "TypeScript 进阶教程"],
        totalPrice: 299,
      });
    },
    {
      name: "get_user_order_by_id",
      description: "当用户想查询某个特定用户 ID 的最新订单详情时使用。",
      schema: z.object({
        userId: z.string().describe("用户的唯一标识符 ID，通常形如 U12345"),
      }),
    },
  );

  // 1. 初始化模型
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0.2,
  });

  // 将工具注入给 MiniMax M3
  const modelWithTools = model.bindTools([getUserOrderTool]);

  console.log("正在向 MiniMax M3 提问...");
  const response = await modelWithTools.invoke(
    "帮我查一下用户 U99823 当前最新的订单状态是什么？",
  );

  // 3. 解析 M3 的思考结果
  if (response.tool_calls && response.tool_calls.length > 0) {
    const call = response.tool_calls[0];
    // noUncheckedIndexedAccess 下 [0] 仍可能是 undefined，显式收窄
    if (!call) {
      throw new Error("M3 返回了 tool_calls，但第一项为空");
    }
    console.log(`\n🎉 M3 成功做出了决策！它决定调用函数: ${call.name}`);
    console.log(`💡 M3 提取出的精确参数为:`, call.args);

    // 4. 执行本地 TS 代码并输出
    const toolResult = await getUserOrderTool.invoke(call);
    // toolResult 可能是 string 或 ToolMessage，统一成字符串再打印
    const resultContent =
      typeof toolResult === "string" ? toolResult : String(toolResult.content);
    console.log("\n📦 数据库最终返回的真实数据给到前端:", resultContent);
  } else {
    console.log("AI 回复:", response.content);
  }
}

main();
