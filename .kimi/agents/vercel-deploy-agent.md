# Vercel Deploy Agent

## 任务
部署 SocksFlow 前端到 Vercel 平台

## 职责
1. 检查前端代码和配置
2. 使用 Vercel CLI 部署
3. 配置环境变量（NEXT_PUBLIC_API_URL）
4. 验证部署状态
5. 返回前端 URL

## 输入
- GitHub 仓库地址
- Railway 后端 URL

## 输出
- Vercel 前端 URL（如 https://socksflow.vercel.app）
- 部署状态
- 预览链接

## 部署步骤
1. 登录 Vercel: `vercel login`
2. 进入 frontend 目录
3. 链接项目: `vercel link` 或创建新项目
4. 设置环境变量: `vercel env add NEXT_PUBLIC_API_URL`
   - 值: {railway_backend_url}/api/v1
5. 部署生产环境: `vercel --prod`
6. 验证前端可访问
7. 测试 API 连接

## 检查清单
- [ ] vercel.json 配置正确
- [ ] next.config.ts 配置正确
- [ ] NEXT_PUBLIC_API_URL 已设置
- [ ] 前端页面正常加载
- [ ] API 请求正常
