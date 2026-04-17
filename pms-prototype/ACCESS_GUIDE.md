# 🎉 PMS 系统访问指南

## ✅ 系统已成功启动！

### 📡 服务状态

| 服务 | 端口 | 状态 | PID |
|------|------|------|-----|
| 后端 API | 3100 | ✅ 运行中 | 413696 |
| 前端界面 | 5173 | ✅ 运行中 | 413842 |

---

## 🌐 访问方式

### 通过面板访问（推荐）

你的面板链接：
```
http://43.173.91.161:14818/3ds1v4#token=e0eb936f3698d3179fb84c9699b55f10402a4dfb9bf9470e
```

#### 方法 1: 使用面板的端口转发功能

1. 登录面板：http://43.173.91.161:14818/3ds1v4#token=e0eb936f3698d3179fb84c9699b55f10402a4dfb9bf9470e
2. 找到"端口转发"或"代理"功能
3. 配置转发规则：
   - 源端口: 任意（如 8080）
   - 目标端口: 5173
   - 协议: HTTP
4. 访问前端：http://43.173.91.161:8080

#### 方法 2: 使用 SSH 隧道

```bash
# 本地执行
ssh -L 5173:localhost:5173 root@43.173.91.161

# 然后在浏览器访问
http://localhost:5173
```

#### 方法 3: 直接访问服务器端口

如果服务器防火墙已开放 5173 端口：
```
http://43.173.91.161:5173
```

---

## 🔧 配置 Nginx 反向代理（推荐生产环境）

### 1. 安装 Nginx（如果未安装）

```bash
apt update
apt install -y nginx
```

### 2. 创建配置文件

```bash
cat > /etc/nginx/sites-available/pms << 'EOF'
server {
    listen 80;
    server_name _;

    # 前端
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/pms /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3. 访问地址

配置 Nginx 后，可以通过服务器 IP 的 80 端口访问：
```
http://43.173.91.161
```

---

## 🔍 检查服务状态

### 查看后端状态

```bash
cat /root/.openclaw/workspace/pms-prototype/backend/server.log
```

### 查看前端状态

```bash
cat /root/.openclaw/workspace/pms-prototype/frontend/frontend.log
```

### 查看运行进程

```bash
ps aux | grep -E "(node.*server|node.*vite)" | grep -v grep
```

### 查看端口监听

```bash
ss -tlnp | grep -E "(3100|5173)"
```

---

## 🛠 服务管理

### 停止服务

```bash
# 停止后端
kill 413696

# 停止前端
kill 413842
```

### 重启服务

```bash
# 重启后端
cd /root/.openclaw/workspace/pms-prototype/backend
nohup node server.js > server.log 2>&1 &

# 重启前端
cd /root/.openclaw/workspace/pms-prototype/frontend
nohup npm run dev > frontend.log 2>&1 &
```

---

## 🔐 防火墙配置

### 如果使用 UFW

```bash
# 开放端口
ufw allow 5173/tcp
ufw allow 3100/tcp
ufw reload

# 查看状态
ufw status
```

### 如果使用 iptables

```bash
# 开放端口
iptables -A INPUT -p tcp --dport 5173 -j ACCEPT
iptables -A INPUT -p tcp --dport 3100 -j ACCEPT
iptables-save > /etc/iptables/rules.v4
```

### 如果使用云服务器安全组

在云服务器控制台：
1. 找到"安全组"或"防火墙"设置
2. 添加入站规则：
   - 端口: 5173（前端）
   - 端口: 3100（后端）
   - 协议: TCP
   - 来源: 0.0.0.0/0（或限制 IP）

---

## 📱 测试访问

### 测试后端 API

```bash
curl http://localhost:3100/api/dashboard/stats
```

预期输出：
```json
{
  "revenue": 0,
  "availableRooms": 11,
  "roomStatus": {
    "preArrival": 0,
    "checkedIn": 0,
    "preDeparture": 0,
    "checkedOut": 0,
    "pending": 0
  }
}
```

### 测试前端界面

在浏览器访问：http://localhost:5173

预期：看到蓝色渐变的首页，显示"观芦民宿"。

---

## 🎯 常见问题

### Q: 无法访问前端界面？

**A**: 检查以下几点：
1. 服务是否正常运行：`ps aux | grep vite`
2. 端口是否监听：`ss -tlnp | grep 5173`
3. 防火墙是否开放：`ufw status`
4. 尝试使用 `curl http://localhost:5173` 测试

### Q: 前端可以访问，但无法加载数据？

**A**: 检查后端状态：
```bash
cat /root/.openclaw/workspace/pms-prototype/backend/server.log
curl http://localhost:3100/api/dashboard/stats
```

### Q: 修改代码后如何生效？

**A**: 
- 前端：Vite 支持热更新，保存即生效
- 后端：需要重启服务
  ```bash
  pkill -f "node server.js"
  cd /root/.openclaw/workspace/pms-prototype/backend
  nohup node server.js > server.log 2>&1 &
  ```

---

## 📊 系统信息

- **项目路径**: `/root/.openclaw/workspace/pms-prototype`
- **后端日志**: `backend/server.log`
- **前端日志**: `frontend/frontend.log`
- **数据库**: `database/pms.db`
- **后端 PID**: 413696
- **前端 PID**: 413842

---

## 🚀 下一步

1. **配置访问方式**（选择上面的方法之一）
2. **测试系统功能**：
   - 创建订单
   - 查看客户列表
   - 生成财务报表
   - 管理清洁任务
3. **根据需要定制功能**

---

**系统启动时间**: 2026-04-15 15:01 GMT+8  
**文档生成时间**: 2026-04-15 15:02 GMT+8
