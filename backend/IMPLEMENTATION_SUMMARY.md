# SockFlow 订阅和订单API实现总结

## 概述

本实现为SockFlow袜子订阅服务后端添加了完整的订阅管理、订单管理和支付宝支付功能。

## 已创建/修改的文件

### 1. 数据模型 (app/models/)

| 文件 | 说明 |
|------|------|
| `order.py` | 订单模型，包含订单号、状态、金额、商品、配送地址等 |
| `payment.py` | 支付模型，支持支付宝/微信支付 |
| `subscription.py` (修改) | 添加orders关系 |
| `user.py` (修改) | 添加orders和payments关系 |
| `__init__.py` (修改) | 导出新模型 |

### 2. Schema定义 (app/schemas/)

| 文件 | 说明 |
|------|------|
| `subscription.py` | 订阅创建/更新/响应Schema，计划配置 |
| `order.py` | 订单创建/更新/响应Schema |
| `payment.py` | 支付创建/回调/响应Schema |
| `__init__.py` (修改) | 导出所有Schema |

### 3. 服务层 (app/services/)

| 文件 | 说明 |
|------|------|
| `subscription_service.py` | 订阅CRUD、暂停/恢复/取消、价格计算 |
| `order_service.py` | 订单CRUD、订单号生成、状态流转 |
| `payment_service.py` | 支付创建、支付宝集成、回调处理、退款 |
| `__init__.py` (修改) | 导出所有服务 |

### 4. API路由 (app/api/v1/)

| 文件 | 路由 | 说明 |
|------|------|------|
| `subscriptions.py` | `GET /subscriptions/plans` | 获取订阅计划列表 |
| | `POST /subscriptions` | 创建订阅（含订单和支付） |
| | `GET /subscriptions` | 获取用户订阅列表 |
| | `GET /subscriptions/active` | 获取活跃订阅 |
| | `GET /subscriptions/{id}` | 获取订阅详情 |
| | `PUT /subscriptions/{id}` | 更新订阅偏好 |
| | `POST /subscriptions/{id}/pause` | 暂停订阅 |
| | `POST /subscriptions/{id}/resume` | 恢复订阅 |
| | `POST /subscriptions/{id}/cancel` | 取消订阅 |
| `orders.py` | `POST /orders` | 创建订单 |
| | `GET /orders` | 获取订单列表（分页） |
| | `GET /orders/{id}` | 获取订单详情 |
| | `GET /orders/number/{order_number}` | 通过订单号查询 |
| | `POST /orders/{id}/cancel` | 取消订单 |
| `payments.py` | `POST /payments/{order_id}/alipay` | 创建支付宝支付 |
| | `POST /payments/callback` | 支付回调（异步） |
| | `GET /payments/callback` | 支付回调（同步） |
| | `GET /payments/{id}/status` | 查询支付状态 |
| | `POST /payments/{id}/query` | 主动查询支付宝状态 |
| | `GET /payments/return/success` | 支付成功页面 |

### 5. 其他修改

| 文件 | 修改内容 |
|------|---------|
| `app/api/__init__.py` | 注册新路由 |
| `app/main.py` | 导入Order和Payment模型 |
| `requirements.txt` | 添加 `python-alipay-sdk` 依赖 |

## API功能说明

### 订阅功能

1. **计划管理**：基础版(¥29.9/月)、标准版(¥49.9/月)、高级版(¥79.9/月)
2. **创建订阅**：选择计划 → 填写地址 → 自动生成订单 → 创建支付
3. **订阅状态**：active(活跃) → paused(暂停) → cancelled(取消)
4. **偏好设置**：配送频率、颜色偏好、风格偏好

### 订单功能

1. **订单号生成**：格式 `SO202402150001` (SO+日期+4位随机数)
2. **状态流转**：pending → paid → shipped → delivered → cancelled
3. **独立订单**：支持非订阅的一次性购买

### 支付功能

1. **支付宝沙箱**：使用 python-alipay-sdk 集成
2. **支付流程**：
   - 创建支付 → 返回支付宝URL → 用户支付 → 回调通知 → 更新订单
3. **安全措施**：签名验证、状态检查、幂等处理

## 快速开始

### 1. 安装依赖

```bash
pip install python-alipay-sdk
```

### 2. 配置支付宝

在 `.env` 文件中添加：

```bash
ALIPAY_APP_ID=你的沙箱APP_ID
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```

### 3. 启动服务

```bash
uvicorn app.main:app --reload
```

### 4. 测试API

```bash
# 注册并登录获取Token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -d '{"email":"test@test.com","password":"123456"}' | jq -r '.access_token')

# 创建订阅
curl -X POST http://localhost:8000/api/v1/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_code": "standard",
    "shipping_address": {"name":"张三","phone":"13800138000","province":"北京市","city":"北京市","district":"朝阳区","address":"建国路88号"}
  }'
```

完整测试示例参见 `API_TEST_EXAMPLES.md`

## 数据模型关系

```
User (1) --- (*) Subscription
User (1) --- (*) Order
User (1) --- (*) Payment
Subscription (1) --- (*) Order
Order (1) --- (*) Payment
```

## 安全特性

1. **JWT认证**：所有API需要Bearer Token
2. **权限检查**：用户只能访问自己的数据
3. **状态验证**：防止非法状态流转
4. **签名验证**：支付宝回调验证签名

## 测试

运行现有测试：
```bash
pytest tests/ -v
```

## 后续扩展建议

1. 添加微信支付集成
2. 实现配送追踪Webhook
3. 添加订阅自动续费功能
4. 实现优惠券系统
5. 添加订单发票管理
