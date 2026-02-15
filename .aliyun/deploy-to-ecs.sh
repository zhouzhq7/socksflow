#!/bin/bash
# SocksFlow 阿里云 ECS 一键部署脚本
# 使用方法: ./deploy-to-ecs.sh

set -e

echo "🚀 SocksFlow 阿里云 ECS 部署脚本"
echo "================================"

# 配置
APP_NAME="socksflow"
APP_DIR="/opt/$APP_NAME"
DOMAIN="api.socksflow.com"  # 修改为你的域名
FRONTEND_URL="https://socksflow.vercel.app"  # 修改为你的前端地址

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否 root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 权限运行: sudo bash deploy-to-ecs.sh${NC}"
    exit 1
fi

# 1. 系统更新
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
yum update -y || apt update -y

# 2. 安装依赖
echo -e "${YELLOW}[2/8] 安装依赖...${NC}"
if command -v yum &> /dev/null; then
    # Alibaba Cloud Linux / CentOS
    yum install -y git docker nginx
    systemctl start docker
    systemctl enable docker
elif command -v apt &> /dev/null; then
    # Ubuntu/Debian
    apt install -y git docker.io nginx
    systemctl start docker
    systemctl enable docker
fi

# 安装 Docker Compose
echo -e "${YELLOW}[3/8] 安装 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 3. 创建应用目录
echo -e "${YELLOW}[4/8] 创建应用目录...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# 4. 克隆代码
echo -e "${YELLOW}[5/8] 克隆代码...${NC}"
if [ -d "$APP_DIR/backend" ]; then
    cd backend && git pull origin main
else
    git clone https://github.com/zhouzhq7/socksflow.git .
fi

# 5. 创建 Docker Compose 配置
echo -e "${YELLOW}[6/8] 创建 Docker Compose 配置...${NC}"
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: socksflow-api
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///app/data/socksflow.db
      - SECRET_KEY=${SECRET_KEY}
      - FRONTEND_URL=${FRONTEND_URL}
      - ALIPAY_APP_ID=${ALIPAY_APP_ID}
      - ALIPAY_PRIVATE_KEY=${ALIPAY_PRIVATE_KEY}
      - ALIPAY_PUBLIC_KEY=${ALIPAY_PUBLIC_KEY}
      - PYTHONUNBUFFERED=1
    volumes:
      - ./data:/app/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: socksflow-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  data:
EOF

# 6. 创建 Nginx 配置
echo -e "${YELLOW}[7/8] 创建 Nginx 配置...${NC}"
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript;

    # 后端服务
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name _;  # 接受所有域名

        # 健康检查
        location /health {
            proxy_pass http://backend/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API 请求
        location /api/ {
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS 头
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            
            # 处理预检请求
            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        # 静态文件（如果有）
        location / {
            return 200 '{"message": "SocksFlow API Server"}';
            add_header Content-Type application/json;
        }
    }
}
EOF

# 7. 创建数据目录
echo -e "${YELLOW}[8/8] 创建数据目录...${NC}"
mkdir -p data ssl

# 8. 生成随机密钥
SECRET_KEY=$(openssl rand -base64 32)

# 9. 创建环境变量文件
cat > .env << EOF
# 生产环境配置
SECRET_KEY=$SECRET_KEY
FRONTEND_URL=$FRONTEND_URL

# 支付宝配置（可选）
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
EOF

echo ""
echo -e "${GREEN}✅ 部署配置创建完成！${NC}"
echo ""
echo "📝 请完成以下步骤："
echo ""
echo "1. 编辑环境变量文件："
echo "   nano $APP_DIR/.env"
echo ""
echo "2. 如果需要配置支付宝，请添加："
echo "   ALIPAY_APP_ID=你的APPID"
echo "   ALIPAY_PRIVATE_KEY=你的私钥"
echo "   ALIPAY_PUBLIC_KEY=你的公钥"
echo ""
echo "3. 启动服务："
echo "   cd $APP_DIR && docker-compose up -d"
echo ""
echo "4. 查看日志："
echo "   docker-compose logs -f"
echo ""
echo "🔗 访问地址："
echo "   健康检查: http://$DOMAIN/health"
echo "   API地址: http://$DOMAIN/api/v1"
echo ""
echo "🌐 服务器IP: $(curl -s http://checkip.amazonaws.com 2>/dev/null || echo '请查看阿里云控制台')"
