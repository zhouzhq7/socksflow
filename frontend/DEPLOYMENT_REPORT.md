# SocksFlow 前端部署报告

## 📋 部署配置状态

### 1. 配置文件检查 ✅

| 文件 | 状态 | 说明 |
|------|------|------|
| `vercel.json` | ✅ 已配置 | Vercel 部署配置完整 |
| `next.config.ts` | ✅ 已配置 | Next.js 配置正确 |
| `package.json` | ✅ 已配置 | 依赖和脚本已定义 |
| `.env.production` | ✅ 已配置 | 生产环境变量已设置 |

### 2. 环境变量配置

```bash
NEXT_PUBLIC_API_URL=https://socksflow-api.up.railway.app/api/v1
NEXT_PUBLIC_APP_NAME=SocksFlow
NEXT_PUBLIC_APP_URL=https://socksflow.vercel.app
```

### 3. Vercel 配置详情

**vercel.json 关键配置：**
- 项目名称: `socksflow-frontend`
- 框架: `nextjs`
- 部署区域: `sin1`, `hkg1`, `icn1`, `sfo1`, `iad1`
- API 代理: `/api/*` → Railway 后端

**next.config.ts 关键配置：**
- 输出模式: `standalone`
- 图片优化: `unoptimized` (适配 Vercel)
- 安全响应头: X-Frame-Options, X-Content-Type-Options 等

---

## 🚀 部署方式

### 方式一：手动 CLI 部署（推荐）

```bash
# 1. 进入前端目录
cd sock-subscription/frontend

# 2. 登录 Vercel
vercel login

# 3. 链接项目（首次）
vercel link

# 4. 配置环境变量
vercel env add NEXT_PUBLIC_API_URL
# 输入: https://socksflow-api.up.railway.app/api/v1

# 5. 生产部署
vercel --prod
```

### 方式二：使用部署脚本

```bash
cd sock-subscription/frontend
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

### 方式三：GitHub Actions 自动部署

1. 在 GitHub 仓库设置以下 Secrets:
   - `VERCEL_TOKEN` - Vercel 令牌
   - `VERCEL_ORG_ID` - 组织 ID
   - `VERCEL_PROJECT_ID` - 项目 ID

2. 推送代码到 main 分支自动触发部署

3. 或手动触发：Actions → Deploy Frontend to Vercel → Run workflow

---

## ⚠️ 注意事项

### Railway 后端连接

当前配置的 API URL: `https://socksflow-api.up.railway.app/api/v1`

如果 Railway 部署的 URL 不同，需要更新：
1. `.env.production` 中的 `NEXT_PUBLIC_API_URL`
2. `vercel.json` 中的 rewrites destination
3. Vercel Dashboard 中的环境变量

### CORS 配置

部署后需要在 Railway 后端配置 CORS，允许 Vercel 域名访问：

```python
# Railway 后端 CORS 配置
origins = [
    "https://socksflow.vercel.app",
    "https://socksflow-frontend.vercel.app",
    # 其他 Vercel 预览域名
]
```

---

## 📊 部署后验证清单

- [ ] 访问 Vercel 域名，页面正常加载
- [ ] 用户登录功能正常
- [ ] 订阅计划展示正常
- [ ] 创建订单流程正常
- [ ] 用户中心页面正常

---

## 🔗 相关链接

- GitHub 仓库: https://github.com/zhouzhq7/socksflow
- 前端目录: `/sock-subscription/frontend`
- 预期 Vercel URL: `https://socksflow-frontend.vercel.app`
