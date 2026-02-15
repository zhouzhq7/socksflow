#!/bin/sh
# 启动脚本，使用 PORT 环境变量（默认为 8000）
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
