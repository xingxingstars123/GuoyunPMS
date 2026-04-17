#!/bin/bash
# PMS 项目快速启动脚本

set -e

echo "🏨 智能公寓管理系统 (Smart PMS) - 快速启动"
echo ""

# 1. 检查环境
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ 未设置 ANTHROPIC_API_KEY"
    echo ""
    echo "请先设置你的 Claude API 密钥："
    echo "  export ANTHROPIC_API_KEY=sk-ant-xxxxx"
    echo ""
    exit 1
fi

echo "✅ API 密钥已设置"

# 2. 创建项目目录
PROJECT_ROOT="$HOME/.openclaw/workspace/smart-pms"
mkdir -p "$PROJECT_ROOT"/{backend,frontend,database,docs,design,scripts}

echo "✅ 项目目录已创建: $PROJECT_ROOT"

# 3. 保存 UI 参考图
UI_REF="$PROJECT_ROOT/design/ui-reference.jpg"
if [ -f "/root/.openclaw/media/inbound/e35783a4-e006-4534-8c78-c9279ec86428.jpg" ]; then
    cp /root/.openclaw/media/inbound/e35783a4-e006-4534-8c78-c9279ec86428.jpg "$UI_REF"
    echo "✅ UI 参考图已保存: $UI_REF"
else
    echo "⚠️  未找到 UI 参考图，请手动上传到: $UI_REF"
fi

# 4. 创建开发辅助脚本
cat > "$PROJECT_ROOT/scripts/ask-claude.sh" << 'ASK_SCRIPT'
#!/bin/bash
# 向 Claude Code 发送开发任务的便捷脚本

TASK="$1"
UI_IMAGE="$HOME/.openclaw/workspace/smart-pms/design/ui-reference.jpg"

if [ -z "$TASK" ]; then
    echo "用法: ./ask-claude.sh '你的开发任务'"
    exit 1
fi

# 使用 Python 调用 Anthropic API
python3 << PYTHON
import anthropic
import base64
import os

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# 读取图片
with open("$UI_IMAGE", "rb") as f:
    image_data = base64.b64encode(f.read()).decode("utf-8")

# 发送请求
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_data
                }
            },
            {
                "type": "text",
                "text": """$TASK

技术栈：
- 前端：Vue 3 + TypeScript + Element Plus
- 后端：NestJS + TypeScript + PostgreSQL
- 样式：参考附图的蓝色渐变主题

要求：
- 提供完整可运行的代码
- 包含必要的注释
- 遵循最佳实践
"""
            }
        ]
    }]
)

print(response.content[0].text)
PYTHON
ASK_SCRIPT

chmod +x "$PROJECT_ROOT/scripts/ask-claude.sh"
echo "✅ 辅助脚本已创建: $PROJECT_ROOT/scripts/ask-claude.sh"

# 5. 初始化 Git 仓库
cd "$PROJECT_ROOT"
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git 仓库已初始化"
fi

# 6. 创建 README
cat > "$PROJECT_ROOT/README.md" << 'README'
# Smart PMS - 智能公寓管理系统

## 快速开始

### 1. 使用辅助脚本开发

```bash
# 生成首页组件
./scripts/ask-claude.sh "生成首页仪表盘组件，包含营业额统计和功能入口"

# 生成数据库 Schema
./scripts/ask-claude.sh "生成完整的数据库表结构（PostgreSQL）"

# 生成 API 控制器
./scripts/ask-claude.sh "生成房间管理的 NestJS 控制器，包含 CRUD 操作"
```

### 2. 手动开发

参考以下文档：
- `~/openclaw/workspace/pms-project-plan.md` - 完整技术方案
- `~/openclaw/workspace/pms-dev-workflow.md` - 开发工作流
- `~/openclaw/workspace/ui-analysis-prompt.md` - UI 分析指南

### 3. 项目结构

```
smart-pms/
├── backend/          # NestJS 后端
├── frontend/         # Vue 3 前端
├── database/         # 数据库脚本
├── docs/             # 文档
├── design/           # UI 设计图
└── scripts/          # 辅助脚本
```

## 开发任务

- [ ] 数据库设计
- [ ] 后端 API 开发
- [ ] 前端页面开发
- [ ] OTA 渠道对接
- [ ] 测试与部署

## 技术栈

- **前端**: Vue 3 + TypeScript + Element Plus
- **后端**: NestJS + TypeScript
- **数据库**: PostgreSQL + Redis
- **部署**: Docker + Nginx
README

echo "✅ README 已创建"

# 7. 显示下一步操作
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 项目初始化完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📂 项目目录: $PROJECT_ROOT"
echo ""
echo "🚀 下一步操作："
echo ""
echo "1️⃣  查看技术方案："
echo "   cat ~/openclaw/workspace/pms-project-plan.md"
echo ""
echo "2️⃣  生成首页组件："
echo "   cd $PROJECT_ROOT"
echo "   ./scripts/ask-claude.sh '实现首页仪表盘组件' > frontend/HomePage.vue"
echo ""
echo "3️⃣  生成数据库 Schema："
echo "   ./scripts/ask-claude.sh '生成数据库表结构' > database/schema.sql"
echo ""
echo "4️⃣  查看开发工作流："
echo "   cat ~/openclaw/workspace/pms-dev-workflow.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 提示："
echo "   - ask-claude.sh 脚本会自动附带 UI 参考图"
echo "   - 生成的代码建议先审查再使用"
echo "   - 需要 Python 3 环境（已安装 anthropic 包）"
echo ""
