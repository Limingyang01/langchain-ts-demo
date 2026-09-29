import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";
import { PromptTemplate ,ChatPromptTemplate} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
    // 准备模型
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0.5,
  });
//   抽离常量
  const poet = "杜甫";
  const theme = "中秋";

  // 创建一个模板
//   const poetPrompt = PromptTemplate.fromTemplate(
//     "请用{poet}的口吻，写一首{theme}古诗",
//   );

const poetPrompt=ChatPromptTemplate.fromMessages([
    ["system","你是古诗创作助手，只输出诗本身，不要任何解释"],
    ["human","请用 {poet} 的风格，写一首关于 {theme} 的诗"],
])

  // 只渲染模板、不调用模型，看看最终发给模型的消息数组
  const messages = await poetPrompt.formatMessages({ poet, theme });
  for (const m of messages) {
    console.log(`[${m.getType()}] ${m.content}`);
  }
  console.log("----------");
  // 把 AIMessage 拆成纯字符串
  const parser = new StringOutputParser();

  const poetChain = poetPrompt.pipe(model).pipe(parser);

//   const poetResult = await poetChain.invoke({
//     poet,
//     theme,
//   });

  const poetStreamResult = await poetChain.stream({ poet, theme });

  for await (const chunk of poetStreamResult) {
    process.stdout.write(chunk);
  }
}
main();
