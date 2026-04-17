# 飞书群聊消息发送规则（2026-04-17学习）

## 关键发现：发送失败的根本原因

### 错误做法
```
在message工具中使用 <at id="oc_xxx"></at> 格式
❌ 这会失败！因为message工具不支持这种格式
```

### 正确做法

#### 1. 使用message工具发送文本消息
```json
{
  "action": "send",
  "channel": "feishu",
  "target": "chat_id",
  "message": "消息内容"
}
```

#### 2. 使用message工具发送@消息（富文本）
```json
{
  "action": "send",
  "channel": "feishu",
  "target": "chat_id",
  "message": JSON.stringify({
    "msg_type": "post",
    "content": {
      "post": {
        "zh_cn": {
          "title": "标题",
          "content": [
            [
              {"tag": "text", "text": "消息内容 "},
              {"tag": "at", "user_id": "ou_xxx"}
            ]
          ]
        }
      }
    }
  })
}
```

## 飞书API发送消息格式

### 文本消息格式
```json
{
  "receive_id": "chat_id或user_id",
  "msg_type": "text",
  "content": "{\"text\":\"消息内容\"}"
}
```

### @用户的富文本消息格式
```json
{
  "receive_id": "chat_id",
  "msg_type": "post",
  "content": {
    "post": {
      "zh_cn": {
        "title": "标题",
        "content": [
          [
            {"tag": "text", "text": "消息内容 "},
            {"tag": "at", "user_id": "ou_xxx"}
          ]
        ]
      }
    }
  }
}
```

### 在卡片中@用户
```json
{
  "msg_type": "interactive",
  "content": "{\"elements\":[{\"tag\":\"markdown\",\"content\":\"<at id=\\\"ou_xxx\\\"></at> 消息内容\"}]}"
}
```

## 重要规则

1. **message工具限制**：
   - message工具不支持直接在消息文本中使用 `<at id="xxx"></at>` 格式
   - 需要使用飞书API的正确格式（富文本或卡片）

2. **@用户的ID类型**：
   - 使用 `user_id` 字段（如 `ou_xxx`）
   - 不要使用 `<at id="xxx"></at>` HTML格式（这只在卡片JSON中有效）

3. **获取用户ID**：
   - 需要调用飞书API获取用户的 open_id 或 user_id
   - 不能直接使用手机号或邮箱

## 我的错误记录

### 2026-04-17错误
- **错误**：在message工具中使用 `<at id="oc_6ef87b511b66b9d1d12296c6a3a89d99"></at>` 格式
- **原因**：message工具不支持这种格式
- **正确做法**：应该使用富文本格式或卡片格式来@用户

## 参考资料
- 飞书开放平台文档：https://open.feishu.cn/document/server-docs/im-v1/message/create
- 掘金教程：https://juejin.cn/post/7393185003205443622
