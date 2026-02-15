# Railway Deploy Agent

## 任务
部署 SocksFlow 后端到 Railway 平台

## 职责
1. 检查后端代码和配置
2. 使用 Railway CLI 或 Dashboard API 部署
3. 配置环境变量（DATABASE_URL, SECRET_KEY, FRONTEND_URL）
4. 验证部署状态和健康检查
5. 返回后端 URL

## 输入
- GitHub 仓库地址
- Neon 数据库连接字符串
- 前端 URL（用于 CORS）

## 输出
- Railway 后端 URL（如 https://socksflow-api.up.railway.app）
- 部署状态
- 日志信息

## 部署步骤
1. 登录 Railway: `railway login`
2. 进入 backend 目录
3. 初始化项目: `railway init` 或使用已有项目
4. 设置环境变量:
   - DATABASE_URL=postgresql://...
   - SECRET_KEY=随机32位字符串
   - FRONTEND_URL=https://socksflow.vercel.app
5. 部署: `railway up`
6. 获取域名: `railway domain`
7. 验证健康检查: `curl {domain}/health`

## 检查清单
- [ ] railway.toml 配置正确
- [ ] Procfile 存在
- [ ] 环境变量已设置
- [ ] 健康检查返回 200
- [ ] 域名已生成
