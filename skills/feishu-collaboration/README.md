# feishu-collaboration 技能

基于 OpenClaw 飞书文件发送完整操作指南 和 飞书文档创建空白问题分析报告 创建的飞书协作技能。

## 📚 文档来源

1. **OpenClaw 飞书文件发送完整操作指南**  
   https://f02pb9tdfxz.feishu.cn/wiki/T5HwwMSRHiOfkfk9QFdcYzq7nye

2. **飞书文档创建空白问题 — 根因分析与自修复方案**  
   https://f02pb9tdfxz.feishu.cn/wiki/AwHXwLaw0iaOGVkQeWOcEtFyngg

## 🎯 技能目标

提供完整的飞书协作功能，包括：
- ✅ 文件发送到对话
- ✅ 文档创建与管理
- ✅ 权限管理
- ✅ 问题排查与自动化

## 📁 目录结构

```
feishu-collaboration/
├── SKILL.md                    # 技能主文档
├── README.md                   # 本文件
├── scripts/                    # 自动化脚本
│   ├── create-doc.sh          # 文档创建三步法脚本
│   ├── send-file.sh           # 文件发送脚本
│   └── check-permissions.sh   # 权限检查脚本
└── examples/                  # 示例文件
    ├── example-content.md     # 示例文档内容
    └── test-file.txt          # 测试文件
```

## 🚀 快速开始

### 1. 检查权限
```bash
./scripts/check-permissions.sh --all
```

### 2. 创建测试文档
```bash
./scripts/create-doc.sh \
  --title "测试文档" \
  --content examples/example-content.md
```

### 3. 发送测试文件
```bash
./scripts/send-file.sh \
  --file examples/test-file.txt \
  --message "这是一个测试文件"
```

## 🔧 核心功能

### 1. 文件发送
支持两种场景：
- **场景A：** 在对话中发送文件消息（直接下载）
- **场景B：** 将文件上传到飞书文档中（作为附件）

### 2. 文档创建
**严格执行三步法**，避免空白文档问题：
1. `create` - 创建空文档
2. `write` - 写入内容
3. `read` - 验证非空

### 3. 权限管理
- 支持给用户/群组添加文档权限
- 需要启用 `feishu_perm` 工具
- 支持 `view` 和 `edit` 两种权限级别

## ⚠️ 重要注意事项

### 文档创建铁律
1. **绝不允许** 在 `create` action 中传入 `content` 参数
2. **必须** 执行三步法：create → write → read 验证
3. **必须** 确认 `blocks_added > 0` 和 `block_count > 1`
4. **必须** 验证成功后再分享链接

### 常见问题
1. **云盘文件权限 ≠ 对话可见**  
   机器人上传的文件所有者是机器人，可能无法转发。解决方案：直接在对话中发送文件。

2. **feishu_perm 默认关闭**  
   需要手动在 Gateway 配置中开启 `tools.perm: true` 并重启。

3. **文件路径必须是绝对路径**  
   `filePath` 参数需要完整的服务器本地路径。

## 📋 配置要求

### 必需权限
- `im:message:send_as_bot` - 以机器人身份发送消息
- `im:resource` - 上传/下载消息中的资源
- `im:message` - 消息读写基础权限

### 推荐权限
- `im:chat:read` - 获取群聊信息
- `im:chat.members:bot_access` - 群成员访问
- `drive:permission` - 文档/文件权限管理

### Gateway 配置
```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "mediaMaxMb": 30,
      "tools": {
        "doc": true,
        "drive": true,
        "perm": true,    // 需要手动启用
        "wiki": true
      }
    }
  }
}
```

## 🐛 问题排查

### 文件发送失败
检查清单：
1. ✅ 应用是否有正确的权限？
2. ✅ 机器人是否已加入目标群聊？
3. ✅ 文件大小是否超过 30MB 限制？
4. ✅ 文件路径是否正确且文件存在？
5. ✅ Gateway 网关是否正在运行？

### 文档创建空白
**根因：** `create` action 根本不支持 `content` 参数（设计行为）

**解决方案：** 严格执行文档创建三步法

### 诊断命令
```bash
# 检查 Gateway 状态
openclaw gateway status

# 查看实时日志
openclaw logs --follow

# 检查应用权限
openclaw feishu_app_scopes
```

## 📖 深入学习

### 参考文档
1. **SKILL.md** - 完整技能文档，包含所有功能说明
2. **scripts/** - 自动化脚本源码，可自定义修改
3. **examples/** - 示例文件，可直接使用

### 实战示例
见 `SKILL.md` 中的实战示例部分，包含：
- 生成 PPT 并发送到群聊
- 创建完整项目文档
- 日报自动化流程

## 🔄 更新日志

### v1.0.0 (2026-04-15)
- ✅ 基于两份飞书文档创建完整技能
- ✅ 提供文档创建三步法自动化脚本
- ✅ 提供文件发送自动化脚本
- ✅ 提供权限检查脚本
- ✅ 包含示例文件和测试用例

## 📞 支持

如有问题，请：
1. 查看 `SKILL.md` 中的问题排查指南
2. 运行 `./scripts/check-permissions.sh --all` 检查配置
3. 参考原始飞书文档：
   - [文件发送操作指南](https://f02pb9tdfxz.feishu.cn/wiki/T5HwwMSRHiOfkfk9QFdcYzq7nye)
   - [文档创建空白问题分析](https://f02pb9tdfxz.feishu.cn/wiki/AwHXwLaw0iaOGVkQeWOcEtFyngg)

---

**技能创建者：** OpenClaw AI  
**创建时间：** 2026-04-15  
**适用版本：** OpenClaw 2026.3.28+