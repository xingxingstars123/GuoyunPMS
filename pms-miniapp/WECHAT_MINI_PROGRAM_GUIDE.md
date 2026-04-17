# 微信小程序编译指南

## ⚠️ 重要说明

**uni-app项目必须编译后才能在微信小程序中运行!**

直接用微信开发者工具打开 `.vue` 文件会显示"此页面正在开发中"。

---

## 🚀 快速开始

### 方式一: 使用 HBuilderX (推荐)

1. **下载 HBuilderX**
   ```
   https://www.dcloud.io/hbuilderx.html
   ```

2. **打开项目**
   - 文件 → 打开目录 → 选择 `pms-miniapp` 文件夹

3. **运行到微信小程序**
   - 运行 → 运行到小程序模拟器 → 微信开发者工具
   - 首次运行会要求配置微信开发者工具路径

4. **自动编译**
   - HBuilderX会自动编译并在微信开发者工具中打开

---

### 方式二: 命令行编译

#### 1. 安装依赖

```bash
cd /root/.openclaw/workspace/pms-miniapp
npm install
```

#### 2. 编译为微信小程序

**开发模式** (支持热更新):
```bash
npm run dev:mp-weixin
```

**生产模式**:
```bash
npm run build:mp-weixin
```

#### 3. 编译产物位置

编译后的小程序代码在:
```
pms-miniapp/dist/dev/mp-weixin/        # 开发版
pms-miniapp/dist/build/mp-weixin/      # 生产版
```

#### 4. 在微信开发者工具中打开

1. 打开微信开发者工具
2. 导入项目
3. 选择目录: `pms-miniapp/dist/dev/mp-weixin/` (或 build)
4. 填写 AppID (或选择测试号)
5. 点击"导入"

---

## 📝 编译后的文件结构

```
dist/dev/mp-weixin/
├── pages/                    # 编译后的页面
│   ├── index/
│   │   ├── index.js         # Vue -> JS
│   │   ├── index.json       # 页面配置
│   │   ├── index.wxml       # template -> WXML
│   │   └── index.wxss       # style -> WXSS
│   ├── orders/
│   ├── room-calendar/
│   └── ...
├── static/                   # 静态资源
├── app.js                    # 入口文件
├── app.json                  # 全局配置 (from pages.json)
├── app.wxss                  # 全局样式
└── project.config.json       # 微信小程序配置
```

---

## 🔧 常见问题

### Q1: 为什么直接打开.vue文件显示"开发中"?

**A**: uni-app 是跨平台框架,`.vue` 文件需要编译成微信小程序格式才能运行。

**解决方案**: 使用上述方式一或方式二编译后再打开。

---

### Q2: 编译报错 "Cannot find module '@dcloudio/uni-mp-weixin'"

**A**: 缺少依赖包。

**解决方案**:
```bash
npm install @dcloudio/uni-mp-weixin --save
```

---

### Q3: 微信开发者工具报错 "pages/xxx/xxx.js 文件不存在"

**A**: 编译未完成或编译失败。

**解决方案**:
1. 检查编译是否成功 (npm run 命令是否报错)
2. 确认 `dist/dev/mp-weixin/pages/` 下是否有编译文件
3. 重新编译: `npm run dev:mp-weixin`

---

### Q4: 如何修改代码并实时预览?

**A**: 使用开发模式编译:

```bash
npm run dev:mp-weixin
```

然后在微信开发者工具中勾选"自动编译"和"文件保存时自动编译"。

修改 `.vue` 文件保存后,小程序会自动刷新。

---

## 📱 uni-app vs 原生小程序

| 特性 | uni-app (.vue) | 原生小程序 |
|------|----------------|-----------|
| 模板 | `<template>` | `.wxml` |
| 样式 | `<style>` (CSS) | `.wxss` |
| 逻辑 | `<script>` (Vue) | `.js` (小程序API) |
| 配置 | `pages.json` | `.json` |
| 编译 | **需要编译** | 不需要 |

**关键**: uni-app 的 `.vue` 文件会被编译成 `.wxml + .wxss + .js + .json` 四个文件。

---

## 🎯 正确的开发流程

1. **编写代码**: 修改 `.vue` 文件
2. **编译**: 运行 `npm run dev:mp-weixin` (开发模式)
3. **预览**: 在微信开发者工具中打开 `dist/dev/mp-weixin/`
4. **测试**: 测试功能是否正常
5. **调试**: 根据控制台错误信息修改代码
6. **打包**: `npm run build:mp-weixin` (生产模式)
7. **上传**: 在微信开发者工具中点击"上传"

---

## ✅ 验证编译是否成功

编译成功后,`dist/dev/mp-weixin/pages/` 下应该有:

```bash
$ ls dist/dev/mp-weixin/pages/index/
index.js      # ✅ 存在
index.json    # ✅ 存在
index.wxml    # ✅ 存在
index.wxss    # ✅ 存在
```

如果只有 `.vue` 文件,说明编译未执行或失败。

---

## 📞 技术支持

遇到编译问题,请检查:
1. Node.js版本 (建议 v14+)
2. npm依赖是否完整安装
3. HBuilderX版本是否最新
4. 微信开发者工具版本是否最新

---

**创建时间**: 2026-04-17  
**文档版本**: v1.0  
**项目路径**: `/root/.openclaw/workspace/pms-miniapp/`
