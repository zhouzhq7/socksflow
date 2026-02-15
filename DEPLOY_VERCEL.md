# SocksFlow Vercel 部署指南

## 快速部署

### 1. 准备工作

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login
```

### 2. 部署前端

```bash
cd frontend

# 首次部署（交互式）
vercel --prod

# 或链接到已有项目
vercel link
vercel --prod
```

### 3. 配置环境变量

在 Vercel Dashboard 中设置：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `https://socksflow-api.up.railway.app/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | `SocksFlow` |
| `NEXT_PUBLIC_APP_URL` | 前端域名 | `https://socksflow.vercel.app` |

**设置方式：**

方式一：Dashboard
1. 访问 https://vercel.com/dashboard
2. 选择项目 → Settings → Environment Variables
3. 添加上述变量

方式二：CLI
```bash
vercel env add NEXT_PUBLIC_API_URL
```

### 4. 绑定自定义域名（可选）

1. 购买域名（推荐 Namecheap / Cloudflare）
2. Vercel 项目 → Settings → Domains
3. 添加域名并按提示配置 DNS

## 配置文件说明

### vercel.json
- 部署区域（新加坡、香港、首尔、旧金山等）
- API 重写规则
- 响应头配置（安全头、缓存）
- GitHub 自动部署

### next.config.ts
- `output: 'standalone'` - 优化构建输出
- `rewrites` - API 代理配置
- `headers` - 安全响应头

## 自动部署

每次推送到 GitHub 的 main 分支，Vercel 会自动部署。

### GitHub Actions 工作流（可选）

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

## 费用说明

| 方案 | 月费用 | 包含 |
|------|--------|------|
| **免费版** | $0 | 100GB 带宽，1,000,000 构建分钟 |
| **Pro** | $20 | 1TB 带宽，无限构建，分析功能 |

免费版足够初创项目使用。

## 常见问题

### 1. API 请求 404
检查 `NEXT_PUBLIC_API_URL` 是否正确配置。

### 2. 环境变量不生效
修改环境变量后需要重新部署。

### 3. 构建失败
- 检查 Node.js 版本（package.json 中的 engines）
- 检查依赖是否安装完整

## 生产检查清单

- [ ] 环境变量已配置
- [ ] 后端 API 可访问
- [ ] CORS 配置正确
- [ ] 自定义域名已绑定（可选）
- [ ] Analytics 已启用（可选）
