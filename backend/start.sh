#!/bin/bash
# SocksFlow 后端启动脚本
# 支持 Railway 和阿里云 ECS 部署

# 设置默认端口
PORT="${PORT:-8000}"

# 设置默认数据库
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="sqlite+aiosqlite:///app/data/socksflow.db"
fi

# 设置默认密钥
if [ -z "$SECRET_KEY" ]; then
    export SECRET_KEY="socksflow-default-secret-key-change-in-production"
fi

echo "🚀 Starting SocksFlow API Server..."
echo "📡 Port: $PORT"
echo "🗄️  Database: $DATABASE_URL"

# 启动 uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 1
