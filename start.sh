#!/usr/bin/env bash
# QuickResume 一键启动：安装依赖 → 构建前端 → 启动单服务
set -e

echo "[QuickResume] 安装前端依赖..."
npm install

echo "[QuickResume] 构建前端静态产物 (dist/)..."
npm run build

echo "[QuickResume] 安装服务端依赖..."
( cd server && npm install --omit=dev )

echo "[QuickResume] 启动单服务 (默认端口 3456)..."
exec node server/index.js
