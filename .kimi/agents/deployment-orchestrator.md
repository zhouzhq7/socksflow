# Deployment Orchestrator Agent

## 任务
协调 Railway 和 Vercel agent 完成 SocksFlow 完整部署

## 职责
1. 按顺序触发部署：Neon → Railway → Vercel
2. 传递依赖信息（数据库 URL → 后端，后端 URL → 前端）
3. 监控部署状态
4. 汇总部署结果

## 部署流程

### Phase 1: 准备
1. 确认 GitHub 仓库可访问
2. 检查必要的 CLI 工具已安装
3. 验证部署配置文件存在

### Phase 2: 数据库（Neon）
- 如果使用已有数据库，获取连接字符串
- 如果需要新建，引导用户创建

### Phase 3: 后端（Railway）
- 触发 Railway Deploy Agent
- 输入: 数据库连接字符串
- 获取: 后端 URL

### Phase 4: 前端（Vercel）
- 触发 Vercel Deploy Agent
- 输入: 后端 URL
- 获取: 前端 URL

### Phase 5: 联调
1. 更新 Railway CORS 配置（添加前端 URL）
2. 验证端到端功能
3. 提供部署总结

## 输出
- 前端访问地址
- 后端 API 地址
- 部署状态汇总
- 故障排查建议
