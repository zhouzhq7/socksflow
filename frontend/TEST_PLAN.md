# SocksFlow 登录设置测试计划

## 测试用例清单

### 测试用例 1: 正常登录流程
| 项目 | 内容 |
|------|------|
| **测试目的** | 验证用户使用正确的邮箱和密码可以成功登录 |
| **前置条件** | 用户已注册账号 |
| **测试步骤** | 1. 访问 /auth/login<br>2. 输入正确的邮箱和密码<br>3. 点击登录按钮 |
| **期望结果** | 1. 登录成功<br>2. 跳转到 /dashboard<br>3. 显示用户信息 |
| **实际结果** | 待测试 |
| **状态** | ⬜ 未测试 |

### 测试用例 2: 错误密码登录
| 项目 | 内容 |
|------|------|
| **测试目的** | 验证用户使用错误密码登录时会显示错误提示 |
| **前置条件** | 用户已注册账号 |
| **测试步骤** | 1. 访问 /auth/login<br>2. 输入正确的邮箱和错误的密码<br>3. 点击登录按钮 |
| **期望结果** | 1. 显示错误提示（显示后端返回的具体错误信息）<br>2. 不跳转到 dashboard |
| **实际结果** | 待测试 |
| **状态** | ⬜ 未测试 |

### 测试用例 3: 注册后自动登录
| 项目 | 内容 |
|------|------|
| **测试目的** | 验证用户注册成功后会自动登录 |
| **前置条件** | 邮箱未被注册 |
| **测试步骤** | 1. 访问 /auth/register<br>2. 填写注册信息（姓名、邮箱、密码）<br>3. 勾选同意服务条款<br>4. 点击注册按钮 |
| **期望结果** | 1. 注册成功<br>2. 自动登录<br>3. 跳转到 /dashboard<br>4. 显示用户信息 |
| **实际结果** | 待测试 |
| **状态** | ⬜ 未测试 |

### 测试用例 4: 未登录访问 dashboard
| 项目 | 内容 |
|------|------|
| **测试目的** | 验证未登录用户访问 dashboard 会被重定向到登录页 |
| **前置条件** | 清除所有 cookie 和 localStorage |
| **测试步骤** | 1. 清除浏览器 cookie 和 localStorage<br>2. 直接访问 /dashboard |
| **期望结果** | 1. 被重定向到 /auth/login<br>2. URL 包含 redirect=/dashboard 参数 |
| **实际结果** | 待测试 |
| **状态** | ⬜ 未测试 |

### 测试用例 5: 已登录访问登录页
| 项目 | 内容 |
|------|------|
| **测试目的** | 验证已登录用户访问登录页会被重定向到 dashboard |
| **前置条件** | 用户已登录 |
| **测试步骤** | 1. 完成登录<br>2. 访问 /auth/login |
| **期望结果** | 1. 被重定向到 /dashboard |
| **实际结果** | 待测试 |
| **状态** | ⬜ 未测试 |

### 测试用例 6: 刷新页面保持登录
| 项目 | 内容 |
|------|------|
| **测试目的** | 验证用户刷新页面后保持登录状态 |
| **前置条件** | 用户已登录 |
| **测试步骤** | 1. 完成登录<br>2. 刷新 /dashboard 页面 |
| **期望结果** | 1. 保持登录状态<br>2. 显示用户信息<br>3. 不跳转到登录页 |
| **实际结果** | 待测试 |
| **状态** | ⬜ 未测试 |

## 代码修复记录

### 修复的问题

1. **Dashboard Layout 认证逻辑问题** ✅
   - 添加了认证失败后的重定向处理
   - 完善了 useEffect 依赖数组

2. **错误处理问题** ✅
   - 登录和注册页面现在会显示后端返回的具体错误信息
   - authStore 中添加了更详细的错误解析逻辑

3. **Cookie 设置问题** ✅
   - 添加了 Secure 标志（仅在 HTTPS 环境下）
   - 保持 SameSite=Lax 设置

4. **中间件匹配规则问题** ✅
   - 改进了认证路由匹配逻辑，支持所有子路由
   - 添加了重定向参数处理，支持登录后跳转回原页面

### 修改的文件列表

1. `frontend/app/auth/login/page.tsx` - 改进错误处理
2. `frontend/app/auth/register/page.tsx` - 改进错误处理
3. `frontend/lib/store/authStore.ts` - 改进错误处理和 cookie 设置
4. `frontend/middleware.ts` - 改进路由匹配和重定向逻辑
5. `frontend/app/dashboard/layout.tsx` - 改进认证状态验证和重定向处理

## 手动测试指南

### 环境准备
1. 确保后端服务已启动 (http://localhost:8000)
2. 启动前端开发服务器: `npm run dev`
3. 打开浏览器访问 http://localhost:3000

### 测试执行步骤

#### 测试用例 1: 正常登录
```javascript
// 在浏览器控制台执行测试
// 1. 清除认证状态
localStorage.clear();
document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

// 2. 访问登录页并输入正确凭据
// 3. 验证跳转和用户信息
```

#### 测试用例 4: 未登录访问 dashboard
```javascript
// 清除认证状态
localStorage.clear();
document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

// 访问 http://localhost:3000/dashboard
// 期望：重定向到 /auth/login?redirect=/dashboard
```

#### 测试用例 6: 刷新保持登录
```javascript
// 登录后检查状态
console.log('Token:', localStorage.getItem('access_token'));
console.log('User:', localStorage.getItem('auth-storage'));

// 刷新页面后再次检查
// 期望：状态保持不变
```

## 自动化测试（可选）

如果使用 Playwright 或 Cypress，可以创建以下测试脚本：

```typescript
// 示例：Playwright 测试
test('正常登录流程', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```
