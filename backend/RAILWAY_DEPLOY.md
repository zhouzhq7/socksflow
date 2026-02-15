# SocksFlow Railway 部署指南

## 前置要求
- 已安装 Railway CLI: `npm install -g @railway/cli`
- 已登录 Railway: `railway login`

## 部署步骤

### 1. 进入后端目录
```bash
cd sock-subscription/backend
```

### 2. 初始化 Railway 项目（首次部署）
```bash
railway init
```
选择:
- "Create a new project"
- 项目名: `socksflow-backend`

### 3. 设置环境变量

#### 选项 A: SQLite (快速测试，已配置)
```bash
railway variables set DATABASE_URL="sqlite+aiosqlite:///app.db"
railway variables set SECRET_KEY="socksflow-secret-key-2024-for-jwt-tokens"
railway variables set FRONTEND_URL="https://socksflow.vercel.app"
```

#### 选项 B: PostgreSQL (生产推荐)
1. 在 Railway Dashboard 中添加 PostgreSQL 插件
2. 复制数据库连接字符串到 `DATABASE_URL`
3. 格式: `postgresql+asyncpg://user:pass@host:port/dbname`

### 4. 部署
```bash
railway up
```

### 5. 获取域名
```bash
railway domain
```
输出示例: `socksflow-backend-production.up.railway.app`

### 6. 验证部署
```bash
curl https://{your-domain}/health
```

## 配置说明

### 已配置的文件
- `railway.toml` - Railway 部署配置
- `Procfile` - 启动命令
- `requirements.txt` - Python 依赖
- `runtime.txt` - Python 版本 (3.11.6)

### 健康检查
- 路径: `/health`
- 自动重启: 失败时最多 10 次

### CORS 配置
已允许以下来源:
- `https://socksflow.vercel.app`
- `https://*.vercel.app`

## 管理命令

### 查看日志
```bash
railway logs
```

### 查看环境变量
```bash
railway variables
```

### 重新部署
```bash
railway up
```

### 打开 Dashboard
```bash
railway open
```

## 故障排除

### 数据库连接问题
- 检查 `DATABASE_URL` 格式是否正确
- SQLite: `sqlite+aiosqlite:///app.db`
- PostgreSQL: `postgresql+asyncpg://...`

### 部署失败
1. 检查日志: `railway logs`
2. 确保所有依赖在 `requirements.txt` 中
3. 验证 `railway.toml` 配置

### 健康检查失败
- 确认应用监听 `0.0.0.0:$PORT`
- 检查 `/health` 端点返回 200
