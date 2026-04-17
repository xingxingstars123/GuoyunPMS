# 国韵民宿PMS系统 - 高价值功能升级版

[![Node.js](https://img.shields.io/badge/Node.js-v22.22.2-green.svg)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)](https://www.sqlite.org/)
[![uni-app](https://img.shields.io/badge/uni--app-2.0.2-orange.svg)](https://uniapp.dcloud.io/)

一个为民宿业主打造的全功能管理系统,支持多渠道订单管理、房态日历、财务统计、清洁管理等核心业务场景。

## ✨ 最新功能 (v1.1.0)

本次升级新增3个高价值功能:

### 📊 1. 数据可视化仪表盘
- **营收趋势图** - 近7日营收走势折线图
- **房型占比** - 各房型营收贡献饼图
- **渠道分布** - 各渠道订单量柱状图
- **实时刷新** - 下拉即可更新最新数据

### 🤖 2. 智能房间推荐
- **多维度评分** - 基于价格/楼层/朝向/评分/历史偏好的智能算法
- **推荐理由** - 清晰展示推荐依据
- **筛选定制** - 支持房型/价格/楼层等条件筛选
- **自动计价** - 选择推荐房间后自动计算订单金额

### 📥 3. Excel数据导出
- **订单导出** - 支持按日期/渠道筛选导出
- **财务导出** - 月度财务明细+汇总+渠道统计
- **多工作表** - 一个文件包含明细和统计
- **即时下载** - H5平台直接下载,小程序复制链接

## 🚀 快速开始

### 一键部署
```bash
cd /root/.openclaw/workspace/pms-prototype
./DEPLOY.sh
```

### 手动部署

#### 1. 安装依赖
```bash
cd backend
npm install
```

#### 2. 启动后端服务
```bash
node server.js
# 服务地址: http://localhost:3100
```

#### 3. 前端开发
```bash
cd ../pms-miniapp

# H5平台
npm run dev:h5

# 微信小程序
npm run dev:mp-weixin
```

## 📁 项目结构

```
pms-prototype/
├── backend/                    # 后端服务
│   ├── server.js               # Express主服务(已添加新API)
│   ├── database.js             # SQLite数据库初始化
│   ├── services/               # 业务逻辑层
│   │   ├── RecommendationService.js  # 🆕 推荐算法
│   │   └── ExportService.js          # 🆕 Excel导出
│   └── middleware/             # 中间件
│
├── pms-miniapp/                # 前端uni-app项目
│   ├── pages/
│   │   ├── index/
│   │   │   └── index-with-charts.vue      # 🆕 带图表的首页
│   │   ├── create-order/
│   │   │   └── create-order-with-recommend.vue  # 🆕 智能推荐订单页
│   │   ├── orders/
│   │   │   └── orders-with-export.vue     # 🆕 带导出的订单页
│   │   └── finance/
│   │       └── finance-with-export.vue    # 🆕 带导出的财务页
│   ├── components/
│   │   └── charts/
│   │       └── RevenueChart.vue           # 🆕 通用图表组件
│   └── utils/
│       └── request.js          # API请求封装
│
├── FEATURES.md                 # 🆕 详细功能文档
├── DEPLOY.sh                   # 🆕 一键部署脚本
└── README.md                   # 本文件
```

## 🔌 新增API端点

### 数据可视化
```bash
GET /api/dashboard/revenue-trend?days=7    # 营收趋势
GET /api/dashboard/room-type-stats         # 房型统计
GET /api/dashboard/channel-distribution    # 渠道分布
```

### 智能推荐
```bash
POST /api/rooms/recommend                  # 获取推荐房间
POST /api/rooms/recommend/feedback         # 记录推荐反馈
```

### Excel导出
```bash
GET /api/export/orders?startDate=xxx&endDate=xxx&channel=xxx  # 导出订单
GET /api/export/finance?year=2026&month=4                      # 导出财务
```

## 📊 使用示例

### 1. 获取智能推荐
```bash
curl -X POST http://localhost:3100/api/rooms/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "checkIn": "2026-04-20",
    "checkOut": "2026-04-22",
    "maxPrice": 500,
    "floor": "high"
  }'
```

响应示例:
```json
{
  "success": true,
  "message": "为您推荐 5 个房间",
  "data": [
    {
      "id": 3,
      "room_number": "301",
      "room_type": "大床房",
      "price": 450,
      "recommendScore": 155,
      "recommendReasons": ["房型匹配", "价格合适", "高楼层", "高评分房间"]
    }
  ]
}
```

### 2. 导出订单数据
```bash
# 浏览器访问或curl下载
curl "http://localhost:3100/api/export/orders?startDate=2026-04-01&endDate=2026-04-30" \
  -o orders_april.xlsx
```

## 🧪 功能测试

运行自动化测试:
```bash
# 启动服务后执行
cd backend
npm test  # (如果有测试脚本)
```

手动测试清单:
- [ ] 访问 http://localhost:3100/api/dashboard/revenue-trend
- [ ] 测试推荐API(见上方curl示例)
- [ ] 在浏览器中下载Excel文件
- [ ] 前端页面加载图表组件
- [ ] 创建订单时测试推荐功能

## 📚 文档

- **[FEATURES.md](FEATURES.md)** - 详细功能说明和技术文档
- **[API.md](API.md)** - 完整API接口文档 (待创建)
- **[CHANGELOG.md](CHANGELOG.md)** - 版本更新日志 (待创建)

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express** - Web框架
- **SQLite** (better-sqlite3) - 数据库
- **XLSX** - Excel文件生成
- **dayjs** - 日期处理

### 前端
- **uni-app** - 跨平台框架
- **Vue.js 2.6** - MVVM框架
- **Canvas API** - 图表绘制
- **原生组件** - 无外部UI库

## 🔧 配置

### 数据库配置
数据库文件: `backend/database/pms.db`  
首次运行自动初始化,包含示例数据

### 服务器配置
修改 `backend/server.js`:
```javascript
const PORT = 3100;  // 修改端口
```

### 推荐算法调优
编辑 `backend/services/RecommendationService.js`:
```javascript
// 调整评分权重
if (roomType && room.room_type === roomType) {
  score += 30;  // 房型匹配权重
}
```

## 📈 性能优化建议

1. **添加数据库索引** (见FEATURES.md)
2. **启用Redis缓存** (仪表盘数据5分钟缓存)
3. **导出大数据集** (超10000条分批处理)
4. **启用Gzip压缩** (Express中间件)

## 🐛 故障排查

### 服务无法启动
```bash
# 检查端口占用
lsof -i :3100
# 杀死占用进程
kill -9 <PID>
```

### 图表不显示
- 检查Canvas API兼容性
- 确认chartData格式正确
- 查看浏览器控制台错误

### 导出文件损坏
- 确认xlsx库已安装: `npm list xlsx`
- 检查文件编码(应为UTF-8)

## 🤝 贡献指南

欢迎提交Issue和PR!

开发流程:
1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

## 📄 许可证

本项目仅供学习和研究使用。

## 👥 联系方式

- **开发者**: AI助手 (Clawdbot)
- **项目地址**: `/root/.openclaw/workspace/pms-prototype`
- **更新日期**: 2026-04-18

## 🎉 更新日志

### v1.1.0 (2026-04-18)
- ✨ 新增数据可视化仪表盘(折线/饼图/柱状图)
- 🤖 新增智能房间推荐功能(多维度评分算法)
- 📥 新增Excel数据导出(订单/财务)
- 📚 完善技术文档和部署脚本

### v1.0.0 (2026-04-15)
- 🎉 初始版本发布
- 基础订单管理功能
- 房态日历视图
- 财务统计报表
- 清洁任务管理

---

**Made with ❤️ by AI Assistant**
