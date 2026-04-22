# GuoyunPMS 部署指南

本文档详细说明GuoyunPMS的生产环境部署流程。

## 目录

- [系统要求](#系统要求)
- [Docker部署(推荐)](#docker部署推荐)
- [传统部署](#传统部署)
- [配置说明](#配置说明)
- [运维脚本](#运维脚本)
- [监控与告警](#监控与告警)
- [故障排查](#故障排查)

## 系统要求

### 最低配置
- **CPU**: 1核
- **内存**: 1GB
- **磁盘**: 20GB
- **系统**: Linux/macOS/Windows(WSL2)

### 推荐配置
- **CPU**: 2核+
- **内存**: 2GB+
- **磁盘**: 50GB+
- **系统**: Ubuntu 20.04/22.04 LTS

### 软件依赖
- Docker 20.10+ (推荐Docker部署)
- Node.js 18+ (传统部署)
- Redis 7+ (可选,用于缓存)

## Docker部署(推荐)

### 1. 克隆项目

```bash
git clone https://github.com/xingxingstars123/GuoyunPMS.git
cd GuoyunPMS/pms-prototype
```

### 2. 配置环境变量

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env` 文件:
```bash
# JWT密钥(必须修改)
JWT_SECRET=your-very-long-random-secret-key-here-change-me

# Redis密码(建议设置)
REDIS_PASSWORD=your-redis-password

# OTA配置(可选)
OTA_CTRIP_ENABLED=true
OTA_CTRIP_API_KEY=your-ctrip-api-key
OTA_CTRIP_HOTEL_ID=your-hotel-id
```

### 3. 启动服务

#### 基础服务(后端 + Redis)
```bash
docker-compose up -d
```

#### 带Nginx反向代理
```bash
docker-compose --profile with-nginx up -d
```

#### 带监控(Prometheus + Grafana)
```bash
docker-compose --profile with-monitoring up -d
```

### 4. 验证部署

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 健康检查
curl http://localhost:3101/api/health
```

预期输出:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-23T01:30:00.000Z",
  "uptime": 120,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "websocket": "ok"
  }
}
```

### 5. 访问应用

- **API文档**: http://localhost:3101/api-docs
- **监控面板**: http://localhost:3000 (Grafana,默认密码: admin)
- **指标查询**: http://localhost:9090 (Prometheus)

## 传统部署

### 1. 安装Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node@18
```

### 2. 安装依赖

```bash
cd backend
npm ci --production
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件设置JWT_SECRET等配置
```

### 4. 初始化数据库

```bash
node init-users.js
```

### 5. 使用PM2启动(推荐)

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server-v2.js --name guoyunpms

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs guoyunpms
```

### 6. 使用systemd启动(替代方案)

创建服务文件 `/etc/systemd/system/guoyunpms.service`:
```ini
[Unit]
Description=GuoyunPMS Backend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/guoyunpms/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server-v2.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable guoyunpms
sudo systemctl start guoyunpms
sudo systemctl status guoyunpms
```

## 配置说明

### Nginx反向代理配置

创建 `nginx/nginx.conf`:
```nginx
upstream backend {
    server backend:3101;
}

upstream websocket {
    server backend:3102;
}

server {
    listen 80;
    server_name pms.example.com;

    # HTTPS重定向
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pms.example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # API路由
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket路由
    location /ws/ {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

### SSL证书配置

#### 使用Let's Encrypt(免费)
```bash
# 安装certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d pms.example.com

# 自动续期(已自动配置cron)
sudo certbot renew --dry-run
```

#### 使用自签名证书(测试)
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### Prometheus监控配置

创建 `prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'guoyunpms'
    static_configs:
      - targets: ['backend:3101']
    metrics_path: '/metrics'
```

## 运维脚本

### 数据库备份

#### 手动备份
```bash
./scripts/backup-database.sh
```

#### 配置自动备份
```bash
# 安装cron任务
./scripts/setup-cron.sh

# 验证
crontab -l | grep "backup"
```

#### 恢复备份
```bash
# 停止服务
docker-compose stop backend

# 恢复数据库
gunzip -c /app/backups/pms_backup_20260423_020000.db.gz > /app/database/pms.db

# 启动服务
docker-compose start backend
```

### 健康检查和自动重启

#### 手动执行
```bash
./scripts/healthcheck-restart.sh
```

#### 自动定时检查
```bash
# 已通过setup-cron.sh配置,每5分钟自动执行
# 查看健康检查日志
tail -f /var/log/guoyunpms/healthcheck.log
```

### 日志管理

#### 查看实时日志
```bash
# Docker部署
docker-compose logs -f backend

# PM2部署
pm2 logs guoyunpms

# systemd部署
journalctl -u guoyunpms -f
```

#### 日志清理
```bash
# 清理7天前的日志(自动,通过cron)
find /var/log/guoyunpms -name '*.log' -mtime +7 -delete
```

### 数据库维护

#### 优化数据库
```bash
# SQLite VACUUM(压缩数据库)
sqlite3 /app/database/pms.db "VACUUM;"

# 检查数据库完整性
sqlite3 /app/database/pms.db "PRAGMA integrity_check;"
```

#### 导出数据
```bash
# 导出为SQL
sqlite3 /app/database/pms.db .dump > backup.sql

# 导入数据
sqlite3 /app/database/pms.db < backup.sql
```

## 监控与告警

### Grafana仪表盘

访问 http://localhost:3000 登录Grafana(默认账号: admin/admin)

推荐监控指标:
- API响应时间(P50/P95/P99)
- 请求成功率
- 数据库查询耗时
- 内存使用率
- CPU使用率
- WebSocket连接数

### 告警配置

在健康检查脚本中配置告警Webhook:
```bash
export ALERT_WEBHOOK="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
```

支持的告警渠道:
- 飞书机器人
- 钉钉机器人
- Slack Webhook
- 企业微信机器人

## 故障排查

### 服务启动失败

**问题**: 端口被占用
```bash
# 检查端口占用
lsof -i :3101
netstat -tulnp | grep 3101

# 杀死占用进程
kill -9 <PID>
```

**问题**: 数据库文件损坏
```bash
# 从备份恢复
gunzip -c /app/backups/pms_backup_latest.db.gz > /app/database/pms.db
```

### Redis连接失败

**问题**: Redis未启动
```bash
# 检查Redis状态
docker-compose ps redis
systemctl status redis

# 启动Redis
docker-compose up -d redis
systemctl start redis
```

**问题**: Redis密码错误
```bash
# 检查环境变量
env | grep REDIS

# 测试连接
redis-cli -h localhost -p 6379 -a your-password ping
```

### WebSocket连接断开

**问题**: Nginx配置错误
```nginx
# 确保包含以下配置
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "Upgrade";
```

**问题**: 防火墙阻止
```bash
# 开放WebSocket端口
sudo ufw allow 3102/tcp
```

### 性能问题

**问题**: 数据库查询慢
```bash
# 添加索引(参考ARCHITECTURE.md)
sqlite3 /app/database/pms.db "CREATE INDEX idx_orders_dates ON orders(check_in_date, check_out_date);"
```

**问题**: 内存占用高
```bash
# 检查内存使用
docker stats backend

# 限制容器内存
docker-compose.yml中添加:
services:
  backend:
    mem_limit: 512m
```

### 日志分析

```bash
# 查找错误日志
grep "ERROR" /var/log/guoyunpms/*.log

# 统计API请求
grep "GET\|POST" /var/log/guoyunpms/*.log | wc -l

# 分析响应时间
grep "duration" /var/log/guoyunpms/*.log | awk '{sum+=$NF; count++} END {print sum/count}'
```

## 安全加固

### 1. 防火墙配置

```bash
# UFW防火墙
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. 定期更新

```bash
# 更新系统
sudo apt-get update && sudo apt-get upgrade

# 更新Docker镜像
docker-compose pull
docker-compose up -d
```

### 3. 访问限制

在Nginx中添加IP白名单:
```nginx
# 仅允许特定IP访问后台
location /api/admin/ {
    allow 192.168.1.0/24;
    deny all;
    proxy_pass http://backend;
}
```

### 4. 速率限制

```nginx
# 限制API请求频率
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20;
    proxy_pass http://backend;
}
```

## 性能优化

### 1. 数据库优化

- 添加索引(见ARCHITECTURE.md)
- 定期执行VACUUM压缩
- 考虑迁移到PostgreSQL(大规模场景)

### 2. 缓存优化

- 启用Redis缓存
- 增加缓存TTL
- 使用CDN加速静态资源

### 3. 负载均衡

```yaml
# 多实例部署
services:
  backend:
    deploy:
      replicas: 3
```

### 4. 资源监控

- 使用`docker stats`监控容器资源
- Prometheus + Grafana可视化
- 设置告警阈值

## 备份策略

### 推荐备份方案

| 备份类型 | 频率 | 保留期 | 存储位置 |
|---------|------|--------|---------|
| 数据库全量 | 每日 | 30天 | 本地 + S3 |
| 配置文件 | 每次变更 | 永久 | Git仓库 |
| 日志文件 | 每周 | 90天 | 本地 |
| Docker镜像 | 每次发布 | 最近3版本 | 容器仓库 |

### 灾难恢复

1. 从备份恢复数据库
2. 重新部署Docker容器
3. 恢复配置文件
4. 验证服务健康

## 总结

本文档涵盖了GuoyunPMS的完整部署流程。遇到问题时:
1. 查看日志文件
2. 参考[故障排查](#故障排查)章节
3. 提交[GitHub Issue](https://github.com/xingxingstars123/GuoyunPMS/issues)

---

**文档版本**: v2.0.0  
**更新日期**: 2026-04-23
