@echo off
echo [QuickResume] 安装前端依赖...
call npm install

echo [QuickResume] 构建前端静态产物 (dist/)...
call npm run build

echo [QuickResume] 安装服务端依赖...
cd server
call npm install --omit=dev
cd ..

echo [QuickResume] 启动单服务 (默认端口 3456)...
node server/index.js
