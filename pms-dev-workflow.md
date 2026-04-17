# PMS 开发工作流 - 使用 Claude Code + 图片

## 快速开始

### 1️⃣ 一键启动开发环境

```bash
# 设置 Claude API 密钥（替换为你的密钥）
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# 运行启动脚本
./start-pms-dev.sh
```

### 2️⃣ 与 Claude Code 交互的三种方式

#### 方式 A：通过 OpenClaw 会话（推荐）

```bash
# 查看当前会话
openclaw sessions list

# 发送开发任务（带图片）
openclaw sessions send \
  --label "pms-development" \
  --message "我需要实现一个房态日历页面，参考图片中的设计风格" \
  --attach-image /root/.openclaw/media/inbound/e35783a4-e006-4534-8c78-c9279ec86428.jpg

# 查看回复
openclaw sessions history --label "pms-development" --limit 10
```

#### 方式 B：使用 sessions_spawn（适合独立任务）

```bash
# 启动一次性开发任务
openclaw sessions spawn \
  --runtime acp \
  --agent-id claude-code \
  --mode run \
  --task "基于参考 UI 实现 Vue 3 首页组件" \
  --attachments '[{
    "name": "ui-reference.jpg",
    "content": "/root/.openclaw/media/inbound/e35783a4-e006-4534-8c78-c9279ec86428.jpg",
    "mimeType": "image/jpeg"
  }]'
```

#### 方式 C：直接调用 Anthropic API（最灵活）

```python
# pms-dev-helper.py
import anthropic
import base64
import json
from pathlib import Path

def send_image_to_claude(image_path: str, task: str):
    """
    发送图片和任务到 Claude
    """
    client = anthropic.Anthropic(
        api_key="your-api-key"  # 或从环境变量读取
    )
    
    # 读取并编码图片
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    # 判断图片类型
    suffix = Path(image_path).suffix.lower()
    mime_type = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
    }.get(suffix, 'image/jpeg')
    
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
                        "media_type": mime_type,
                        "data": image_data
                    }
                },
                {
                    "type": "text",
                    "text": task
                }
            ]
        }]
    )
    
    return response.content[0].text

# 使用示例
if __name__ == "__main__":
    result = send_image_to_claude(
        "/root/.openclaw/media/inbound/e35783a4-e006-4534-8c78-c9279ec86428.jpg",
        """
        请分析这个酒店管理系统的 UI 界面，然后：
        
        1. 识别所有核心功能模块
        2. 设计对应的数据库表结构
        3. 生成 Vue 3 首页组件代码（使用 Element Plus）
        4. 提供完整的 API 接口定义
        
        技术栈：
        - 前端：Vue 3 + TypeScript + Element Plus
        - 后端：NestJS + TypeScript
        - 数据库：PostgreSQL
        """
    )
    
    print(result)
```

## 实战示例：生成首页代码

### 步骤 1：准备图片

```bash
# 保存参考 UI 图片
cp /root/.openclaw/media/inbound/e35783a4-e006-4534-8c78-c9279ec86428.jpg \
   ~/.openclaw/workspace/smart-pms/design/ui-reference.jpg

# 验证图片
file ~/.openclaw/workspace/smart-pms/design/ui-reference.jpg
```

### 步骤 2：创建提示词文件

```bash
cat > ~/.openclaw/workspace/smart-pms/prompts/homepage.txt << 'PROMPT'
# 任务：实现 PMS 系统首页

## 参考设计
请查看附加的 UI 参考图片（ui-reference.jpg）

## 需求
1. 使用 Vue 3 Composition API + TypeScript
2. 使用 Element Plus 组件库
3. 实现以下模块：
   - 顶部蓝色渐变区域（营业额、可售房间统计）
   - 房态快速统计条（预抵、已抵、预离、已离、新办）
   - 功能模块网格（9个核心功能入口）
   - 底部导航栏

## 输出要求
- 提供完整的 .vue 单文件组件
- 包含模拟数据
- 添加必要的注释
- 确保响应式设计

## 技术细节
- 使用 `<script setup lang="ts">`
- 使用 `ref` 和 `computed` 管理状态
- 使用 CSS Grid 或 Flex 布局
- 颜色方案参考图片（蓝色渐变主题）
PROMPT
```

### 步骤 3：发送到 Claude Code

```bash
# 使用 OpenClaw 发送任务
openclaw sessions send \
  --label "pms-development" \
  --message "$(cat ~/.openclaw/workspace/smart-pms/prompts/homepage.txt)" \
  --attach-image ~/.openclaw/workspace/smart-pms/design/ui-reference.jpg
```

### 步骤 4：接收并保存代码

```bash
# 查看最新回复
openclaw sessions history --label "pms-development" --limit 1 > /tmp/claude-response.txt

# 提取代码块（假设 Claude 返回了 Vue 组件）
# 手动或使用脚本保存到项目文件
```

## 开发任务清单

### ✅ 阶段一：项目初始化（第 1 周）

- [ ] **任务 1.1**: 创建 NestJS 后端项目
  ```bash
  npx @nestjs/cli new smart-pms-backend
  cd smart-pms-backend
  npm install @nestjs/typeorm typeorm pg
  ```

- [ ] **任务 1.2**: 创建 Vue 3 前端项目
  ```bash
  npm create vite@latest smart-pms-frontend -- --template vue-ts
  cd smart-pms-frontend
  npm install element-plus @element-plus/icons-vue
  ```

- [ ] **任务 1.3**: 数据库设计
  - 使用 Claude Code 分析 UI，生成数据库表结构
  - 创建 migration 文件
  - 初始化种子数据

### ✅ 阶段二：核心页面开发（第 2-3 周）

- [ ] **任务 2.1**: 首页仪表盘
  ```
  提示词："基于参考 UI 实现首页仪表盘，包含数据统计和功能入口"
  ```

- [ ] **任务 2.2**: 房态日历页
  ```
  提示词："实现房态日历页面，支持月视图和拖拽操作"
  ```

- [ ] **任务 2.3**: 订单管理页
  ```
  提示词："实现订单列表和详情页，支持筛选、搜索、编辑"
  ```

- [ ] **任务 2.4**: 财务报表页
  ```
  提示词："实现财务报表页面，包含图表和导出功能"
  ```

### ✅ 阶段三：后端 API 开发（第 4-5 周）

- [ ] **任务 3.1**: 用户认证模块
- [ ] **任务 3.2**: 房源管理 API
- [ ] **任务 3.3**: 订单管理 API
- [ ] **任务 3.4**: 报表数据 API

### ✅ 阶段四：集成与测试（第 6 周）

- [ ] **任务 4.1**: 前后端联调
- [ ] **任务 4.2**: 单元测试
- [ ] **任务 4.3**: 集成测试
- [ ] **任务 4.4**: 性能优化

## 高级技巧

### 💡 技巧 1：批量生成组件

```python
# batch-generate-components.py
components = [
    ("RoomCalendar", "房态日历组件，支持月视图和日视图切换"),
    ("OrderList", "订单列表组件，支持分页和筛选"),
    ("CustomerTable", "客户信息表格组件"),
    ("RevenueChart", "收入趋势图表组件（使用 ECharts）")
]

for name, description in components:
    task = f"""
    请生成一个 Vue 3 组件：{name}
    
    描述：{description}
    
    要求：
    - 使用 TypeScript
    - 使用 Element Plus
    - 包含模拟数据
    - 提供 props 接口定义
    """
    
    result = send_image_to_claude(ui_image, task)
    
    # 保存到文件
    with open(f"frontend/src/components/{name}.vue", "w") as f:
        f.write(result)
```

### 💡 技巧 2：生成 API 接口文档

```bash
# 让 Claude 分析 UI，生成 OpenAPI 规范
openclaw sessions send \
  --label "pms-development" \
  --message "
  基于这个 UI 界面，生成完整的 RESTful API 接口文档（OpenAPI 3.0 格式），
  包括：
  - 房源管理 API
  - 订单管理 API
  - 客户管理 API
  - 报表数据 API
  
  输出为 YAML 格式。
  " \
  --attach-image ~/.openclaw/workspace/smart-pms/design/ui-reference.jpg \
  > smart-pms/docs/api-spec.yaml
```

### 💡 技巧 3：生成数据库 Schema

```sql
-- 让 Claude 生成数据库迁移脚本
-- 提示词："基于这个 UI 界面，生成完整的 PostgreSQL 数据库 schema"

-- 示例输出：
CREATE TABLE properties (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    total_rooms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT REFERENCES properties(id),
    room_number VARCHAR(20) NOT NULL,
    room_type VARCHAR(50),
    base_price NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'available',
    UNIQUE(property_id, room_number)
);

-- ... 更多表定义
```

## 调试与问题排查

### 常见问题

#### 问题 1：Claude 无法识别图片
**原因**：图片格式或大小问题  
**解决**：
```bash
# 检查图片
file ui-reference.jpg
# 输出应该是：JPEG image data

# 如果是 WebP，转换为 JPEG
convert ui-reference.webp ui-reference.jpg

# 压缩大图片（Claude 限制 5MB）
convert ui-reference.jpg -quality 85 -resize 1920x ui-reference-compressed.jpg
```

#### 问题 2：生成的代码不符合预期
**原因**：提示词不够明确  
**解决**：
- 提供更详细的需求描述
- 指定具体的库和版本
- 分解任务，逐个实现

#### 问题 3：API 调用超时
**原因**：网络问题或请求过大  
**解决**：
```bash
# 设置代理（如果在国内）
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890

# 或使用国内加速服务
```

## 最佳实践

1. **模块化开发**：每次只让 Claude 生成一个组件或功能
2. **迭代优化**：先生成基础版本，再逐步优化细节
3. **代码审查**：Claude 生成的代码需要人工审查和测试
4. **版本控制**：使用 Git 管理代码，每次生成后提交
5. **文档同步**：让 Claude 同时生成代码和对应的文档

## 自动化脚本

### 完整自动化流程

```bash
#!/bin/bash
# auto-dev-workflow.sh

set -e

PROJECT_DIR="$HOME/.openclaw/workspace/smart-pms"
UI_IMAGE="$PROJECT_DIR/design/ui-reference.jpg"

echo "🚀 开始自动化开发流程..."

# 1. 生成数据库 Schema
echo "📊 生成数据库 Schema..."
openclaw sessions send \
  --label "pms-development" \
  --message "生成完整的 PostgreSQL 数据库 schema（SQL 格式）" \
  --attach-image "$UI_IMAGE" \
  > "$PROJECT_DIR/database/schema.sql"

# 2. 生成 API 接口
echo "🔌 生成 API 接口文档..."
openclaw sessions send \
  --label "pms-development" \
  --message "生成 RESTful API 接口文档（OpenAPI 3.0 YAML）" \
  --attach-image "$UI_IMAGE" \
  > "$PROJECT_DIR/docs/api-spec.yaml"

# 3. 生成前端组件
echo "🎨 生成前端组件..."
components=("HomePage" "RoomCalendar" "OrderList" "ReportDashboard")

for component in "${components[@]}"; do
    echo "  - 生成 $component..."
    openclaw sessions send \
      --label "pms-development" \
      --message "生成 Vue 3 组件: $component（TypeScript + Element Plus）" \
      --attach-image "$UI_IMAGE" \
      > "$PROJECT_DIR/frontend/src/components/$component.vue"
done

# 4. 生成后端控制器
echo "🔧 生成后端控制器..."
openclaw sessions send \
  --label "pms-development" \
  --message "生成 NestJS 控制器：RoomController（包含 CRUD 操作）" \
  > "$PROJECT_DIR/backend/src/rooms/rooms.controller.ts"

echo "✅ 自动化开发流程完成！"
echo ""
echo "生成的文件："
tree "$PROJECT_DIR" -L 3
```

## 总结

使用 Claude Code + OpenClaw + 图片进行 PMS 开发的优势：

1. **可视化驱动**：上传 UI 图片，让 Claude 理解设计意图
2. **快速原型**：自动生成前后端代码框架
3. **文档同步**：代码和文档一起生成
4. **技术栈灵活**：支持各种主流框架
5. **持续迭代**：通过对话不断优化代码

---

**下一步行动**：

1. 设置 `ANTHROPIC_API_KEY`
2. 运行 `./start-pms-dev.sh`
3. 上传 UI 参考图
4. 开始第一个组件的开发！

有问题随时问我 🚀
