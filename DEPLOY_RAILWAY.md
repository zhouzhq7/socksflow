# SocksFlow Railway 后端部署指南

## 概述

使用 Railway 部署 FastAPI 后端，配合 Neon PostgreSQL 数据库。

## 快速开始

### 方式一：Railway Dashboard（推荐）

#### 1. 创建 Railway 项目

1. 访问 https://railway.app/dashboard
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的 `socksflow` 仓库
5. 选择分支 `main`

#### 2. 配置环境变量

在 Railway Dashboard → Variables 中添加：

```bash
# 必需变量
DATABASE_URL=postgresql://username:password@host.neon.tech/socksflow?sslmode=require
SECRET_KEY=your-super-secret-key-min-32-characters
FRONTEND_URL=https://socksflow.vercel.app

# 可选变量
DEBUG=false
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

**注意：**
- `SECRET_KEY` 必须是至少 32 个字符的随机字符串
- `DATABASE_URL` 从 Neon 控制台获取

#### 3. 配置部署

项目设置 → Deploy：
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Healthcheck Path**: `/health`
- **Restart Policy**: On Failure

#### 4. 生成域名

Settings → Domains → Generate Domain：
- 获取类似 `https://socksflow-api.up.railway.app` 的域名

### 方式二：Railway CLI

```bash
# 安装 CLI
npm install -g @railway/cli

# 登录
railway login

# 进入后端目录
cd backend

# 初始化项目
railway init

# 设置环境变量
railway variables set DATABASE_URL="postgresql://..."
railway variables set SECRET_KEY="your-secret-key"
railway variables set FRONTEND_URL="https://socksflow.vercel.app"

# 部署
railway up

# 查看日志
railway logs

# 获取域名
railway domain
```

## 数据库配置（Neon）

### 1. 创建 Neon 项目

1. 访问 https://console.neon.tech/
2. New Project → 名称 `socksflow-db`
3. 选择区域：新加坡 (Singapore) 或美国东部 (US East)
4. 复制连接字符串

### 2. 运行数据库迁移

**方式一：本地运行迁移**

```bash
# 设置环境变量
export DATABASE_URL="postgresql://..."

# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 运行迁移（如果使用 Alembic）
alembic upgrade head

# 或者手动初始化表
python -c "
import asyncio
from app.core.database import init_db
asyncio.run(init_db())
"
```

**方式二：Railway 上运行**

```bash
# 使用 Railway CLI 连接到项目
railway connect

# 运行 Python 脚本初始化数据库
railway run python -c "
import asyncio
from app.core.database import init_db
asyncio.run(init_db())
"
```

## 配置文件说明

### railway.toml

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

### Procfile

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### runtime.txt

```
python-3.11.6
```

## 环境变量参考

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 | `postgresql://user:pass@host/db?sslmode=require` |
| `SECRET_KEY` | ✅ | JWT 密钥，32位以上 | `your-secret-key-here` |
| `FRONTEND_URL` | ✅ | 前端域名 | `https://socksflow.vercel.app` |
| `ALLOWED_ORIGINS` | ❌ | CORS 允许的域名 | 逗号分隔的 URL 列表 |
| `DEBUG` | ❌ | 调试模式 | `false` |
| `ALGORITHM` | ❌ | JWT 算法 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | Token 过期时间 | `10080` (7天) |
| `ALIPAY_APP_ID` | ❌ | 支付宝 App ID | - |
| `ALIPAY_PRIVATE_KEY` | ❌ | 支付宝私钥 | - |

## 故障排查

### 1. 部署失败

查看日志：
```bash
railway logs
```

常见问题：
- **依赖安装失败**：检查 `requirements.txt` 格式
- **端口冲突**：确保使用 `$PORT` 环境变量
- **启动超时**：增加 `healthcheckTimeout`

### 2. 数据库连接失败

检查：
```bash
# 测试连接
railway run python -c "
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def test():
    async with engine.connect() as conn:
        result = await conn.execute(text('SELECT 1'))
        print(result.fetchone())

asyncio.run(test())
"
```

### 3. CORS 错误

确保 `FRONTEND_URL` 和 `ALLOWED_ORIGINS` 包含前端域名：
```bash
railway variables set FRONTEND_URL="https://your-frontend.vercel.app"
```

### 4. 健康检查失败

访问 `/health` 端点测试：
```bash
curl https://your-api.up.railway.app/health
```

## 自动部署

### GitHub Actions 配置

创建 `.github/workflows/deploy-backend.yml`：

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: "socksflow-api"
```

添加 GitHub Secrets：
- `RAILWAY_TOKEN`: 从 Railway Dashboard → Tokens 获取

## 费用说明

| 方案 | 月费用 | 包含 |
|------|--------|------|
| **免费版** | $5 额度 | 500小时运行时间，512MB RAM |
| **标准版** | $10/月 | 无限运行时间，1GB RAM |
| **专业版** | $20/月 | 2GB RAM，优先支持 |

免费版足够小项目使用。

## 生产检查清单

- [ ] 环境变量已配置
- [ ] 数据库已初始化（表已创建）
- [ ] 健康检查端点正常
- [ ] CORS 配置包含前端域名
- [ ] 域名已生成并记录
- [ ] 前端已更新 API URL
