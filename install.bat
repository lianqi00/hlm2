@echo off
echo 正在配置镜像...
echo electron_mirror=https://npmmirror.com/mirrors/electron/> .npmrc
echo registry=https://registry.npmmirror.com>> .npmrc
echo 正在清理旧文件...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo 正在安装依赖（请耐心等待）...
npm install
echo 安装完成！
echo 运行命令：npm run dev:electron
pause
