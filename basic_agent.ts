import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0.5,
  });
  const poet = "杜甫";
  const theme = "中秋";

  // 创建一个模板
  const poetPrompt = PromptTemplate.fromTemplate(
    "请用{poet}的口吻，写一首{theme}古诗",
  );
  // 把 AIMessage 拆成纯字符串
  const parser = new StringOutputParser();

  const poetChain =  poetPrompt.pipe(model).pipe(parser);

  const poetResult = await poetChain.invoke({
    poet,
    theme,
  });
  console.log("回复类型", typeof poetResult);
  console.log("ai回复:", poetResult);
}
main();
