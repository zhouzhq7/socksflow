# 🧦 SocksFlow - 智能袜子订阅服务

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python)](https://python.org)

> 让每个人都能轻松拥有舒适、时尚、合脚的袜子，告别袜子失踪的烦恼

## 🚀 快速开始

### 环境要求

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### 使用 Docker 快速启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd sock-subscription

# 复制环境变量
cp backend/.env.example backend/.env

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

服务启动后访问：
- 🌐 前端: http://localhost:3000
- 🔌 API: http://localhost:8000
- 📚 API 文档: http://localhost:8000/api/docs

### 本地开发

#### 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 复制环境变量
cp .env.example .env
# 编辑 .env 配置数据库等信息

# 启动开发服务器
uvicorn app.main:app --reload
```

#### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📁 项目结构

```
sock-subscription/
├── 📁 backend/              # Python FastAPI 后端
│   ├── 📁 app/
│   │   ├── 📁 api/          # API 路由
│   │   │   ├── 📁 v1/       # v1 版本路由
│   │   │   ├── __init__.py
│   │   │   └── deps.py      # 依赖注入
│   │   ├── 📁 core/         # 核心配置
│   │   │   ├── config.py    # 配置管理
│   │   │   ├── database.py  # 数据库连接
│   │   │   └── security.py  # 安全工具
│   │   ├── 📁 models/       # SQLAlchemy 模型
│   │   ├── 📁 schemas/      # Pydantic Schema
│   │   ├── 📁 services/     # 业务逻辑层
│   │   ├── __init__.py
│   │   └── main.py          # 应用入口
│   ├── 📁 alembic/          # 数据库迁移
│   ├── 📁 celery_tasks/     # 异步任务
│   ├── 📁 tests/            # 测试用例
│   ├── .env.example         # 环境变量示例
│   ├── Dockerfile           # Docker 配置
│   ├── pytest.ini           # 测试配置
│   └── requirements.txt     # Python 依赖
│
├── 📁 frontend/             # Next.js 前端
│   ├── 📁 app/              # Next.js App Router
│   ├── 📁 components/       # React 组件
│   ├── 📁 lib/              # 工具函数
│   ├── 📁 public/           # 静态资源
│   ├── Dockerfile
│   ├── next.config.ts
│   ├── package.json
│   └── tailwind.config.ts
│
├── 📁 docker/               # Docker 配置
├── 📁 docs/                 # 文档
├── docker-compose.yml       # Docker Compose 配置
└── README.md                # 项目说明
```

## 🛠 技术栈

### 后端 (Python)
| 技术 | 用途 |
|------|------|
| **FastAPI** | Web 框架 |
| **SQLAlchemy 2.0** | ORM |
| **Pydantic v2** | 数据验证 |
| **Alembic** | 数据库迁移 |
| **Celery** | 异步任务队列 |
| **PostgreSQL** | 主数据库 |
| **Redis** | 缓存 & 消息队列 |

### 前端 (TypeScript)
| 技术 | 用途 |
|------|------|
| **Next.js 15** | React 框架 |
| **React 19** | UI 库 |
| **Tailwind CSS** | 样式 |
| **Shadcn/ui** | UI 组件 |
| **TanStack Query** | 服务端状态管理 |
| **Zustand** | 客户端状态管理 |

## 🧪 测试

### 后端测试

```bash
cd backend

# 运行所有测试
pytest

# 运行单元测试
pytest -m unit -v

# 生成覆盖率报告
pytest --cov=app --cov-report=html

# 查看覆盖率报告
open htmlcov/index.html
```

### 代码质量

```bash
cd backend

# 代码格式化
black app tests
isort app tests

# 类型检查
mypy app

# 代码检查
flake8 app tests
```

## 📚 API 文档

启动后端服务后，可通过以下地址查看：

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

### 认证方式

API 使用 Bearer Token 认证：

```http
Authorization: Bearer <your-access-token>
```

## 🚀 部署

### 生产环境部署

1. **更新环境变量**
   ```bash
   # backend/.env
   DEBUG=false
   SECRET_KEY=your-strong-secret-key
   DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
   ```

2. **构建 Docker 镜像**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **数据库迁移**
   ```bash
   cd backend
   alembic upgrade head
   ```

## 📈 功能特性

- [x] 用户注册/登录/认证
- [x] JWT 令牌管理（Access Token + Refresh Token）
- [x] 用户资料管理
- [ ] 订阅方案管理
- [ ] 尺码档案管理
- [ ] 支付集成（支付宝/微信）
- [ ] 订单管理
- [ ] 物流追踪
- [ ] 管理后台
- [ ] 推荐算法

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

[MIT](LICENSE) © SocksFlow Team

---

<div align="center">
  <sub>Made with ❤️ by SocksFlow Team</sub>
</div>
