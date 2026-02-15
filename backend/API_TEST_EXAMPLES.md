# SocksFlow API 测试示例

## 基础配置

```bash
# 设置API基础URL
BASE_URL="http://localhost:8000/api/v1"

# 登录获取JWT令牌（需要先注册）
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' | jq -r '.access_token')

# 设置授权头
AUTH_HEADER="Authorization: Bearer $TOKEN"
```

## 1. 认证相关

### 用户注册
```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "name": "测试用户"
  }'
```

### 用户登录
```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

### 获取当前用户信息
```bash
curl -X GET "$BASE_URL/auth/me" \
  -H "$AUTH_HEADER"
```

---

## 2. 订阅相关

### 获取订阅计划列表
```bash
curl -X GET "$BASE_URL/subscriptions/plans"
```

### 创建订阅（同时创建订单和支付）
```bash
curl -X POST "$BASE_URL/subscriptions" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "plan_code": "standard",
    "delivery_frequency": 1,
    "shipping_address": {
      "name": "张三",
      "phone": "13800138000",
      "province": "北京市",
      "city": "北京市",
      "district": "朝阳区",
      "address": "建国路88号SOHO现代城"
    },
    "style_preferences": {
      "colors": ["黑色", "灰色", "蓝色"],
      "styles": ["商务", "休闲"],
      "materials": ["棉质", "竹纤维"]
    }
  }'
```

**响应示例：**
```json
{
  "subscription": {
    "id": 1,
    "user_id": 1,
    "plan_code": "standard",
    "status": "active",
    "price_monthly": "49.90",
    "delivery_frequency": 1
  },
  "order": {
    "id": 1,
    "order_number": "SO202402150001",
    "status": "pending",
    "total_amount": "49.90"
  },
  "payment_params": {
    "pay_url": "https://openapi.alipaydev.com/gateway.do?...",
    "payment_id": 1,
    "payment_no": "PAY2024021512345678"
  }
}
```

### 获取当前用户的订阅列表
```bash
curl -X GET "$BASE_URL/subscriptions" \
  -H "$AUTH_HEADER"
```

### 获取活跃订阅
```bash
curl -X GET "$BASE_URL/subscriptions/active" \
  -H "$AUTH_HEADER"
```

### 获取订阅详情
```bash
curl -X GET "$BASE_URL/subscriptions/1" \
  -H "$AUTH_HEADER"
```

### 更新订阅偏好
```bash
curl -X PUT "$BASE_URL/subscriptions/1" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "delivery_frequency": 2,
    "style_preferences": {
      "colors": ["白色", "黑色"],
      "styles": ["运动"]
    }
  }'
```

### 暂停订阅
```bash
curl -X POST "$BASE_URL/subscriptions/1/pause" \
  -H "$AUTH_HEADER"
```

### 恢复订阅
```bash
curl -X POST "$BASE_URL/subscriptions/1/resume" \
  -H "$AUTH_HEADER"
```

### 取消订阅
```bash
curl -X POST "$BASE_URL/subscriptions/1/cancel" \
  -H "$AUTH_HEADER"
```

---

## 3. 订单相关

### 创建订单（独立订单，非订阅订单）
```bash
curl -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "items": [
      {
        "name": "商务棉袜套装",
        "quantity": 2,
        "unit_price": "29.90",
        "subtotal": "59.80"
      }
    ],
    "shipping_address": {
      "name": "张三",
      "phone": "13800138000",
      "province": "北京市",
      "city": "北京市",
      "district": "朝阳区",
      "address": "建国路88号"
    },
    "total_amount": "59.80"
  }'
```

### 获取订单列表（分页）
```bash
# 第一页，每页10条
curl -X GET "$BASE_URL/orders?skip=0&limit=10" \
  -H "$AUTH_HEADER"

# 第二页
curl -X GET "$BASE_URL/orders?skip=10&limit=10" \
  -H "$AUTH_HEADER"
```

### 获取订单详情
```bash
curl -X GET "$BASE_URL/orders/1" \
  -H "$AUTH_HEADER"
```

### 通过订单号查询
```bash
curl -X GET "$BASE_URL/orders/number/SO202402150001" \
  -H "$AUTH_HEADER"
```

### 取消订单
```bash
curl -X POST "$BASE_URL/orders/1/cancel" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "reason": "暂时不需要了"
  }'
```

---

## 4. 支付相关

### 创建支付宝支付（为已有订单）
```bash
curl -X POST "$BASE_URL/payments/1/alipay" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "return_url": "http://localhost:3000/payment/success"
  }'
```

**响应示例：**
```json
{
  "payment_id": 1,
  "payment_no": "PAY2024021512345678",
  "pay_url": "https://openapi.alipaydev.com/gateway.do?biz_content=..."
}
```

### 查询支付状态
```bash
curl -X GET "$BASE_URL/payments/1/status" \
  -H "$AUTH_HEADER"
```

### 主动查询支付宝订单状态
```bash
curl -X POST "$BASE_URL/payments/1/query" \
  -H "$AUTH_HEADER"
```

### 支付成功页面（同步回调）
```bash
curl -X GET "$BASE_URL/payments/return/success?out_trade_no=PAY2024021512345678"
```

### 支付回调（异步通知）
```bash
# 模拟支付宝异步回调
curl -X POST "$BASE_URL/payments/callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "out_trade_no=PAY2024021512345678" \
  -d "trade_no=2024021522001156781234567890" \
  -d "trade_status=TRADE_SUCCESS" \
  -d "total_amount=49.90"
```

---

## 5. 完整流程测试

### 场景1：新用户订阅并支付

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api/v1"

# 1. 注册
echo "=== 1. 注册用户 ==="
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"123456","name":"测试用户"}' | jq

# 2. 登录
echo "=== 2. 登录获取Token ==="
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"123456"}' | jq -r '.access_token')
echo "Token: $TOKEN"

# 3. 查看订阅计划
echo "=== 3. 查看订阅计划 ==="
curl -s -X GET "$BASE_URL/subscriptions/plans" | jq

# 4. 创建订阅
echo "=== 4. 创建订阅 ==="
SUBSCRIPTION_RESULT=$(curl -s -X POST "$BASE_URL/subscriptions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plan_code": "standard",
    "delivery_frequency": 1,
    "shipping_address": {
      "name": "张三",
      "phone": "13800138000",
      "province": "北京市",
      "city": "北京市",
      "district": "朝阳区",
      "address": "建国路88号"
    }
  }')
echo "$SUBSCRIPTION_RESULT" | jq

# 提取支付URL
PAY_URL=$(echo "$SUBSCRIPTION_RESULT" | jq -r '.payment_params.pay_url')
echo "=== 支付宝支付URL ==="
echo "$PAY_URL"

# 5. 查询订单
echo "=== 5. 查询订单列表 ==="
curl -s -X GET "$BASE_URL/orders" \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. 查询支付状态
echo "=== 6. 查询支付状态 ==="
PAYMENT_ID=$(echo "$SUBSCRIPTION_RESULT" | jq -r '.payment_params.payment_id')
curl -s -X GET "$BASE_URL/payments/$PAYMENT_ID/status" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 6. 支付宝沙箱测试

### 沙箱环境配置
在 `.env` 文件中配置：
```bash
ALIPAY_APP_ID=你的沙箱APP_ID
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```

### 沙箱账号
- 买家账号：在支付宝开放平台沙箱环境查看
- 登录密码：沙箱环境提供
- 支付密码：沙箱环境提供

### 测试步骤
1. 调用创建订阅/支付接口获取 `pay_url`
2. 在浏览器中打开 `pay_url`
3. 使用沙箱买家账号登录
4. 使用沙箱支付密码完成支付
5. 检查订单状态是否更新为 `paid`

---

## 7. 错误处理示例

### 无效的计划代码
```bash
curl -X POST "$BASE_URL/subscriptions" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"plan_code":"invalid","shipping_address":{}}'
# 返回: {"detail":"无效的计划代码: invalid"}
```

### 重复创建订阅
```bash
# 当用户已有活跃订阅时再次创建
curl -X POST "$BASE_URL/subscriptions" ...
# 返回: {"detail":"用户已有活跃订阅，请先取消现有订阅"}
```

### 无权访问
```bash
# 尝试访问其他用户的订阅
curl -X GET "$BASE_URL/subscriptions/999" -H "$AUTH_HEADER"
# 返回: {"detail":"无权访问此订阅"} 或 {"detail":"订阅不存在"}
```

### 订单已支付
```bash
# 对已支付订单再次创建支付
curl -X POST "$BASE_URL/payments/1/alipay" -H "$AUTH_HEADER"
# 返回: {"detail":"订单已支付或已取消"}
```

---

## 8. 开发调试

### 查看API文档
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

### 健康检查
```bash
curl http://localhost:8000/health
```
