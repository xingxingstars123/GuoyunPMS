# 示例文档

这是一个通过 feishu-collaboration 技能创建的飞书文档示例。

## 功能演示

### 1. 文件发送功能
- 支持发送各种格式的文件（PPT、PDF、Word、Excel等）
- 支持发送到群聊或私聊
- 支持附带文本消息

### 2. 文档创建功能
- 使用三步法创建文档，避免空白问题
- 支持 Markdown 格式内容
- 自动验证文档完整性

### 3. 权限管理
- 支持给用户或群组添加文档权限
- 支持 view 和 edit 两种权限级别
- 需要启用 feishu_perm 工具

## 使用示例

### 创建文档
```bash
./scripts/create-doc.sh \
  --title "项目计划" \
  --content project-plan.md \
  --folder "文件夹token"
```

### 发送文件
```bash
./scripts/send-file.sh \
  --file presentation.pptx \
  --target "chat:oc_项目群ID" \
  --message "这是最新的项目汇报PPT"
```

### 检查权限
```bash
./scripts/check-permissions.sh --all
```

## 注意事项

### 文档创建铁律
1. **绝不允许** 在 `create` action 中传入 `content` 参数
2. **必须** 执行三步法：create → write → read 验证
3. **必须** 确认 `blocks_added > 0` 和 `block_count > 1`
4. **必须** 验证成功后再分享链接

### 文件发送限制
- 默认文件大小限制：30MB
- 文本和文件会作为两条消息分别发送
- 文件路径必须是绝对路径

## 技术支持

如有问题，请参考：
1. `SKILL.md` - 完整技能文档
2. `scripts/` - 自动化脚本
3. `examples/` - 示例文件

---

*文档创建时间：$(date)*
*创建者：feishu-collaboration 技能*