# 🏨 PMS 项目开发 - 入口指南

## 📖 快速导航

| 想要... | 看这个文档 | 命令/路径 |
|---------|-----------|----------|
| **5分钟上手** | `DEMO_USAGE.md` | `cat DEMO_USAGE.md` |
| **了解完整方案** | `pms-project-plan.md` | `cat pms-project-plan.md` |
| **查看开发流程** | `pms-dev-workflow.md` | `cat pms-dev-workflow.md` |
| **图片辅助开发** | `ui-analysis-prompt.md` | `cat ui-analysis-prompt.md` |
| **总览与索引** | `PMS_INDEX.md` | `cat PMS_INDEX.md` |

## ⚡ 3 步开始

```bash
# 1️⃣ 设置 API 密钥
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# 2️⃣ 运行快速启动
./quick-start.sh

# 3️⃣ 生成第一个组件
cd smart-pms
./scripts/ask-claude.sh "实现首页仪表盘组件" > frontend/HomePage.vue
```

## 📁 文档结构

```
~/.openclaw/workspace/
├── README_PMS.md          ← 【你在这里】入口指南
├── PMS_INDEX.md           ← 完整索引和路线图
├── DEMO_USAGE.md          ← 实战演示和最佳实践
├── pms-project-plan.md    ← 技术方案（架构、数据库、API）
├── pms-dev-workflow.md    ← 开发工作流（自动化脚本）
├── ui-analysis-prompt.md  ← UI 分析与图片使用
├── quick-start.sh         ← 一键启动脚本 ⭐
├── start-pms-dev.sh       ← 启动 Claude Code 会话
└── smart-pms/             ← 项目目录（运行 quick-start.sh 后创建）
    ├── backend/           ← NestJS 后端
    ├── frontend/          ← Vue 3 前端
    ├── database/          ← 数据库脚本
    ├── docs/              ← API 文档
    ├── design/            ← UI 参考图
    └── scripts/           ← 辅助脚本
        └── ask-claude.sh  ← AI 编程助手 ⭐
```

## 💡 使用场景

### 场景 1：我是新手，想快速看效果

```bash
# 直接看演示文档
cat DEMO_USAGE.md | less

# 或者运行示例
./quick-start.sh
cd smart-pms
./scripts/ask-claude.sh "生成一个简单的登录页面" > test.vue
cat test.vue
```

### 场景 2：我要评估技术方案

```bash
# 查看完整技术方案
cat pms-project-plan.md | less

# 重点关注：
# - 技术架构（第二部分）
# - 数据库设计（核心表）
# - 成本估算（最后部分）
```

### 场景 3：我要开始开发了

```bash
# 1. 阅读开发工作流
cat pms-dev-workflow.md | less

# 2. 运行快速启动
./quick-start.sh

# 3. 开始编码
cd smart-pms

# 生成数据库 Schema
./scripts/ask-claude.sh "生成完整的数据库 schema" > database/schema.sql

# 生成首页
./scripts/ask-claude.sh "实现首页组件" > frontend/HomePage.vue

# 生成 API 控制器
./scripts/ask-claude.sh "实现房间管理 API" > backend/RoomsController.ts
```

### 场景 4：我想了解如何用图片辅助开发

```bash
# 查看 UI 分析指南
cat ui-analysis-prompt.md | less

# 重点：三种图片上传方式
```

## 🎯 推荐阅读顺序

### 第一次接触（30分钟）
1. **README_PMS.md** ← 当前文档（5分钟）
2. **PMS_INDEX.md** - 完整索引（10分钟）
3. **DEMO_USAGE.md** - 快速开始（15分钟）

### 准备开发（2小时）
1. **pms-project-plan.md** - 技术方案（1小时）
2. **pms-dev-workflow.md** - 开发流程（30分钟）
3. **ui-analysis-prompt.md** - 图片使用（30分钟）

### 正式开发（持续）
1. 运行 `./quick-start.sh`
2. 使用 `./scripts/ask-claude.sh` 生成代码
3. 迭代优化、测试、部署

## 🔑 前提条件

### 必需
- ✅ Claude API 密钥（from https://console.anthropic.com/）
- ✅ Linux/macOS 环境（或 WSL）
- ✅ Python 3 + anthropic 包（已安装 ✓）

### 可选（开发时需要）
- Node.js 18+ （用于前后端开发）
- PostgreSQL 15+ （数据库）
- Docker （容器化部署）
- Git （版本控制）

## ❓ 常见问题

### Q: 我没有 Claude API 密钥怎么办？
A: 访问 https://console.anthropic.com/ 注册并获取。新用户有免费额度。

### Q: 生成的代码能直接用吗？
A: 需要人工审查和测试。AI 生成的代码是很好的起点，但不是最终版本。

### Q: 如何修改生成的代码？
A: 两种方式：
1. 直接编辑文件
2. 要求 AI 优化：`./scripts/ask-claude.sh "优化 HomePage.vue，添加错误处理"`

### Q: 图片识别不准确怎么办？
A: 提供更详细的文字描述，或分解任务逐步实现。

### Q: 项目太大，从哪里开始？
A: 建议顺序：
1. 数据库设计
2. 后端 API（房间管理）
3. 前端页面（首页 → 房态日历 → 订单管理）
4. 渠道对接
5. 测试与优化

## 🎉 开始你的开发之旅

```bash
# 准备好了吗？
export ANTHROPIC_API_KEY=your_api_key_here
./quick-start.sh

# 然后查看下一步提示
# 或继续阅读 DEMO_USAGE.md
```

---

**有问题？**
- 查看各个文档的"常见问题"部分
- 或询问我（你的 AI 助手）🤖

**祝开发顺利！** 🚀
