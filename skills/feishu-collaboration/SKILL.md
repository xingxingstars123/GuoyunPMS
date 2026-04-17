# feishu-collaboration - 飞书协作技能

## 概述

基于 OpenClaw 飞书文件发送完整操作指南 和 飞书文档创建空白问题分析报告，本技能提供完整的飞书协作功能，包括文件发送、文档创建、权限管理和问题排查。

## 核心概念

### 两种文件发送场景
1. **场景A：在对话中发送文件消息**
   - 用途：直接在群聊/私聊中发送文件，接收者可以直接下载
   - 工具：`message` 工具（OpenClaw 内置消息工具）
   - 文件大小限制：默认 30MB（可通过 mediaMaxMb 配置）

2. **场景B：将文件上传到飞书文档中（作为附件 block）**
   - 用途：在飞书文档（docx）中插入文件附件
   - 工具：`feishu_doc` 工具，`action=upload_file`
   - 适用于需要在文档中嵌入附件的场景

## 权限配置要求

### 飞书应用权限（必须）
在飞书开放平台的应用权限中，必须开通以下权限：

**核心权限（缺一不可）：**
- `im:message:send_as_bot` — 以机器人身份发送消息
- `im:resource` — 上传/下载消息中的资源（图片、文件、音视频）
- `im:message` — 消息读写基础权限

**辅助权限（建议开通）：**
- `im:chat:read` — 获取群聊信息（用于确认机器人在群内）
- `im:chat.members:bot_access` — 群成员访问

### 机器人能力（必须）
在飞书开放平台 → 应用能力 → 机器人 中：
- ✅ 必须启用"机器人"能力
- ✅ 机器人必须已加入目标群聊

### OpenClaw Gateway 配置
```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "mediaMaxMb": 30,          // 文件大小上限，默认 30MB
      "textChunkLimit": 2000,    // 文本分块大小
      "tools": {
        "perm": true             // 启用权限管理工具（可选）
      }
    }
  }
}
```

## 技能功能

### 1. 文件发送功能

#### 发送文件到当前对话（最常用）
```json
{
  "action": "send",
  "filePath": "/path/to/your/file.pptx",
  "channel": "feishu"
}
```

#### 发送文件到指定对话
```json
// 发送到群聊
{
  "action": "send",
  "filePath": "/path/to/file.pptx",
  "target": "chat:oc_xxxx",
  "channel": "feishu"
}

// 发送到个人私聊
{
  "action": "send",
  "filePath": "/path/to/file.pptx",
  "target": "user:ou_xxxx",
  "channel": "feishu"
}
```

#### 同时发送文本和文件
```json
{
  "action": "send",
  "message": "这是最新版的汇报PPT，共9页",
  "filePath": "/path/to/汇报.pptx",
  "channel": "feishu"
}
```
⚠️ 注意：飞书中文本和文件会作为两条消息分别发送（飞书 API 限制，一条消息只能是一种类型）。

### 2. 文档创建与管理

#### 文档创建三步法（避免空白文档问题）
**铁律：所有飞书文档创建必须严格执行三步！**

**步骤1 — 创建空文档**
```json
{
  "action": "create",
  "title": "项目文档标题",
  "folder_token": "可选文件夹token"
}
```
→ 获取 `document_id`

**步骤2 — 写入内容**
```json
{
  "action": "write",
  "doc_token": "上一步获取的document_id",
  "content": "# 文档标题\n\n这里是Markdown内容..."
}
```
→ 确认 `blocks_added > 0`

**步骤3 — 验证非空**
```json
{
  "action": "read",
  "doc_token": "document_id"
}
```
→ 确认 `block_count > 1`（1 = 只有 Page 根节点 = 空文档）

只有步骤3通过后，才能分享链接。

#### 文档上传文件
```json
{
  "action": "upload_file",
  "doc_token": "文档token",
  "file_path": "/path/to/file.pptx"
}
```

### 3. 权限管理

#### 启用权限管理工具
在 Gateway 配置中启用：
```json
{
  "channels": {
    "feishu": {
      "tools": {
        "perm": true
      }
    }
  }
}
```
然后重启 Gateway：`openclaw gateway restart`

#### 添加权限示例
```json
{
  "action": "add",
  "token": "文件或文档token",
  "type": "file",  // 或 "doc"
  "member_type": "openchat",  // 或 "user"
  "member_id": "oc_xxxx",     // 或 "ou_xxxx"
  "perm": "view"              // 或 "edit"
}
```

### 4. 知识库操作

#### 获取知识库空间列表
```json
{
  "action": "spaces"
}
```

#### 获取知识库节点列表
```json
{
  "action": "nodes",
  "space_id": "知识库空间ID"
}
```

#### 创建知识库节点
```json
{
  "action": "create",
  "space_id": "知识库空间ID",
  "title": "新文档标题",
  "obj_type": "docx"  // 或 "sheet", "bitable"
}
```

## 实战示例

### 示例1：生成 PPT 并发送到群聊
```bash
# 步骤1: 用 python-pptx 在本地生成 PPT 文件
# → /root/.openclaw/workspace/汇报.pptx

# 步骤2: message tool 发送文件到当前对话
{
  "action": "send",
  "filePath": "/root/.openclaw/workspace/汇报.pptx",
  "channel": "feishu"
}

# 步骤3: (可选) 同时上传到飞书云盘留档
{
  "action": "upload_file",
  "doc_token": "索引文档token",
  "file_path": "/root/.openclaw/workspace/汇报.pptx"
}
```

### 示例2：创建完整项目文档
```bash
# 步骤1: 创建空文档
{
  "action": "create",
  "title": "项目需求文档",
  "folder_token": "项目文件夹token"
}
# 返回: document_id = "UTWtdu7Qso8yuRxFGuRco3ENnSe"

# 步骤2: 写入内容
{
  "action": "write",
  "doc_token": "UTWtdu7Qso8yuRxFGuRco3ENnSe",
  "content": "# 项目需求文档\n\n## 背景\n项目背景说明...\n\n## 需求\n1. 功能需求\n2. 性能需求\n3. 安全需求"
}

# 步骤3: 验证文档非空
{
  "action": "read",
  "doc_token": "UTWtdu7Qso8yuRxFGuRco3ENnSe"
}
# 确认 block_count > 1

# 步骤4: 分享给团队成员
{
  "action": "add",
  "token": "UTWtdu7Qso8yuRxFGuRco3ENnSe",
  "type": "doc",
  "member_type": "openchat",
  "member_id": "oc_项目群ID",
  "perm": "edit"
}
```

### 示例3：日报自动化流程
```bash
# 1. 收集日报数据（从数据库、API等）
# 2. 生成Markdown格式的日报内容
# 3. 创建日报文档
{
  "action": "create",
  "title": "2026-04-15 项目日报"
}
# 4. 写入日报内容
{
  "action": "write",
  "doc_token": "获取的document_id",
  "content": "日报内容..."
}
# 5. 发送到项目群
{
  "action": "send",
  "message": "今日日报已更新：https://feishu.cn/docx/...",
  "channel": "feishu",
  "target": "chat:oc_项目群ID"
}
```

## 问题排查指南

### 1. 文件发送失败检查清单
- ✅ 应用是否有 `im:message:send_as_bot` 权限？
- ✅ 应用是否有 `im:resource` 权限？
- ✅ 机器人是否已加入目标群聊？
- ✅ 文件大小是否超过 30MB 限制？
- ✅ 文件路径是否正确且文件存在？
- ✅ Gateway 网关是否正在运行？

### 2. 文档创建空白问题排查
**根因分析：** `create` action 根本不支持 `content` 参数（设计行为，不是 bug）

**解决方案：** 严格执行文档创建三步法

**所有可能导致空白的场景：**
1. **场景1：create 时传入 content 被忽略** ⭐ 主因（占 80%+）
2. **场景2：cron session 跨 session 数据隔离**
3. **场景3：write 内容过大被截断**（理论风险）
4. **场景4：write 中 Markdown 转 blocks 失败**
5. **场景5：飞书 API 返回成功但实际未写入**（竞态条件）
6. **场景6：权限问题导致 write 静默失败**
7. **场景7：网络中断导致 write 未执行**

### 3. 云盘文件无法转发/分享问题
**根因：** 通过机器人 `upload_file` 上传的文件，所有者是机器人应用（tenant_access_token），不是用户。飞书的安全策略可能限制非所有者的转发操作。

**解决方案：**
1. **方案1（推荐）：** 使用 `message send` 直接在对话中发送文件，绕过云盘权限问题
2. **方案2：** 启用 `feishu_perm` 工具，给群/用户添加文件权限
3. **方案3：** 用户手动创建文档/文件夹，机器人上传到用户的空间中

### 4. 诊断命令
```bash
# 检查 Gateway 状态
openclaw gateway status

# 查看实时日志
openclaw logs --follow

# 检查飞书应用权限
{
  "action": "scopes"
}
```

## 最佳实践

### 文档创建铁律
1. **绝不允许** 在 `create` action 中传入 `content` 参数
2. **必须** 执行三步法：create → write → read 验证
3. **必须** 确认 `blocks_added > 0` 和 `block_count > 1`
4. **必须** 验证成功后再分享链接

### 文件发送策略
| 目的 | 推荐方式 | 工具 |
|------|----------|------|
| 让群成员下载文件 | 对话消息 | `message send` + `filePath` |
| 在文档中嵌入附件 | 文档上传 | `feishu_doc upload_file` |
| 需要长期保存+链接分享 | 两者都做 | 先 upload 到文档，再 send 到对话 |

### 权限管理建议
1. **默认关闭：** `feishu_perm` 工具默认未启用，需要手动配置
2. **权限授予：** 创建文档后立即给相关成员授予权限
3. **权限验证：** 定期检查权限配置是否生效

## 支持的消息类型

### 发送能力
| 类型 | 支持情况 | 参数 |
|------|----------|------|
| 文本 | ✅ | `message` |
| 图片 | ✅ | `filePath`（.png/.jpg/.gif 等） |
| 文件 | ✅ | `filePath`（.pptx/.pdf/.docx/.zip 等） |
| 音频 | ✅ | `filePath`（.mp3/.wav/.ogg 等） |
| 视频/媒体 | ✅ | `filePath` + `media` 参数 |

### 接收能力
| 类型 | 支持情况 |
|------|----------|
| 文本 | ✅ |
| 富文本 | ✅ |
| 图片 | ✅ |
| 文件 | ✅ |
| 音频 | ✅ |
| 视频 | ✅ |
| 贴纸 | ✅ |

## 配置参考速查表

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `channels.feishu.enabled` | 启用飞书渠道 | `true` |
| `channels.feishu.mediaMaxMb` | 文件大小上限(MB) | `30` |
| `channels.feishu.textChunkLimit` | 文本分块大小 | `2000` |
| `channels.feishu.streaming` | 流式卡片输出 | `true` |
| `channels.feishu.tools.doc` | 文档操作工具 | `true` |
| `channels.feishu.tools.drive` | 云盘操作工具 | `true` |
| `channels.feishu.tools.perm` | 权限管理工具 | `false`（需手动开启） |
| `channels.feishu.tools.wiki` | 知识库工具 | `true` |

## 常见坑点总结

1. **云盘文件权限 ≠ 对话可见**  
   机器人上传到云盘的文件，所有者是机器人。即使给用户"可管理"权限，转发按钮可能仍然灰色。解决：直接在对话中发送文件。

2. **feishu_perm 默认关闭**  
   权限管理工具不在默认启用列表中，需要手动在 gateway 配置中开启 `tools.perm: true` 并重启。

3. **机器人没有根目录**  
   飞书机器人使用 tenant_access_token，没有"我的空间"概念。`feishu_drive create_folder` 不指定 `folder_token` 会报 400 错误。

4. **文件路径必须是绝对路径**  
   `filePath` 参数需要完整的服务器本地路径，不支持相对路径或 URL。

5. **文本和文件分开发送**  
   飞书 API 限制一条消息只能是一种类型。同时传 `message` 和 `filePath` 会产生两条消息。

6. **大文件注意 mediaMaxMb**  
   默认 30MB 上限。超过需要修改配置或压缩文件。

## 自动化脚本

### 文档创建自动化脚本
```bash
#!/bin/bash
# create-feishu-doc.sh

# 参数：标题、内容、文件夹token（可选）
TITLE="$1"
CONTENT="$2"
FOLDER_TOKEN="$3"

echo "创建飞书文档: $TITLE"

# 步骤1: 创建空文档
RESPONSE=$(openclaw feishu_doc create --title "$TITLE" ${FOLDER_TOKEN:+--folder_token "$FOLDER_TOKEN"})
DOC_TOKEN=$(echo "$RESPONSE" | jq -r '.document_id')

if [ -z "$DOC_TOKEN" ] || [ "$DOC_TOKEN" = "null" ]; then
    echo "❌ 文档创建失败"
    exit 1
fi

echo "✅ 文档创建成功: $DOC_TOKEN"

# 步骤2: 写入内容
WRITE_RESPONSE=$(openclaw feishu_doc write --doc_token "$DOC_TOKEN" --content "$CONTENT")
BLOCKS_ADDED=$(echo "$WRITE_RESPONSE" | jq -r '.blocks_added')

if [ "$BLOCKS_ADDED" -eq 0 ]; then
    echo "⚠️  内容写入可能失败，blocks_added=0"
fi

echo "✅ 内容写入完成，添加了 $BLOCKS_ADDED 个块"

# 步骤3: 验证非空
READ_RESPONSE=$(openclaw feishu_doc read --doc_token "$DOC_TOKEN")
BLOCK_COUNT=$(echo "$READ_RESPONSE" | jq -r '.block_count')

if [ "$BLOCK_COUNT" -le 1 ]; then
    echo "❌ 文档可能为空，block_count=$BLOCK_COUNT"
    exit 1
fi

echo "✅ 文档验证通过，block_count=$BLOCK_COUNT"
echo "📄 文档链接: https://feishu.cn/docx/$DOC_TOKEN"
```

### 文件发送自动化脚本
```bash
#!/bin/bash
# send-feishu-file.sh

# 参数：文件路径、目标（可选）、消息（可选）
FILE_PATH="$1"
TARGET="$2"
MESSAGE="$3"

if [ ! -f "$FILE_PATH" ]; then
    echo "❌ 文件不存在: $FILE_PATH"
    exit 1
fi

# 检查文件大小
FILE_SIZE=$(stat -c%s "$FILE_PATH")
MAX_SIZE=$((30 * 1024 * 1024))  # 30MB

if [ "$FILE_SIZE" -gt "$MAX_SIZE" ]; then
    echo "⚠️  文件大小超过30MB限制: $(($FILE_SIZE/1024/1024))MB"
    echo "请压缩文件或修改 mediaMaxMb 配置"
    exit 1
fi

echo "发送文件: $(basename "$FILE_PATH") ($(($FILE_SIZE/1024))KB)"

# 构建命令
CMD="openclaw message send --channel feishu --filePath \"$FILE_PATH\""

if [ -n "$TARGET" ]; then
    CMD="$CMD --target \"$TARGET\""
fi

if [ -n "$MESSAGE" ]; then
    CMD="$CMD --message \"$MESSAGE\""
fi

