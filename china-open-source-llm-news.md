# 中国开源大模型热点新闻汇总

> **信息时效**：基于公开网络搜索结果整理，事实部分截至 2026 年 1 月；部分链接的发布日期在搜索结果中显示混乱，已优先以"中文权威媒体 / 厂商官方博客 / Hugging Face 模型卡"为准。
> **热度排序依据**：①全球媒体覆盖度（含英伟达股价波动等宏观信号）②Hugging Face 下载量 / Star 数 ③GitHub 趋势 ④国内主流媒体（新华社、央视、36Kr、量子位、机器之心等）报道密度。
> **声明**：本文档由 budingX 自动整理，部分链接为搜索摘要，未逐条人工核验细节，请以官方原文为准。

---

## 🥇 热度 TOP 1：DeepSeek-R1 发布，触发"DeepSeek 时刻"

- **时间**：2025-01-20
- **厂商**：深度求索（DeepSeek，杭州）
- **协议**：MIT License（模型权重 + 训练代码）
- **亮点**：
  - 推理能力对标 OpenAI o1，公开训练全过程（GRPO + 纯强化学习路线）。
  - 衍生生态：R1-Distill 系列蒸馏到 Qwen / Llama 各尺寸，引发社区大量微调项目。
  - 美股 2025-01-27 英伟达单日跌幅近 17%，创历史最大单日市值蒸发；多家外媒将其定性为"Sputnik Moment"。
- **影响**：开源推理模型从"追赶"转入"并跑"，国内大模型 API 价格战正式开打。
- **来源**：
  - <https://api-docs.deepseek.com/news/news250120>
  - <https://github.com/deepseek-ai/DeepSeek-R1>

---

## 🥈 热度 TOP 2：DeepSeek-V3 发布——低成本 MoE 的里程碑

- **时间**：2024-12-26（论文）；2025 年初持续发酵
- **厂商**：深度求索（DeepSeek）
- **协议**：MIT License
- **亮点**：
  - 671B 总参数 / 37B 激活参数的 MoE 架构；多语言基座。
  - 官方披露完整训练成本仅 **557.6 万美元**，远低于同期国际旗舰模型。
  - 综合性能在 LMSYS、BigCodeBench 等榜单跻身全球开源第一梯队。
- **影响**：打破"大模型 = 重资本"的叙事，被多家研究机构作为"高效训练"标杆案例。
- **来源**：
  - <https://github.com/deepseek-ai/DeepSeek-V3>
  - <https://api-docs.deepseek.com/news/news1226>

---

## 🥉 热度 TOP 3：通义千问 Qwen3 系列开源——全尺寸 + 混合思考

- **时间**：2025-04-28
- **厂商**：阿里巴巴通义实验室
- **协议**：Apache 2.0
- **亮点**：
  - 首发即开源 6 款稠密模型 + 2 款 MoE 模型，覆盖 0.6B 到 235B 参数。
  - Qwen3-235B-A22B（MoE 235B / 激活 22B）综合性能比肩 DeepSeek-R1。
  - 首次在开源基座中支持 **"混合思考模式"**（thinking / non-thinking 同一权重切换）。
  - 119 种语言，刷新开源多语言 SOTA。
- **影响**：Hugging Face 当周下载量 Top 1，单日下载量破百万次；阿里"全家桶"生态进一步成型。
- **来源**：
  - <https://qwen.ai/blog?id=qwen3>
  - <https://huggingface.co/Qwen>

---

## 热度 TOP 4：Kimi K2 开源——1 万亿参数 MoE 押注 Agent

- **时间**：2025-07-11
- **厂商**：月之暗面（Moonshot AI，北京）
- **协议**：Modified MIT（可商用，需遵守使用条款）
- **亮点**：
  - 总参数 **1T / 激活 32B** 的 MoE 架构；原生为 Agent / 工具调用 / 代码生成优化。
  - 32B 激活即可在 SWE-Bench / Tau-Bench 等 Agent 评测上超过同期部分 200B+ 稠密模型。
  - 训练引入 **MuonClip** 优化器替代 AdamW，开源社区讨论度极高。
- **影响**：Kimi 由"长上下文应用"路线转向"开源基座 + Agent 平台"路线，重新跻身国内开源第一梯队。
- **来源**：
  - <https://moonshotai.github.io/Kimi-K2/>
  - <https://github.com/MoonshotAI/Kimi-K2>

---

## 热度 TOP 5：智谱 GLM-4.5 / GLM-4.6 全栈开源

- **时间**：2025-07 / 2025-09（4.6 版本）
- **厂商**：智谱 AI（北京）
- **协议**：MIT License
- **亮点**：
  - GLM-4.5：355B 总参数 / 32B 激活的 MoE，"所有模型权重 MIT 协议 + 推理代码开源"，主打"真·完全开放"。
  - 同步开源基座、推理、思考三种权重；支持 Claude / OpenAI 兼容 API。
  - GLM-4.6 在代码、长上下文（200K→1M）和 Agent 能力上进一步升级。
- **影响**：被多家国内媒体评为"对开发者最友好的国产开源旗舰"；首次国产模型大规模进入海外开发者榜单前三。
- **来源**：
  - <https://open.bigmodel.cn/>
  - <https://huggingface.co/THUDM>

---

## 热度 TOP 6：Qwen3-Coder 开源——编程模型进入 480B 时代

- **时间**：2025-07-23
- **厂商**：阿里巴巴通义实验室
- **协议**：Apache 2.0
- **亮点**：
  - 480B 总参数 / 35B 激活的 MoE；原生支持 **256K 上下文**（可扩展到 1M）。
  - 在 SWE-Bench Verified、Aider 等编程评测上对标 Claude Sonnet 4。
  - 配套开源 Qwen Code CLI（基于 Gemini CLI 风格改造）。
- **影响**：编程赛道国产开源首次具备"国际一线"水平；Cursor / Cline / Trae 等编辑器快速集成。
- **来源**：
  - <https://qwen.ai/blog?id=qwen3-coder>
  - <https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct>

---

## 热度 TOP 7：腾讯混元 Hunyuan 系列密集开源

- **时间**：2025 全年（5 月起持续更新）
- **厂商**：腾讯
- **协议**：主要为 Tencent 社区协议（可商用）
- **亮点**：
  - 5 月开源 Hunyuan-A13B、7B 稠密模型，主打"小而强"。
  - 同步开源文生图（HunyuanDiT）、文生 3D（Hunyuan3D-2）、文生视频（HunyuanVideo）多模态全家桶。
  - 2025 年下半年推出 Hunyuan-Large / LongCite 等长上下文与检索增强模型。
- **影响**：腾讯从"闭源应用派"转向"开源生态派"，多模态开源矩阵最齐全的国内大厂之一。
- **来源**：
  - <https://huggingface.co/tencent>
  - <https://github.com/Tencent-Hunyuan>

---

## 热度 TOP 8：字节跳动 Seed / 豆包开源矩阵

- **时间**：2025 年（持续）
- **厂商**：字节跳动 Seed 团队
- **协议**：Apache 2.0 / 自有协议混用
- **亮点**：
  - 1 月发布 Doubao-1.5-pro（闭源旗舰），同步开源 Seed-OSS 系列。
  - Doubao-1.5-pro 在多项基准上首次超越同期国内闭源旗舰。
  - 多模态方向开源 Seed-X、SeedASR 等专用模型。
- **影响**：字节在国内"应用层 + 模型层"双线推进；Seed 团队成为大厂开源最活跃的团队之一。
- **来源**：
  - <https://huggingface.co/ByteDance-Seed>
  - <https://github.com/bytedance>

---

## 热度 TOP 9：DeepSeek V3.1 / V3.2-Exp 实验性更新

- **时间**：2025-08 / 2025-09
- **厂商**：深度求索
- **协议**：MIT
- **亮点**：
  - V3.1：128K 原生长上下文 + 增强 Agent / 工具调用能力。
  - V3.2-Exp：实验性引入 **DSA（DeepSeek Sparse Attention）**——在长文本下显著降低推理成本。
  - 同步推出"年中优惠"，API 价格逼近"成本价"。
- **影响**：稀疏注意力被开源化验证，成为 2025 下半年主流 MoE 模型标配（如 GLM-4.6、Kimi K2-0905 跟进）。
- **来源**：
  - <https://api-docs.deepseek.com/news/news250821>
  - <https://api-docs.deepseek.com/news/news250929>

---

## 热度 TOP 10：百川 / 零一万物 / 面壁等"老牌开源"持续迭代

- **厂商**：百川智能、零一万物（Yi）、面壁智能（CPM / MiniCPM）
- **亮点**：
  - 百川 4 / Baichuan 4：长上下文 + 企业级 RAG。
  - Yi 系列（零一万物）：1.5 / 2.0 多尺寸开源，长期位居 Hugging Face 中文榜前 10。
  - MiniCPM 系列（面壁 + 清华）：主打端侧 / 终端部署，2B / 4B 级别跑出 7B+ 性能，被开发者社区戏称"小钢炮"。
- **影响**：构成中国开源大模型的"中坚层"——既不像 DeepSeek/Qwen 那样高曝光，又长期稳定输出。
- **来源**：
  - <https://huggingface.co/01-ai>
  - <https://huggingface.co/OpenBMB>

---

## 热度 TOP 11：华为盘古 + 昇腾开源生态

- **时间**：2025 全年
- **厂商**：华为
- **协议**：自研昇思 MindSpore 生态，部分模型开源
- **亮点**：
  - 盘古大模型 5.0 升级；同步开放盘古 NLP / 多模态 / 预测 / 科学计算四套模型。
  - 与昇腾芯片深度绑定，构建"全国产软硬件栈"参考实现。
  - DeepSeek 等头部开源模型陆续发布昇腾适配版本。
- **影响**：在国产化替代 / 政企市场形成与英伟达 + 主流开源框架并列的"第二条路径"。
- **来源**：
  - <https://www.huaweicloud.com/product/pangu.html>
  - <https://gitee.com/mindspore>

---

## 热度 TOP 12：中国信通院《开源大模型评测标准》与"人工智能+"政策

- **时间**：2025 年中
- **机构**：中国信息通信研究院、国务院《政府工作报告》"人工智能+"行动
- **亮点**：
  - 信通院发布开源大模型评估方法，覆盖能力 / 安全 / 工程化 / 生态 4 个维度。
  - 多地（北京、上海、深圳、杭州、成都）出台算力券、模型券政策，明确鼓励开源模型使用。
  - 国家网信办备案通过的国产大模型累计超 200 款，其中开源占比超 60%。
- **影响**：中国开源大模型从"技术叙事"进入"标准 + 政策叙事"阶段。
- **来源**：
  - <http://www.caict.ac.cn/>
  - <http://www.gov.cn/>

---

## 📊 总体趋势观察

1. **"开源即顶配"**：DeepSeek-R1 之后，"开源 = 顶配"的认知被反复验证，2025 年下半年几乎所有头部厂商旗舰版本均开源。
2. **MoE 成为主战场**：除少数"端侧小模型"外，Top 级国产开源模型清一色为 MoE；激活参数稳定在 22B–35B 区间。
3. **Agent / Coding 双赛道**：Qwen3-Coder、Kimi K2、GLM-4.6、DeepSeek-V3.1 集中押注工具调用与软件工程。
4. **价格战 → 成本战**：DeepSeek API 击穿 1 元 / 百万 tokens，迫使其他厂商跟进；行业从"补贴"走向"推理架构优化（DSA / 投机解码）"。
5. **多模态 / 全模态**：Qwen2.5-Omni、混元系列、Seed 系列把文本 / 视觉 / 音频 / 视频统一权重开源，与国际厂商拉齐节奏。
6. **国产算力适配**：DeepSeek、Qwen、GLM 均提供昇腾 / 寒武纪 / 海光 训练 / 推理适配脚本，国产化栈加速闭环。

---

## 📎 参考资料汇总

| 厂商 / 机构    | 模型主页                      | Hugging Face                            | GitHub                               |
| -------------- | ----------------------------- | --------------------------------------- | ------------------------------------ |
| 深度求索       | <https://deepseek.com>        | <https://huggingface.co/deepseek-ai>    | <https://github.com/deepseek-ai>     |
| 阿里通义       | <https://qwen.ai>             | <https://huggingface.co/Qwen>           | <https://github.com/QwenLM>          |
| 月之暗面       | <https://www.moonshot.cn>     | <https://huggingface.co/moonshotai>     | <https://github.com/MoonshotAI>      |
| 智谱 AI        | <https://www.zhipuai.cn>      | <https://huggingface.co/THUDM>          | <https://github.com/THUDM>           |
| 腾讯混元       | <https://hunyuan.tencent.com> | <https://huggingface.co/tencent>        | <https://github.com/Tencent-Hunyuan> |
| 字节 Seed      | <https://seed.bytedance.com>  | <https://huggingface.co/ByteDance-Seed> | <https://github.com/bytedance>       |
| 零一万物       | <https://www.lingyiwanwu.com> | <https://huggingface.co/01-ai>          | <https://github.com/01-ai>           |
| 面壁 / OpenBMB | <https://www.openbmb.cn>      | <https://huggingface.co/OpenBMB>        | <https://github.com/OpenBMB>         |
| 百川智能       | <https://www.baichuan-ai.com> | <https://huggingface.co/baichuan-inc>   | —                                    |

---

> **致用户**：如需我对某一条新闻深挖（如 DeepSeek-R1 的技术细节、Qwen3 与 Llama 4 对比、GLM-4.6 的 MIT 协议条款等），告诉我即可，我可以继续搜索 + 抓取官方原文。
