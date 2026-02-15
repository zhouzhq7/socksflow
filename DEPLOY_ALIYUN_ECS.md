# 阿里云 ECS 部署指南（现有服务器）

## 📋 服务器信息
- **公网 IP**: 39.102.211.111
- **配置**: 2核 2GB RAM
- **系统**: Alibaba Cloud Linux 3
- **位置**: 华北2（北京）

---

## 🚀 快速部署（5分钟）

### 方式一：一键脚本（推荐）

```bash
# 1. SSH 连接服务器
ssh root@39.102.211.111

# 2. 下载并执行部署脚本
curl -fsSL https://raw.githubusercontent.com/zhouzhq7/socksflow/main/.aliyun/deploy-to-ecs.sh | bash

# 3. 启动服务
cd /opt/socksflow && docker-compose up -d
```

### 方式二：手动部署

#### 步骤 1: 连接服务器
```bash
ssh root@39.102.211.111
```

#### 步骤 2: 安装 Docker
```bash
# 安装 Docker
yum install -y docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### 步骤 3: 部署应用
```bash
# 创建目录
mkdir -p /opt/socksflow
cd /opt/socksflow

# 克隆代码
git clone https://github.com/zhouzhq7/socksflow.git .

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: socksflow-api
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///app/data/socksflow.db
      - SECRET_KEY=socksflow-secret-key-change-this
      - FRONTEND_URL=https://socksflow.vercel.app
      - PYTHONUNBUFFERED=1
    volumes:
      - ./data:/app/data

  nginx:
    image: nginx:alpine
    container_name: socksflow-nginx
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
EOF

# 创建 nginx.conf
cat > nginx.conf << 'EOF'
events { worker_connections 1024; }
http {
    upstream backend { server backend:8000; }
    server {
        listen 80;
        location /health { proxy_pass http://backend/health; }
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }
        location / { return 200 '{"message": "SocksFlow API"}'; add_header Content-Type application/json; }
    }
}
EOF

# 创建数据目录
mkdir -p data

# 启动服务
docker-compose up -d
```

---

## ⚙️ 配置说明

### 环境变量
编辑 `/opt/socksflow/.env`：

```bash
# 必需
SECRET_KEY=your-random-secret-key-32-chars
FRONTEND_URL=https://socksflow.vercel.app

# 支付宝支付（可选）
ALIPAY_APP_ID=2024XXXXXXXXXXXX
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```

### 安全组配置
在阿里云控制台 → 安全组 → 入方向规则，确保开放：
- **端口 80**: HTTP 访问
- **端口 443**: HTTPS（如果使用 SSL）
- **端口 8000**: 直接访问后端（可选，调试使用）

---

## 🔒 配置 HTTPS（Let's Encrypt）

```bash
# 安装 Certbot
yum install -y certbot python3-certbot-nginx

# 获取证书（将 api.yourdomain.com 替换为你的域名）
certbot --nginx -d api.yourdomain.com

# 自动续期测试
certbot renew --dry-run
```

---

## 📊 常用命令

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新代码
cd /opt/socksflow && git pull && docker-compose up -d --build

# 进入容器
docker exec -it socksflow-api /bin/sh

# 备份数据库
docker cp socksflow-api:/app/data/socksflow.db ./backup-$(date +%Y%m%d).db
```

---

## 🧪 测试部署

```bash
# 测试健康检查
curl http://39.102.211.111/health

# 预期输出
{"status":"healthy","version":"1.0.0","service":"袜子订阅服务"}

# 测试 API
curl http://39.102.211.111/api/v1/health
```

---

## 🔧 故障排查

### 问题 1: 端口无法访问
**解决**: 检查阿里云安全组规则，确保开放 80 端口

### 问题 2: CORS 错误
**解决**: 确保 `FRONTEND_URL` 环境变量包含前端域名

### 问题 3: 数据库权限错误
**解决**: 
```bash
chmod -R 777 /opt/socksflow/data
docker-compose restart backend
```

---

## 🎯 部署完成后的配置

### 更新 Vercel 前端环境变量
在 Vercel Dashboard 中更新：
```
NEXT_PUBLIC_API_URL=http://39.102.211.111/api/v1
```

### 绑定域名（可选）
1. 域名解析：添加 A 记录指向 39.102.211.111
2. 更新 `FRONTEND_URL` 环境变量
3. 配置 HTTPS

---

## 💰 费用说明

当前服务器费用已支付，部署 SocksFlow 后端 **无额外费用**！

---

## 📞 需要帮助？

部署遇到问题可以：
1. 查看日志：`docker-compose logs -f`
2. 检查状态：`docker-compose ps`
3. 重启服务：`docker-compose restart`
