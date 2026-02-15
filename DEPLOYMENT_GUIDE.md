# SocksFlow 完整部署指南

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     用户访问                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel (前端)                                              │
│  https://socksflow.vercel.app                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js 应用 (静态导出)                              │   │
│  │  - 全球 CDN 加速                                      │   │
│  │  - 自动 HTTPS                                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API 请求
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Railway (后端)                                             │
│  https://socksflow-api.up.railway.app                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FastAPI 应用 (Python 3.11)                          │   │
│  │  - 自动扩缩容                                         │   │
│  │  - 健康检查                                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Neon (数据库)                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 15 (Serverless)                         │   │
│  │  - 自动扩展                                           │   │
│  │  - 每日备份                                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 部署顺序

**必须按顺序部署：**
1. Neon 数据库（获取连接字符串）
2. Railway 后端（依赖数据库）
3. Vercel 前端（依赖后端 API）

---

## 第一步：部署数据库（Neon）

### 1. 创建项目

1. 访问 https://console.neon.tech/
2. 点击 "New Project"
3. 项目名称：`socksflow-db`
4. 区域选择：
   - 亚洲用户 → `Singapore`
   - 美国用户 → `US East (N. Virginia)`
5. 点击 "Create Project"

### 2. 获取连接字符串

创建完成后，Neon 会显示：
```
postgresql://username:password@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/socksflow?sslmode=require
```

**保存此字符串！** 后续步骤需要。

### 3. 初始化数据库

**方式一：Neon SQL Editor**

1. 进入 Neon 控制台
2. 点击左侧 "SQL Editor"
3. 执行以下 SQL：

```sql
-- 创建表（由后端自动完成，或手动执行）
-- 后端启动时会自动创建表
```

**方式二：本地连接初始化**

```bash
# 设置环境变量
export DATABASE_URL="postgresql://username:password@host.neon.tech/socksflow?sslmode=require"

# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动后端（会自动创建表）
python -m uvicorn app.main:app --reload
```

---

## 第二步：部署后端（Railway）

### 方式一：Dashboard 部署（推荐）

1. **创建项目**
   - 访问 https://railway.app/dashboard
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择 `socksflow` 仓库
   - 点击 "Add Variables"

2. **配置环境变量**

   | 变量名 | 值 |
   |--------|-----|
   | `DATABASE_URL` | `postgresql://...` (Neon 的连接字符串) |
   | `SECRET_KEY` | 随机 32 位以上字符串 |
   | `FRONTEND_URL` | `https://socksflow.vercel.app` (先占位，部署完前端再改) |

3. **配置部署**
   - Settings → Deploy
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Healthcheck Path: `/health`
   - 点击 "Deploy"

4. **生成域名**
   - Settings → Domains
   - 点击 "Generate Domain"
   - 获取类似 `socksflow-api.up.railway.app` 的域名

### 方式二：CLI 部署

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
railway variables set DATABASE_URL="postgresql://username:password@host.neon.tech/socksflow?sslmode=require"
railway variables set SECRET_KEY="your-super-secret-key-here-32-chars-min"
railway variables set FRONTEND_URL="https://socksflow.vercel.app"

# 部署
railway up

# 获取域名
railway domain
```

### 验证后端部署

```bash
# 测试健康检查
curl https://socksflow-api.up.railway.app/health

# 预期响应
{"status":"healthy","version":"1.0.0","service":"袜子订阅服务"}
```

---

## 第三步：部署前端（Vercel）

### 方式一：Dashboard 部署（推荐）

1. **导入项目**
   - 访问 https://vercel.com/new
   - 导入 GitHub 仓库 `socksflow`
   - Framework Preset: Next.js

2. **配置构建**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **添加环境变量**

   | 变量名 | 值 |
   |--------|-----|
   | `NEXT_PUBLIC_API_URL` | `https://socksflow-api.up.railway.app/api/v1` |

4. **点击 Deploy**

### 方式二：CLI 部署

```bash
# 安装 CLI
npm install -g vercel

# 进入前端目录
cd frontend

# 登录
vercel login

# 链接项目
vercel link

# 设置环境变量
vercel env add NEXT_PUBLIC_API_URL
# 输入: https://socksflow-api.up.railway.app/api/v1

# 部署
vercel --prod
```

### 验证前端部署

访问 `https://socksflow.vercel.app`，测试：
- 页面正常加载
- 注册/登录功能
- 创建订阅
- 支付流程

---

## 更新后端 CORS 配置

部署完前端后，需要更新后端的 `FRONTEND_URL`：

```bash
# 使用 Railway CLI
railway variables set FRONTEND_URL="https://socksflow.vercel.app"

# 或在 Dashboard 中修改
# 修改后会自动重新部署
```

---

## 绑定自定义域名（可选）

### 前端（Vercel）

1. Vercel Dashboard → 项目 → Settings → Domains
2. 添加域名 `socksflow.com`
3. 按提示配置 DNS

### 后端（Railway）

1. Railway Dashboard → 项目 → Settings → Domains
2. 添加自定义域名 `api.socksflow.com`
3. 配置 DNS CNAME 记录

---

## 费用估算

| 服务 | 免费额度 | 推荐方案 | 月费用 |
|------|---------|---------|--------|
| **Vercel** | 100GB 带宽 | Pro（无限带宽） | $20 |
| **Railway** | $5 额度 | 免费版（小项目够用） | $0 |
| **Neon** | 500MB 存储 | 免费版 | $0 |
| **域名** | - | Namecheap | $12/年 |

**总计：** $20/月（使用 Vercel Pro）或 $0（全部免费版）

---

## 故障排查

### 后端连接失败

```bash
# 检查后端健康
curl https://your-api.up.railway.app/health

# 检查数据库连接
railway logs
```

### 前端 API 404

检查 `NEXT_PUBLIC_API_URL` 是否正确配置，确保以 `/api/v1` 结尾。

### CORS 错误

确保后端 `FRONTEND_URL` 环境变量包含前端域名。

---

## 快速检查清单

- [ ] Neon 数据库已创建并获取连接字符串
- [ ] Railway 后端已部署并生成域名
- [ ] 后端健康检查 (`/health`) 正常
- [ ] Vercel 前端已部署
- [ ] 前端环境变量 `NEXT_PUBLIC_API_URL` 已配置
- [ ] 后端环境变量 `FRONTEND_URL` 已更新为前端域名
- [ ] 测试注册/登录/订阅创建功能

---

## 相关文档

- [Vercel 部署详细指南](./DEPLOY_VERCEL.md)
- [Railway 部署详细指南](./DEPLOY_RAILWAY.md)
