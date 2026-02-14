# 登录流程测试用例

## 测试用例 1: 登录成功后显示 Dashboard

### 前置条件
- 用户已注册账号: test@example.com / password123
- 后端服务正常运行
- 前端服务正常运行

### 测试步骤
1. 访问 http://localhost:3000/auth/login
2. 输入邮箱: test@example.com
3. 输入密码: password123
4. 点击"登录"按钮

### 期望结果
1. 按钮变为"登录中..." + 加载动画
2. 显示绿色成功提示"登录成功！正在跳转..."
3. 按钮变为"跳转中..."
4. 800ms 后跳转到 http://localhost:3000/dashboard
5. Dashboard 页面显示:
   - 侧边栏导航（概览、订阅管理、订单历史等）
   - 欢迎语"欢迎回来，XXX"
   - 当前订阅状态卡片
   - 最近订单列表

### 实际结果
- [ ] 待测试

---

## 测试用例 2: 登录后返回首页显示用户名

### 前置条件
- 已完成测试用例 1（已登录状态）

### 测试步骤
1. 在 Dashboard 页面点击 SockFlow Logo
2. 观察导航栏变化

### 期望结果
1. 跳转到首页 http://localhost:3000
2. 导航栏右侧显示:
   - 用户头像（圆形，琥珀色背景）
   - 用户名（如"张三"）
   - 下拉箭头
3. **不显示** "登录" 和 "注册" 按钮
4. 点击头像下拉显示:
   - 用户中心
   - 设置
   - 退出登录

### 实际结果
- [ ] 待测试

---

## 测试用例 3: 未登录状态访问首页

### 前置条件
- 清除浏览器 cookie 和 localStorage
- 或打开无痕模式

### 测试步骤
1. 访问 http://localhost:3000

### 期望结果
1. 导航栏右侧显示:
   - "登录" 文字链接
   - "注册" 按钮（琥珀色）
2. **不显示** 用户头像和用户名

### 实际结果
- [ ] 待测试

---

## 测试用例 4: 已登录用户访问登录页

### 前置条件
- 已完成测试用例 1（已登录状态）

### 测试步骤
1. 在浏览器地址栏输入 http://localhost:3000/auth/login
2. 按回车访问

### 期望结果
1. **不显示** 登录表单
2. 立即自动跳转到 http://localhost:3000/dashboard

### 实际结果
- [ ] 待测试

---

## 自动化测试脚本

```bash
#!/bin/bash

# 测试 1: 登录 API
echo "=== 测试 1: 登录 API ==="
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | head -c 200
echo ""

# 测试 2: 获取当前用户
echo "=== 测试 2: 获取当前用户（需要 token）==="
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${TOKEN:0:50}..."
curl -s http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
echo ""

# 测试 3: 前端首页可访问
echo "=== 测试 3: 前端首页状态 ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
echo ""

# 测试 4: 前端 Dashboard 可访问
echo "=== 测试 4: Dashboard 状态（会重定向到登录页）==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard
echo ""
```

---

## 浏览器手动测试步骤

### 测试登录流程
1. 打开浏览器访问 http://localhost:3000
2. 点击导航栏"登录"
3. 输入测试账号
4. 观察登录过程动画
5. 确认跳转到 Dashboard

### 测试返回首页显示用户名
1. 登录成功后，点击页面左侧 Logo
2. 观察导航栏是否显示用户名和头像
3. 确认没有"登录"和"注册"按钮

### 测试刷新保持登录
1. 登录成功后，刷新页面
2. 确认仍然显示登录状态（用户名）
3. 没有跳转到登录页

### 测试退出登录
1. 点击用户名头像
2. 点击"退出登录"
3. 确认跳转到首页
4. 确认显示"登录"和"注册"按钮
