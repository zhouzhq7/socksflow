# SocksFlow 阿里云部署指南

## 方案选择

| 方案 | 适用场景 | 价格 | 特点 |
|------|---------|------|------|
| **函数计算 FC** | 中小规模，按需付费 | 免费额度 + ¥0.0001/万次 | 无服务器，自动扩缩容 |
| **轻量应用服务器** | 稳定生产环境 | ¥24-99/月 | 固定IP，简单管理 |
| **ECS** | 大规模应用 | ¥99/年起 | 完全控制，性能最强 |

**推荐：函数计算 FC**（开发测试）或 **轻量服务器**（生产环境）

---

## 方案一：函数计算 FC（Serverless）

### 1. 准备工作

```bash
# 安装阿里云 CLI
curl -O https://aliyuncli.alicdn.com/aliyun-cli-macosx-latest.tar.gz
tar -xvf aliyun-cli-macosx-latest.tar.gz
sudo mv aliyun /usr/local/bin/

# 配置账号
aliyun configure
# 输入 AccessKey ID 和 AccessKey Secret
```

**获取 AccessKey：**
1. 登录 https://www.aliyun.com/
2. 右上角头像 → AccessKey 管理
3. 创建 AccessKey（保存好，只显示一次）

### 2. 创建服务和函数

**方式一：控制台（推荐新手）**

1. 访问 https://fc.console.aliyun.com/
2. 点击 "创建服务"
   - 服务名称：`socksflow-api`
   - 描述：袜子订阅后端服务
3. 点击 "创建函数"
   - 函数名称：`api`
   - 运行环境：`Python 3.10`
   - 触发器：HTTP 触发器
   - 认证方式：无需认证

**方式二：Serverless Devs（推荐自动化）**

```bash
# 安装 Serverless Devs
npm install -g @serverless-devs/s

# 配置阿里云账号
s config add --AccessKeyID your-ak-id --AccessKeySecret your-ak-secret --AccountID your-account-id

# 部署
cd .aliyun/fc
s deploy
```

### 3. 配置环境变量

在函数计算控制台：
- 服务 `socksflow-api` → 函数 `api` → 配置 → 环境变量

添加以下变量：

```yaml
DATABASE_URL: sqlite+aiosqlite:///tmp/socksflow.db
SECRET_KEY: your-secret-key-here
FRONTEND_URL: https://socksflow.vercel.app
ALIPAY_APP_ID: your-alipay-app-id
ALIPAY_PRIVATE_KEY: your-alipay-private-key
ALIPAY_PUBLIC_KEY: your-alipay-public-key
```

### 4. 支付宝配置（国内支付）

**沙箱环境（测试）：**

1. 访问 https://open.alipay.com/develop/sandbox/app
2. 获取 APP ID、私钥、公钥
3. 将沙箱密钥填入环境变量

**生产环境：**

1. 注册企业支付宝账号
2. 创建应用，签约 "电脑网站支付"
3. 获取正式密钥

---

## 方案二：轻量应用服务器（推荐生产环境）

### 1. 购买服务器

1. 访问 https://www.aliyun.com/product/swas
2. 选择配置：
   - **地域**：华东1（杭州）或华南1（深圳）
   - **镜像**：Ubuntu 22.04
   - **套餐**：
     - 开发测试：1核2G（¥24/月）
     - 生产环境：2核4G（¥68/月）
3. 选择时长（新用户首年 ¥99）
4. 支付（支持支付宝/微信）

### 2. 连接服务器

```bash
# 在阿里云控制台获取服务器 IP 和 root 密码

# SSH 连接
ssh root@your-server-ip

# 更新系统
apt update && apt upgrade -y
```

### 3. 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
apt install -y docker-compose
```

### 4. 部署 SocksFlow

**方式一：使用 Docker Compose（推荐）**

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: socksflow-api
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///app.db
      - SECRET_KEY=your-secret-key
      - FRONTEND_URL=https://socksflow.vercel.app
      - ALIPAY_APP_ID=your-app-id
      - ALIPAY_PRIVATE_KEY=your-private-key
      - ALIPAY_PUBLIC_KEY=your-public-key
    volumes:
      - ./data:/app/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: socksflow-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

创建 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

部署：

```bash
# 克隆代码
git clone https://github.com/zhouzhq7/socksflow.git
cd socksflow

# 创建数据目录
mkdir -p data

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

**方式二：直接部署（不用 Docker）**

```bash
# 安装 Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# 创建虚拟环境
cd /opt
git clone https://github.com/zhouzhq7/socksflow.git
cd socksflow/backend
python3.11 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置 systemd 服务
cat > /etc/systemd/system/socksflow.service << 'EOF'
[Unit]
Description=SocksFlow API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/socksflow/backend
Environment="DATABASE_URL=sqlite+aiosqlite:///app.db"
Environment="SECRET_KEY=your-secret-key"
Environment="FRONTEND_URL=https://socksflow.vercel.app"
Environment="PORT=8000"
ExecStart=/opt/socksflow/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
systemctl daemon-reload
systemctl enable socksflow
systemctl start socksflow

# 查看状态
systemctl status socksflow
```

### 5. 配置域名和 SSL

**绑定域名：**
1. 在阿里云控制台 → 轻量应用服务器 → 域名
2. 添加你的域名（如 api.socksflow.com）
3. 在域名服务商添加 A 记录指向服务器 IP

**配置 SSL（Let's Encrypt）：**

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d api.socksflow.com

# 自动续期
certbot renew --dry-run
```

---

## 方案三：Serverless Devs 自动化部署

### 1. 安装工具

```bash
npm install -g @serverless-devs/s
s config add
```

### 2. 部署

```bash
cd sock-subscription/.aliyun/fc

# 一键部署
s deploy

# 查看日志
s logs

# 移除部署
s remove
```

---

## 支付宝支付配置详解

### 沙箱环境配置（测试）

1. 登录 https://open.alipay.com/develop/sandbox/app
2. 获取：
   - **APPID**: 如 `2024XXXXXX`
   - **支付宝公钥**: 从网页复制
   - **应用私钥**: 使用支付宝密钥工具生成

3. 配置环境变量：
```yaml
ALIPAY_APP_ID: 2024XXXXXXXXXXXX
ALIPAY_PRIVATE_KEY: -----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY: -----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```

4. 沙箱测试账号：
   - 买家账号：从沙箱控制台获取
   - 登录密码：默认 111111
   - 支付密码：默认 111111

### 生产环境配置

1. 企业支付宝认证
2. 创建应用，签约 "电脑网站支付" 产品
3. 上传应用公钥，获取支付宝公钥
4. 替换沙箱配置为生产配置

---

## 费用对比

| 方案 | 月费用 | 年费用 | 适用场景 |
|------|--------|--------|---------|
| **FC 免费额度** | ¥0 | ¥0 | 开发测试，日调用 < 100万次 |
| **FC 按量** | ¥0-50 | - | 中小规模，流量不稳定 |
| **轻量服务器** | ¥24-68 | ¥288-816 | 稳定生产环境 |
| **新用户优惠** | - | ¥99 | 首年特惠（2核2G）|

---

## 推荐配置

### 开发测试
- **平台**: 函数计算 FC
- **数据库**: SQLite（免费）
- **费用**: ¥0

### 生产环境
- **平台**: 轻量应用服务器（2核2G）
- **数据库**: RDS MySQL（¥9.9/月）或继续使用 SQLite
- **费用**: ¥99/年（新用户）

---

## 快速开始

**最快路径（5分钟部署）：**

```bash
# 1. 购买轻量服务器（支付宝支付）
# 访问：https://www.aliyun.com/product/swas

# 2. SSH 连接服务器
ssh root@your-server-ip

# 3. 一键安装
curl -fsSL https://raw.githubusercontent.com/zhouzhq7/socksflow/main/.aliyun/install.sh | bash

# 4. 配置环境变量
export FRONTEND_URL=https://your-frontend.vercel.app
export ALIPAY_APP_ID=your-app-id

# 5. 启动
docker-compose up -d
```

需要我创建具体的部署脚本吗？
