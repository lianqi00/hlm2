# HLM证书批量生成器 v3.0 开发记录

## Goal
- 开发HLM证书批量生成器 v3.0，基于Electron + Vue，支持导入证书模板和Excel数据，拖拽调整字段位置，批量导出PNG/JPEG/PDF格式证书

## Constraints & Preferences
- 用 Vue 3 而非 React，不用 TypeScript
- 字段配置面板用右侧浮动面板，不用弹窗
- 导出设置在弹窗中（JPEG有质量滑块，PNG无质量滑块）
- 文件名规则默认用 `-` 连接符
- 软件标题：HLM证书批量生成器 v3.0
- 版权信息：制作者：连旗
- 菜单要中文（文件、编辑、视图、帮助）
- 预览默认适应大小，支持全屏

## Progress
### Done
- 初始化 Electron + Vue + Vite 项目
- 实现证书模板导入功能
- 实现 Excel 数据导入和解析
- 实现拖拽式字段位置编辑器，支持方向键微调和Alt吸附对齐
- 实现批量导出PNG/JPEG/PDF功能，支持进度条和取消
- 实现右侧浮动字段配置面板（字体、字号、颜色、加粗）
- 实现文件名规则可视化编辑（字段+自定义文本+连接符选择）
- 实现预览功能（含全屏）
- 实现中文菜单栏（文件/编辑/视图/帮助）
- 实现使用说明帮助文档
- 配置软件图标（icon.ico，electron/main.js中设置）
- 修复导出PDF文件名按规则生成
- 修复导出图片带有字段标签蓝字的问题
- 修复导出图片数据内容缺失的问题
- 修复 `exportAsPDF()` 缺少 `async` 关键字的编译错误
- 优化左侧布局：标题固定，导入部分固定，仅字段列表可滚动，底部导出区域有边距
- JPEG有质量滑块（jpegQuality变量，默认90%），PNG无质量滑块（无损格式）
- 预估大小显示优化：字体12px，颜色#999
- 修复导出质量参数：canvasToBlob现在对JPEG使用jpegQuality/100，PNG使用image/png
- 预估大小计算修正：使用 `实际显示尺寸 = 模板尺寸 × zoomLevel`，再乘以2（html2canvas的scale）
- 修复导出分辨率问题：captureCanvas现在临时将canvas设为原始模板尺寸再捕获，确保导出分辨率=模板分辨率×2
- 预估大小计算修正（第二轮）：现在使用原始模板尺寸计算预估，不受缩放影响
- 修复导出闪烁问题：captureCanvas改为通过html2canvas的width/height参数直接指定原始模板尺寸，不改变zoomLevel

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- 选用 Electron + Vue 3 + Vite：跨平台支持，Vue更熟悉
- 用 html2canvas 生成图片，pdf-lib 生成PDF
- 字段默认隐藏，开启后显示在画布中心，字号根据图片大小自动计算
- 导出默认格式为JPEG
- 菜单事件通过 ipcRenderer.on 监听，preload.js 暴露接口
- JPEG预估大小 = 像素数 × 0.15 × (quality/100) / 1024
- PNG预估大小 = 像素数 × 4 / 1024（无损，不受质量影响）
- 实际显示尺寸用于预估大小 = templateWidth × zoomLevel × 2

## Next Steps
- 测试质量滑块对JPEG预估大小的影响
- 打包测试（npm run dist）
- 验证Windows下软件图标是否正确显示

## Critical Context
- Electron 安装需用国内镜像：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`
- 导出时隐藏字段标签（.field-label）和辅助线，避免出现在最终图片
- 缩放控制：适应模式隐藏滚动条，放大后才显示
- 软件图标路径：项目根目录 `icon.ico`，已配置在 package.json build 和 electron/main.js 中
- replace文件夹包含所有修改后的文件，供用户拷贝到Windows替换

## Relevant Files
- `/home/lianq/hlm2/src/App.vue`：主组件，包含所有功能逻辑和模板
- `/home/lianq/hlm2/electron/main.js`：主进程，窗口创建（含icon配置）、中文菜单、IPC处理
- `/home/lianq/hlm2/electron/preload.js`：预加载脚本，暴露electronAPI给渲染进程
- `/home/lianq/hlm2/package.json`：项目配置，含electron-builder打包配置和图标设置
- `/home/lianq/hlm2/icon.ico`：软件图标文件（265KB）
- `/home/lianq/hlm2/replace/`：用于用户的替换文件目录（含src/App.vue、electron/main.js、package.json、icon.ico）
