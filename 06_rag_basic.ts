import { ChatOpenAI } from "@langchain/openai";
// 副作用 import：自动加载 .env
import "dotenv/config";

// RAG 五件套：
//   DocumentLoader    —— 把文件/网页/数据库内容读进来变成 Document 数组
//   TextSplitter      —— 把长 Document 切成短 Chunk（嵌入有输入长度限制）
//   Embeddings        —— 把文本转成"向量"（一串数字，相似文本距离近）
//   VectorStore       —— 把向量存起来，支持"按相似度查找"
//   Retriever         —— VectorStore 的薄包装，统一对外提供 retrieve(query)
import { Document } from "@langchain/core/documents";
import { FakeEmbeddings } from "@langchain/core/utils/testing";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda } from "@langchain/core/runnables";

// ---------- 1. 准备一份"知识库" ----------
//    真实场景会用 TextLoader/CSVLoader/PDFLoader 读文件；
//    demo 里直接用字符串当文档源。
const RAW_DOCS = `
---
LangChain 是一个用于构建 LLM 应用的框架。它提供了 Prompt、Model、Parser、Retriever 等可组合模块，核心思想是 LCEL：用 .pipe() 把多个 Runnable 拼成一条链。
---
LCEL 全称 LangChain Expression Language。任何实现了 Runnable 接口的对象（PromptTemplate、模型、Parser、整条链）都可以用 .pipe() 串起来，自动获得 invoke / stream / batch 能力。
---
RAG 全称 Retrieval-Augmented Generation。流程是：先从向量库里检索相关文档片段，再让模型参考这些片段回答。比"模型直接答"的优点是：能基于私有 / 最新数据回答。
---
LangGraph 是 LangChain 团队推出的有状态图框架，专门做多步 Agent 和工作流。它把每一步建模成 node，把控制流建模成 edge，可以表达循环、分支、人在回路等复杂模式。
---
向量数据库常见的有 Chroma、Weaviate、Pinecone、pgvector。MemoryVectorStore 这种内存版适合教学和小 demo。
---
`;

function loadDocs(): Document[] {
  // 用 --- 把整篇切成多段（去掉首尾的空段）
  const chunks = RAW_DOCS.split(/\n---\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return chunks.map(
    (pageContent, i) =>
      new Document({
        pageContent,
        metadata: { source: "内置知识库", chunkId: i },
      }),
  );
}

// ---------- 2. 切分器（手写，最简版"按长度切"） ----------
//    真实场景会用 RecursiveCharacterTextSplitter（递归按 \n / 。 / 空格 切）
function splitByChars(docs: Document[], maxChars = 120): Document[] {
  const out: Document[] = [];
  for (const d of docs) {
    const text = d.pageContent;
    if (text.length <= maxChars) {
      out.push(d);
      continue;
    }
    for (let i = 0; i < text.length; i += maxChars) {
      out.push(
        new Document({
          pageContent: text.slice(i, i + maxChars),
          metadata: d.metadata,
        }),
      );
    }
  }
  return out;
}

// ---------- 3. 自写一个内存向量库（避免依赖外部 vector store） ----------
//    思路：每段 Document 调一次 embeddings → 拿到向量 → 存起来
//    检索时：对 query 也算 embedding，然后和库中所有向量算余弦相似度，取 top-k
interface IndexedDoc {
  doc: Document;
  vector: number[];
}

async function buildVectorStore(docs: Document[]) {
  // FakeEmbeddings 是 demo 用的"假嵌入"，返回固定长度全零向量
  // 注意：所有向量都一样 → 相似度全是 0 → 取的是前 k 个（仍然能看到完整 RAG 流程）
  // 真实业务务必换成 OpenAIEmbeddings / HuggingFaceEmbeddings 等真嵌入
  const embeddings = new FakeEmbeddings();
  const vectors = await embeddings.embedDocuments(
    docs.map((d) => d.pageContent),
  );
  const indexed: IndexedDoc[] = docs.map((doc, i) => ({
    doc,
    // strict 模式下 vectors[i] 是 number[] | undefined；用 ?? [] 兜底
    vector: vectors[i] ?? [],
  }));
  return {
    // 简单相似度检索
    async similaritySearch(query: string, k: number): Promise<Document[]> {
      const qVec = await embeddings.embedQuery(query);
      const scored = indexed.map((item) => ({
        doc: item.doc,
        score: cosine(qVec, item.vector),
      }));
      scored.sort((a, b) => b.score - a.score); // 降序
      return scored.slice(0, k).map((s) => s.doc);
    },
  };
}

// 余弦相似度（值越接近 1 越相似）
function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

// ---------- 4. 拼成 RAG 链 ----------
function buildRagChain(retriever: {
  similaritySearch(q: string, k: number): Promise<Document[]>;
}) {
  const model = new ChatOpenAI({
    modelName: "abab6.5s-chat",
    temperature: 0,
  });
  const parser = new StringOutputParser();

  const ragPrompt = PromptTemplate.fromTemplate(`
你是一个问答助手，只能根据"参考片段"回答，不要编造。
如果参考片段里没有答案，就直说"我不确定"。

【参考片段】
{context}

【问题】
{question}

【回答】`);

  // 第 1 步（RunnableLambda）：输入 { question } → 输出 { question, context }
  //   这里把"调用 retriever → 拼 context"包装成 Runnable，方便拼进 LCEL
  const retrieveStep = RunnableLambda.from(
    async (input: { question: string }) => {
      const docs = await retriever.similaritySearch(input.question, 2);
      const context = docs.map((d) => d.pageContent).join("\n---\n");
      return { question: input.question, context };
    },
  );

  // 用 .pipe() 拼成一条链
  const chain = retrieveStep.pipe(ragPrompt).pipe(model).pipe(parser);

  return chain;
}

async function main() {
  // A. 准备文档
  const chunks = splitByChars(loadDocs(), 120);
  console.log(`📄 文档切分结果：共 ${chunks.length} 段`);
  chunks.forEach((d, i) =>
    console.log(`   [${i}] ${d.pageContent.slice(0, 30)}...`),
  );

  // B. 入向量库
  const vectorStore = await buildVectorStore(chunks);

  // C. 拼 RAG 链
  const chain = buildRagChain(vectorStore);

  // D. 跑两轮看效果
  const q1 = "LCEL 是什么？";
  console.log(`\n🔎 提问 1：${q1}`);
  console.log("🤖 回答 1：", await chain.invoke({ question: q1 }));

  const q2 = "RAG 是怎么工作的？";
  console.log(`\n🔎 提问 2：${q2}`);
  console.log("🤖 回答 2：", await chain.invoke({ question: q2 }));

  const q3 = "今天北京天气怎么样？";
  console.log(`\n🔎 提问 3：${q3}`);
  console.log("🤖 回答 3：", await chain.invoke({ question: q3 }));
}

main();
