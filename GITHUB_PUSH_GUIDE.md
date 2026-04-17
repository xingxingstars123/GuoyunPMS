# 📦 GitHub 推送指南

## ✅ 项目已准备就绪

项目文件已打包在：`/root/.openclaw/workspace/pms-delivery/`

## 🚀 推送步骤（请执行以下命令）

### 1. 进入项目目录
```bash
cd /root/.openclaw/workspace/pms-delivery
```

### 2. 检查 Git 状态
```bash
git status
```

### 3. 设置远程仓库（已设置）
```bash
git remote -v
# 应该显示：
# origin  git@github.com:xingxingstars123/GuoyunPMS.git (fetch)
# origin  git@github.com:xingxingstars123/GuoyunPMS.git (push)
```

### 4. 推送代码（需要 GitHub 认证）

#### 方案 A：使用 SSH 密钥（推荐）
```bash
# 1. 确保你有 SSH 密钥
ls -la ~/.ssh/id_rsa

# 2. 如果没有，生成一个
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 3. 将公钥添加到 GitHub
cat ~/.ssh/id_rsa.pub
# 复制输出，添加到 GitHub: Settings → SSH and GPG keys → New SSH key

# 4. 推送
git push -u origin main
```

#### 方案 B：使用 HTTPS + 个人访问令牌
```bash
# 1. 切换到 HTTPS 地址
git remote set-url origin https://github.com/xingxingstars123/GuoyunPMS.git

# 2. 推送（会提示输入用户名和密码）
# 密码使用 GitHub 个人访问令牌（PAT）
git push -u origin main
```

#### 方案 C：使用 GitHub CLI
```bash
# 1. 安装 GitHub CLI
# Ubuntu: sudo apt install gh
# macOS: brew install gh

# 2. 登录
gh auth login

# 3. 推送
git push -u origin main
```

### 5. 如果推送失败，创建压缩包
```bash
cd /root/.openclaw/workspace
tar -czf guoyun-pms-complete.tar.gz pms-delivery/
echo "压缩包已创建: guoyun-pms-complete.tar.gz"
```

## 📂 项目结构

```
pms-delivery/
├── README.md                    # 完整项目说明
├── pms-prototype/              # Web 版（Node.js + Vue）
├── pms-miniapp/                # uni-app 小程序
├── pms-h5-mobile/              # H5 移动版
├── PMS_AUDIT_REPORT.md         # 技术审计报告
├── MINIAPP_V1.1_UPDATE.md      # 小程序更新说明
└── MESSAGE_NOTIFICATION_GUIDE.md # 消息通知功能
```

## 🔧 快速测试（无需推送）

### 1. 启动 H5 版测试
```bash
cd pms-delivery/pms-h5-mobile
python3 -m http.server 8080
# 访问 http://localhost:8080
```

### 2. 启动 Web 版测试
```bash
cd pms-delivery/pms-prototype
chmod +x start.sh
./start.sh
# 访问 http://localhost:5173
```

## 📊 核心功能验证

### 必测功能
1. **渠道通知**: 创建订单 → 查看控制台输出 5 条通知
2. **消息提示**: "我的"页面 → 消息通知（带红色徽章）
3. **客户分类**: 客户列表 → 按渠道 Tab 切换
4. **房态日历**: 月份切换 + 点击查看

### 测试命令
```bash
# 查看渠道通知日志
tail -f pms-delivery/pms-prototype/backend/server.log

# 测试后端 API
curl http://localhost:3100/api/dashboard/stats
```

## 🎯 GitHub 仓库信息

- **仓库地址**: `git@github.com:xingxingstars123/GuoyunPMS.git`
- **HTTPS地址**: `https://github.com/xingxingstars123/GuoyunPMS.git`
- **分支**: `main`
- **提交信息**: "国韵民宿 PMS 系统 v1.1.0 - 完整交付"

## ⚠️ 常见问题

### 1. SSH 密钥问题
```bash
# 测试 SSH 连接
ssh -T git@github.com
# 应该显示: Hi xingxingstars123! You've successfully authenticated...
```

### 2. 仓库不存在
确保 GitHub 上已创建 `GuoyunPMS` 仓库（空仓库即可）

### 3. 权限问题
确保你有 `xingxingstars123` 账户的推送权限

### 4. 大文件问题
如果推送失败，可能是 `node_modules` 太大：
```bash
# 移除 node_modules 重新推送
rm -rf pms-delivery/pms-prototype/frontend/node_modules
rm -rf pms-delivery/pms-prototype/backend/node_modules
git add .
git commit -m "移除 node_modules 依赖"
git push
```

## 📞 备用方案

如果无法推送到 GitHub，可以使用：

### 1. 下载链接
```bash
# 已启动 HTTP 服务器
# 访问: http://43.173.91.161:9000/pms-delivery.tar.gz
```

### 2. 直接复制文件
```bash
# 压缩包位置
/root/.openclaw/workspace/pms-delivery.tar.gz
```

### 3. 手动创建仓库
1. 在 GitHub 创建新仓库 `GuoyunPMS`
2. 按照 GitHub 的指引推送：
```bash
git remote add origin https://github.com/xingxingstars123/GuoyunPMS.git
git branch -M main
git push -u origin main
```

## 🎉 完成标志

成功推送后，访问：
```
https://github.com/xingxingstars123/GuoyunPMS
```

应该看到完整的项目文件。

---

**最后一步**: 执行 `git push -u origin main` 并按照提示完成认证。

如果遇到问题，使用压缩包方案：`/root/.openclaw/workspace/pms-delivery.tar.gz` (50MB)
