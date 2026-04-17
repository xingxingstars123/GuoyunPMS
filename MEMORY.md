# MEMORY.md - 长期记忆体系 (L0摘要层)

**最后更新：** 2026-04-16 22:50  
**版本：** v2.0 (基于飞书文档升级)  
**维护规则：** 每日检查，每周提炼，每月清理

## 👤 关于OpenClaw

### 身份定位
- **名称**：OpenClaw AI助手
- **工作空间**：`/root/.openclaw/workspace`
- **记忆体系**：双系统架构（Workspace本地 + TDAI云端）
- **设计理念**：分层加载，不全量读取，双系统互补

### 核心能力
1. **feishu-collaboration** - 飞书文档创建和协作
2. **web-tools-guide** - Web工具三级策略（search→fetch→browser）
3. **memory-hygiene** - 记忆维护和优化
4. **长内容处理** - 飞书文档工作流程

## 🏗️ 记忆体系架构

### 双系统并行
```
系统A：Workspace本地记忆（手动维护，精确控制）
系统B：TDAI云端记忆（自动收集，智能检索）
```

### 四层加载结构
```
L0 摘要层 — MEMORY.md（本文件，<200行，每次主会话必读）
L1 领域层 — knowledge/ + projects/ + references/（按需检索）
L2 详情层 — daily/（每日日志，读今天+昨天）
工具层 — scripts/（查询和维护工具）
```

### 七分类法
1. **事实** - 客观信息（如"工作空间路径"）
2. **偏好** - 工作习惯和风格
3. **事件** - 发生过的事情
4. **关系** - 人/系统的关联
5. **观点** - 带判断的认识
6. **目标** - 待完成任务
7. **指令** - 明确的执行要求

## 📋 当前状态

### 活跃项目
1. **记忆体系升级** (2026-04-16 进行中)
   - 已完成：重建INDEX.md、创建facts.jsonl、创建query-facts.sh
   - 进行中：刷新MEMORY.md、更新AGENTS.md
   - 待完成：从TDAI回填daily日志、补建项目文件

### 已完成项目
1. **PMS智能公寓管理系统** (2026-04-15 ✅)
   - Web版原型（Node.js + Vue）
   - H5移动版（纯HTML）
   - uni-app小程序版（v1.1.0）
   - 完整审计报告和交付文档

### 重要工作流程
1. **长内容处理规范** (CRITICAL)
   - 适用：中长流程项目、>5000字回答、复杂技术文档
   - 流程：创建飞书文档 → 写入详细内容 → 发送总结+链接
   - 格式：简要总结（<500字）+ 文档链接

2. **飞书文档创建铁律**
   - 三步法：create → write → read验证
   - 禁止：在create action中传入content参数
   - 验证：blocks_added > 0 且 block_count > 1

## 🔑 关键技术

### 时序事实管理
- **文件**：`memory/knowledge/facts.jsonl` (50条初始事实)
- **格式**：JSONL，每行包含valid_from和ended时间戳
- **查询**：`scripts/query-facts.sh` 支持按实体、关系、日期等查询
- **维护**：事实变更时标记旧记录ended，新增当前记录

### 索引维护
- **文件**：`memory/INDEX.md`
- **规则**：每次创建/删除memory/下文件后必须更新
- **时效**：滞后不超过1天
- **内容**：文件清单、统计概览、更新日志

### 每日日志
- **位置**：`memory/daily/YYYY-MM-DD.md`
- **策略**：启动时读今天+昨天，历史日志按需检索
- **回填**：从TDAI conversations回填缺失日期
- **提炼**：定期从daily提炼关键事实到MEMORY.md

## 🛠️ 维护协议

### 日常维护
- **每次对话**：重要事件写入daily/当天.md
- **每次文件变更**：立即更新INDEX.md
- **事实变更**：更新facts.jsonl（标记旧记录ended）
- **每3-5天**：从daily提炼关键事实到MEMORY.md

### 冲突检测
- 更新事实时先检查MEMORY.md中是否已有相关记录
- 若矛盾：标注 `[更新: YYYY-MM-DD] 旧值→新值`
- 保留变更轨迹，支持时序推理

### 过期管理
- 已完成项目标记 ✅ + 完成日期
- 3个月后从L0（MEMORY.md）移除
- L1/L2永久保留（存储成本极低）
- daily/日志永久保留

## 📊 数据统计

### 本地记忆
```
总文件数：6个
L0摘要：MEMORY.md (v2.0)
L1领域：knowledge/facts.jsonl (50条事实)
L2详情：daily/ (2个文件)
工具脚本：scripts/query-facts.sh
索引文件：INDEX.md
```

### 覆盖范围
- **时间跨度**：2026-04-15 至今
- **项目覆盖**：PMS系统、记忆体系升级
- **技能覆盖**：飞书协作、Web工具、记忆维护
- **流程覆盖**：长内容处理、文档创建

## 🔄 近期计划

### 立即执行 (今晚)
1. ✅ 重建INDEX.md
2. ✅ 创建facts.jsonl + 初始50条事实
3. ✅ 创建query-facts.sh查询脚本
4. 🔄 刷新MEMORY.md L0（本文件）
5. 🔄 更新AGENTS.md维护规则

### 短期计划 (本周内)
1. 从TDAI回填缺失的daily/日志
2. 补建项目文件（按实际项目需求）
3. 建立知识库文件体系
4. 测试时序事实查询功能

### 长期优化
1. 实现自动记忆整理
2. 建立记忆质量评估
3. 开发记忆可视化界面
4. 构建知识图谱

## 🚫 群聊行为规则（CRITICAL）

### 身份澄清
1. **我的身份**：钟洋的专属助理
2. **老钟助手**：钟征的机器人（不是我的身份）
3. **三人群成员**：钟征、爱华、钟洋

### 响应规则
1. **触发条件**：只有在**任何人**明确@我时才响应
2. **禁止响应**：
   - 未@的普通聊天
   - 钟征与其机器人（老钟助手）的交互
   - 群聊中的一般讨论
3. **回复目标**：回复时@消息的原始发送者，不是@消息中提到的其他人

### 错误记录与纠正
- **2026-04-16错误**：响应了钟征@老钟助手的信息，并错误地@老钟助手回复
- **2026-04-17错误**：在飞书群聊中使用错误的@格式发送消息失败
  - 错误做法：使用 `<at id="oc_xxx"></at>` 格式
  - 正确做法：使用飞书富文本格式或卡片格式
  - 详细规则：见 `memory/knowledge/feishu-group-messaging.md`
- **纠正措施**：已学习飞书API文档，创建知识文件，确保未来正确发送消息
- **学习要点**：
  1. 严格区分@目标和回复目标，只响应@我的信息
  2. 使用正确的飞书消息格式，不要混淆HTML格式和API格式

## 📝 快速参考

### 重要文件位置
```
MEMORY.md          — /root/.openclaw/workspace/MEMORY.md
记忆索引          — /root/.openclaw/workspace/memory/INDEX.md
时序事实          — /root/.openclaw/workspace/memory/knowledge/facts.jsonl
查询工具          — /root/.openclaw/workspace/memory/scripts/query-facts.sh
每日日志          — /root/.openclaw/workspace/memory/daily/
```

### 常用查询命令
```bash
# 查询群聊行为规则
./memory/scripts/query-facts.sh --entity "群聊行为" --active

# 查询身份关系
./memory/scripts/query-facts.sh --entity "身份关系" --active

# 查询所有当前有效事实
./memory/scripts/query-facts.sh --active

# 查询特定日期的状态
./memory/scripts/query-facts.sh --date 2026-04-15
```

### 维护检查清单
- [ ] INDEX.md是否最新（滞后<1天）
- [ ] facts.jsonl是否包含最新事实变更
- [ ] MEMORY.md是否反映当前重要状态
- [ ] daily/是否有缺失日期需要回填
- [ ] 项目文件是否完整覆盖活跃项目
- [ ] 群聊行为规则是否清晰明确
- [ ] 身份关系是否准确无误

---

**升级依据：**
1. 《老钟影分身记忆体系架构详解》
2. 《OpenClaw 记忆体系升级方案（可立即执行版）》

**升级时间：** 2026-04-16 22:33-22:50  
**升级状态：** 进行中（完成度：60%）  
**下一步：** 更新AGENTS.md维护规则，测试查询功能