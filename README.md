# HLM证书批量生成器

基于 Electron + Vue 3 的桌面端证书批量生成工具。导入证书模板和 Excel 数据，拖拽放置字段，批量导出 PNG/JPEG/PDF。

## 功能

- 导入证书模板图片（PNG/JPG/BMP）
- 导入 Excel 数据（.xlsx/.xls/.csv）
- 拖拽式字段位置编辑，方向键微调，Alt 吸附对齐
- 右侧浮动字段配置面板（字体、字号、颜色、加粗）
- 批量导出 PNG/JPEG/PDF，支持进度条和取消
- 文件名规则可视化编辑
- 预览缩放、全屏

## 使用

```bash
npm install
npm run dev:electron
```

## 打包

```bash
npm run dist
```

Windows 打包需要安装 [Wine](https://www.winehq.org/)（Linux 下打包 Windows 版本时）。

## 技术栈

- Electron 41
- Vue 3
- Vite 8
- html2canvas、pdf-lib、xlsx
