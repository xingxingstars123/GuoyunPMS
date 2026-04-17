#!/bin/bash
# PMS 项目开发启动脚本

echo "🚀 启动 PMS 项目开发环境..."

# 1. 检查 API 密钥
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  未设置 ANTHROPIC_API_KEY"
    echo "请运行: export ANTHROPIC_API_KEY=your_key_here"
    exit 1
fi

# 2. 创建项目目录
PROJECT_DIR="$HOME/.openclaw/workspace/smart-pms"
mkdir -p "$PROJECT_DIR"/{backend,frontend,database,docs,design}

echo "📁 项目目录: $PROJECT_DIR"

# 3. 启动 Claude Code 会话
echo "🤖 启动 Claude Code 开发会话..."

# 使用 OpenClaw ACP 运行时
openclaw sessions spawn \
  --runtime acp \
  --agent-id claude-code \
  --mode session \
  --label "pms-development" \
  --task "开发智能公寓管理系统 (PMS)。参考文档: $HOME/.openclaw/workspace/pms-project-plan.md"

echo "✅ 开发环境已启动！"
echo ""
echo "下一步："
echo "1. 上传 UI 设计图到会话"
echo "2. 使用 'openclaw sessions list' 查看会话"
echo "3. 使用 'openclaw sessions send' 发送开发任务"
