# 国韵民宿小程序版 - 测试指南

## 📱 项目说明

这是基于 uni-app 开发的国韵民宿管理系统小程序版本，支持：
- 微信小程序
- H5（移动端网页）
- App（iOS/Android）

## 🚀 快速测试

### 方式一：H5 模式测试（最简单，推荐）

#### 1. 安装 HBuilderX

下载地址：https://www.dcloud.io/hbuilderx.html

或使用命令行（需要 Node.js）：

```bash
# 安装 @dcloudio/cli
npm install -g @dcloudio/vue-cli

# 创建项目（已创建，跳过此步）
# vue create -p dcloudio/uni-preset-vue my-project
```

#### 2. 使用 HBuilderX 打开项目

1. 启动 HBuilderX
2. 文件 → 打开目录 → 选择 `/root/.openclaw/workspace/pms-miniapp`
3. 点击顶部工具栏的"运行" → "运行到浏览器" → "Chrome"

#### 3. 自动打开浏览器

浏览器会自动打开 http://localhost:8080，你就可以看到小程序界面了！

---

### 方式二：微信开发者工具测试（真实小程序环境）

#### 1. 下载微信开发者工具

下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

#### 2. 使用 HBuilderX 编译

1. 在 HBuilderX 中打开项目
2. 点击"运行" → "运行到小程序模拟器" → "微信开发者工具"
3. 首次运行会要求配置微信开发者工具路径

#### 3. 在微信开发者工具中查看

微信开发者工具会自动打开，显示小程序界面

---

### 方式三：使用命令行测试（适合有经验的开发者）

#### 1. 安装依赖

```bash
cd /root/.openclaw/workspace/pms-miniapp
npm install
```

#### 2. 运行 H5 版本

```bash
npm run dev:h5
```

访问：http://localhost:8080

#### 3. 运行微信小程序版本

```bash
npm run dev:mp-weixin
```

生成的文件在 `dist/dev/mp-weixin` 目录，使用微信开发者工具打开此目录。

---

## 🔧 配置说明

### API 地址配置

在 `manifest.json` 中已配置：

```json
"h5": {
  "devServer": {
    "proxy": {
      "/api": {
        "target": "http://43.173.91.161:3100",
        "changeOrigin": true
      }
    }
  }
}
```

在 `utils/request.js` 中也配置了：

```javascript
const BASE_URL = 'http://43.173.91.161:3100'
```

**注意**：如果后端 API 地址改变，需要修改这两个地方。

---

## 📊 功能清单

### 已实现功能

| 页面 | 功能 | 状态 |
|------|------|------|
| 首页 | 营业额统计 + 房态统计 + 功能入口 | ✅ |
| 订单管理 | 订单列表 + 渠道筛选 + 订单详情 | ✅ |
| 客户列表 | Tab 切换 + 渠道分组 | ✅ |
| 财务统计 | 月度统计 + 渠道收入明细 | ✅ |

### 待开发功能

- [ ] 创建订单
- [ ] 房态日历
- [ ] 清洁管理
- [ ] 系统设置

---

## 🎨 界面预览

### 首页
- 顶部：蓝色渐变统计卡片（营业额 + 可售房间）
- 中部：房态统计条（预抵/已抵/预离/已离/新办）
- 底部：功能网格（3x2 布局）

### 订单管理
- 顶部：渠道筛选下拉框
- 列表：订单卡片（订单号/房间/客户/日期/金额）
- 右下：新建订单浮动按钮（+）

### 客户列表
- 顶部：Tab 切换（全部/携程/美团/直销）
- 列表：客户卡片（姓名/电话/订单数/累计消费）

### 财务统计
- 顶部：月份选择器
- 统计卡片：总收入 + 订单数
- 列表：渠道收入明细

---

## 🧪 测试步骤

### 1. 测试首页

1. 打开小程序/H5
2. 查看顶部统计数据是否加载
3. 查看房态统计是否显示
4. 点击功能网格中的各个模块

**预期结果**：
- 营业额显示为 ¥3995
- 可售房间显示为 11
- 点击"订单管理"跳转到订单页面

### 2. 测试订单管理

1. 点击底部导航栏的"订单"
2. 查看订单列表是否显示
3. 点击渠道筛选，切换不同渠道
4. 点击订单卡片查看详情

**预期结果**：
- 显示模拟订单列表
- 筛选功能正常
- 详情弹窗显示订单信息

### 3. 测试客户列表

1. 点击底部导航栏的"客户"
2. 查看客户列表
3. 点击不同 Tab 切换渠道

**预期结果**：
- 显示客户列表
- Tab 切换正常
- 电话号码中间4位已脱敏

### 4. 测试财务统计

1. 点击底部导航栏的"财务"
2. 查看月度统计数据
3. 切换不同月份

**预期结果**：
- 显示总收入和订单数
- 显示渠道收入明细
- 月份切换正常

---

## 🐛 常见问题

### Q1: 无法访问 API？

**A**: 检查以下几点：
1. 后端服务是否正常运行
   ```bash
   ps aux | grep "node server.js"
   ```
2. 端口 3100 是否开放
   ```bash
   ss -tlnp | grep 3100
   ```
3. 服务器 IP 是否正确（当前配置：43.173.91.161）

### Q2: HBuilderX 无法运行？

**A**: 
1. 确保安装了最新版 HBuilderX
2. 项目目录中是否有 `manifest.json` 和 `pages.json`
3. 尝试关闭项目重新打开

### Q3: 微信开发者工具无法打开？

**A**:
1. 检查微信开发者工具是否正确安装
2. 在 HBuilderX 中配置微信开发者工具路径：
   - 工具 → 设置 → 运行配置 → 小程序运行配置
3. 重启 HBuilderX

### Q4: 数据无法加载？

**A**:
1. 打开浏览器控制台（F12）查看网络请求
2. 检查是否有 CORS 跨域错误
3. 检查后端日志：
   ```bash
   tail -f /root/.openclaw/workspace/pms-prototype/backend/server.log
   ```

---

## 📱 真机测试（微信小程序）

### 1. 准备工作

- 注册微信小程序账号
- 获取 AppID
- 在 `manifest.json` 中配置 AppID

### 2. 上传代码

1. 在微信开发者工具中点击"上传"
2. 填写版本号和项目备注
3. 登录微信公众平台查看体验版

### 3. 体验版测试

1. 在微信公众平台添加体验成员
2. 体验成员扫码即可在手机上测试

---

## 🔧 开发建议

### 1. 修改样式

所有样式都在各个 `.vue` 文件的 `<style scoped>` 中，可以直接修改。

单位使用 `rpx`（响应式像素），自动适配不同屏幕。

### 2. 添加新页面

1. 在 `pages` 目录下创建新文件夹
2. 创建 `.vue` 文件
3. 在 `pages.json` 中注册页面

### 3. 调用 API

使用封装好的 `api` 对象：

```javascript
import { api } from '@/utils/request.js'

// 获取订单列表
const data = await api.getOrders()

// 获取客户列表
const customers = await api.getCustomers()
```

---

## 📞 技术支持

遇到问题请查看：
1. uni-app 官方文档：https://uniapp.dcloud.net.cn/
2. 微信小程序文档：https://developers.weixin.qq.com/miniprogram/dev/framework/

---

**项目路径**: `/root/.openclaw/workspace/pms-miniapp`  
**创建时间**: 2026-04-15 15:12 GMT+8  
**版本**: 1.0.0

🎉 **祝测试顺利！**
