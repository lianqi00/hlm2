<template>
  <div class="app-container">
    <!-- 左侧面板 -->
    <div class="sidebar">
      <div class="app-title">HLM证书批量生成器 v3.0</div>

      <div class="sidebar-content">
        <div class="section">
          <div class="section-title">导入证书模板</div>
          <button class="btn btn-primary btn-block" @click="loadTemplate">
            <span v-if="!templateLoaded">选择模板图片</span>
            <span v-else class="btn-status">✓ 模板已加载</span>
          </button>
        </div>

        <div class="section">
          <div class="section-title">导入 Excel 数据</div>
          <button class="btn btn-primary btn-block" @click="loadExcel">
            <span v-if="excelData.length === 0">选择 Excel 文件</span>
            <span v-else class="btn-status">✓ 已加载 {{ excelData.length }} 条数据</span>
          </button>
        </div>

        <div class="section">
          <div class="section-title">字段列表</div>
          <div class="field-list" v-if="columns.length > 0">
            <div 
              v-for="col in columns" 
              :key="col" 
              class="field-item-simple"
              :class="{ active: activeField === col }"
              @click="selectField(col)"
            >
              <span class="field-dot" :class="{ visible: fieldConfigs[col]?.visible }"></span>
              <span>{{ col }}</span>
              <label class="field-toggle" @click.stop>
                <input type="checkbox" v-model="fieldConfigs[col].visible" @change="onFieldToggle(col, $event)">
              </label>
            </div>
          </div>
          <div v-else class="empty-hint">请先导入 Excel 数据</div>
        </div>
      </div>

      <div class="sidebar-bottom">
        <div class="section">
          <div class="section-title">导出</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button 
              class="btn btn-primary btn-block" 
              @click="previewCurrent"
              :disabled="!canExport"
            >预览</button>
            <button 
              class="btn btn-success btn-block" 
              @click="showExportModal"
              :disabled="!canExport"
            >批量导出</button>
          </div>
        </div>
        <div class="copyright">制作者：连旗</div>
      </div>
    </div>

    <!-- 主区域 -->
    <div class="main-area">
      <div class="toolbar">
        <span style="font-weight: bold;">证书预览</span>
        <span v-if="excelData.length > 0" style="color: #666; margin-left: 10px;">
          第 {{ currentPreviewIdx + 1 }} / {{ excelData.length }} 条
        </span>
        <div style="flex: 1;"></div>
        <div class="zoom-control">
          <button class="btn btn-sm" @click="zoomOut">-</button>
          <span class="zoom-value">{{ Math.round(zoomLevel * 100) }}%</span>
          <button class="btn btn-sm" @click="zoomIn">+</button>
          <button class="btn btn-sm" @click="zoomFit">适应</button>
        </div>
        <button class="btn btn-sm" @click="prevRecord" :disabled="currentPreviewIdx <= 0">◀</button>
        <button class="btn btn-sm" @click="nextRecord" :disabled="currentPreviewIdx >= excelData.length - 1">▶</button>
      </div>

      <div class="canvas-container" :class="{ 'no-scroll': isFitMode }" @keydown="handleKeydown" tabindex="0" ref="canvasContainer">
        <div v-if="!templateLoaded" style="text-align: center; color: #999; margin-top: 100px;">
          <div style="font-size: 48px;">📄</div>
          <div style="margin-top: 16px;">请先导入证书模板图片</div>
        </div>
        <div v-else style="position: relative;">
          <div class="preview-canvas" :style="canvasStyle" ref="canvasRef">
            <img :src="templateSrc" style="display: block; width: 100%; height: 100%;" />
            <div class="guide-line guide-h" v-if="guideLineY !== null" :style="{ top: guideLineY * finalScale + 'px' }"></div>
            <div class="guide-line guide-v" v-if="guideLineX !== null" :style="{ left: guideLineX * finalScale + 'px' }"></div>
            <div
              v-for="col in visibleColumns"
              :key="col"
              class="field-overlay"
              :class="{ active: activeField === col }"
              :style="getFieldStyle(col)"
              @mousedown.stop="startDrag($event, col)"
              @click.stop="selectField(col)"
            >
              <span class="field-label">{{ col }}</span>
              <span class="field-text">{{ getFieldValue(col) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 字段配置面板 -->
    <div class="field-config-panel" v-if="showFieldPanel && activeField">
      <div class="panel-header">
        <span>{{ activeField }}</span>
        <button class="btn-close" @click="showFieldPanel = false">×</button>
      </div>
      
      <div class="panel-body">
        <div class="form-group">
          <label>显示</label>
          <input type="checkbox" v-model="fieldConfigs[activeField].visible" @change="onFieldToggle(activeField, $event)" style="width: auto;">
        </div>

        <div class="form-group">
          <label>字体</label>
          <select v-model="fieldConfigs[activeField].fontFamily">
            <option value="SimSun">宋体</option>
            <option value="SimHei">黑体</option>
            <option value="KaiTi">楷体</option>
            <option value="FangSong">仿宋</option>
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="STZhongsong">华文中宋</option>
            <option value="STXinwei">华文新魏</option>
            <option value="STLiti">华文隶书</option>
            <option value="STHupo">华文琥珀</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
        </div>

        <div class="form-group">
          <label>字号</label>
          <input v-model.number="fieldConfigs[activeField].fontSize" type="number" min="12" max="500">
        </div>

        <div class="form-group">
          <label>颜色</label>
          <input v-model="fieldConfigs[activeField].color" type="color">
        </div>

        <div class="form-group">
          <label>加粗</label>
          <select v-model="fieldConfigs[activeField].fontWeight">
            <option value="normal">正常</option>
            <option value="bold">加粗</option>
          </select>
        </div>
      </div>

      <div class="panel-hint">
        <div class="hint-item">
          <span class="hint-icon">⌨️</span>
          <span>方向键微调位置</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">⚡</span>
          <span>Shift + 方向键 快速移动</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">🧲</span>
          <span>Alt + 拖拽 吸附对齐</span>
        </div>
      </div>
    </div>

    <!-- 预览窗口 -->
    <div class="modal-overlay" v-if="showPreview" @click.self="showPreview = false">
      <div class="preview-wrapper" :class="{ fullscreen: isPreviewFullscreen }">
        <div class="preview-header">
          <span>预览</span>
          <div class="preview-actions">
            <button class="btn btn-sm" @click="isPreviewFullscreen = !isPreviewFullscreen">
              {{ isPreviewFullscreen ? '退出全屏' : '⛶ 全屏' }}
            </button>
            <button class="btn btn-sm" @click="showPreview = false">✕ 关闭</button>
          </div>
        </div>
        <div class="preview-body">
          <img v-if="previewImageUrl" :src="previewImageUrl" class="preview-image" />
        </div>
      </div>
    </div>

    <!-- 导出弹窗 -->
    <div class="modal-overlay" v-if="showExportDialog">
      <div class="modal">
        <div class="modal-title">批量导出</div>
        
        <div class="form-group">
          <label>导出格式</label>
          <select v-model="exportFormat" style="width: 100%;">
            <option value="jpg">JPEG</option>
            <option value="png">PNG</option>
            <option value="pdf">PDF</option>
          </select>
          <div v-if="exportFormat === 'jpg'" class="size-estimate">
            预估大小：{{ estimatedSizeText }}
          </div>
          <div v-if="exportFormat === 'png'" class="size-estimate">
            预估大小：{{ estimatedSizeText }}
          </div>
          <div v-if="exportFormat === 'pdf'" class="size-estimate">
            预估大小：{{ estimatedSizeText }}
          </div>
        </div>

        <div class="form-group">
          <label>文件名规则</label>
          <div class="filename-builder">
            <div class="filename-parts">
              <span 
                v-for="(part, idx) in filenameParts" 
                :key="idx"
                class="filename-part"
                :class="{ isField: part.isField }"
              >
                {{ part.text }}
                <span class="part-remove" @click="removeFilenamePart(idx)" v-if="filenameParts.length > 1">×</span>
              </span>
            </div>
            <div class="filename-actions">
              <select v-model="selectedField" class="field-select">
                <option value="">选择字段</option>
                <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
              </select>
              <button class="btn btn-sm btn-primary" @click="addFieldToFilename" :disabled="!selectedField">添加</button>
              <input v-model="customText" placeholder="自定义文本" class="custom-text-input">
              <button class="btn btn-sm" @click="addTextToFilename" :disabled="!customText">添加</button>
            </div>
            <div class="filename-separator">
              <label>连接符:</label>
              <select v-model="filenameSeparator" @change="rebuildFilename">
                <option value="-">- 短横线</option>
                <option value="_">_ 下划线</option>
                <option value=" ">空格</option>
                <option value=".">. 点</option>
                <option value="">无</option>
              </select>
            </div>
          </div>
          <div style="margin-top: 6px; font-size: 12px; color: #999;">
            示例: {{ filenamePreview }}
          </div>
        </div>

        <div class="form-group">
          <label>保存位置</label>
          <div style="display: flex; gap: 8px;">
            <input :value="exportPath" placeholder="点击右侧按钮选择" readonly style="flex: 1;">
            <button class="btn btn-primary" @click="selectExportPath">选择</button>
          </div>
        </div>

        <div v-if="isExporting" style="margin: 16px 0;">
          <div class="progress-bar">
            <div class="progress-bar-inner" :style="{ width: exportProgress + '%' }">
              {{ exportProgress }}%
            </div>
          </div>
          <div style="text-align: center; margin-top: 8px; font-size: 13px; color: #666;">
            正在导出 {{ exportCurrent }} / {{ exportTotal }} ...
          </div>
          <div v-if="exportStatusText" style="text-align: center; margin-top: 4px; font-size: 12px; color: #909399;">
            {{ exportStatusText }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn" @click="cancelExport" style="background: #909399; color: #fff;">
            {{ isExporting ? '取消导出' : '取消' }}
          </button>
          <button class="btn btn-success" @click="doExport" :disabled="!exportPath || isExporting" v-if="!isExporting">
            开始导出
          </button>
        </div>
      </div>
    </div>

    <!-- 帮助弹窗 -->
    <div class="modal-overlay" v-if="showHelp" @click.self="showHelp = false">
      <div class="modal help-modal">
        <div class="modal-title">
          使用说明
          <button class="btn btn-sm" @click="showHelp = false" style="float: right;">关闭</button>
        </div>
        <div class="help-content">
          <h3>一、软件简介</h3>
          <p>HLM证书批量生成器是一款用于批量生成证书的工具软件。您可以导入证书模板图片和Excel数据，然后将数据字段放置到证书模板的指定位置，最后批量导出为图片或PDF文件。</p>

          <h3>二、基本操作流程</h3>
          <ol>
            <li><strong>导入证书模板</strong>：点击"选择模板图片"按钮，选择一张PNG、JPG或BMP格式的证书背景图片。</li>
            <li><strong>导入Excel数据</strong>：点击"选择Excel文件"按钮，选择包含证书信息的Excel文件（支持.xlsx、.xls、.csv格式）。</li>
            <li><strong>设置字段显示</strong>：在左侧"字段列表"中，勾选需要在证书上显示的字段。</li>
            <li><strong>调整字段位置</strong>：在预览区域中，点击选中字段后拖拽到合适位置。</li>
            <li><strong>设置字段样式</strong>：选中字段后，右侧会弹出配置面板，可设置字体、字号、颜色等。</li>
            <li><strong>设置文件名规则</strong>：在导出弹窗中，可设置导出文件的命名规则。</li>
            <li><strong>导出</strong>：点击"预览"查看效果，确认无误后点击"批量导出"生成证书文件。</li>
          </ol>

          <h3>三、快捷操作</h3>
          <ul>
            <li><strong>方向键 ← → ↑ ↓</strong>：微调选中字段的位置（每次1像素）</li>
            <li><strong>Shift + 方向键</strong>：快速移动选中字段（每次10像素）</li>
            <li><strong>Alt + 拖拽</strong>：拖拽字段时启用吸附对齐功能</li>
            <li><strong>缩放控制</strong>：使用工具栏的 +/- 按钮或"适应"按钮调整预览大小</li>
          </ul>

          <h3>四、导出说明</h3>
          <ul>
            <li><strong>预览</strong>：点击"预览"按钮可查看当前证书的渲染效果</li>
            <li><strong>批量导出</strong>：点击"批量导出"按钮，在弹窗中选择导出格式（PNG/JPEG/PDF）和保存位置</li>
            <li><strong>图片质量</strong>：选择JPEG格式时，可调节图片质量（10%-100%）</li>
            <li><strong>文件名规则</strong>：可自由组合字段和自定义文本，使用连接符分隔</li>
          </ul>

          <h3>五、注意事项</h3>
          <ul>
            <li>导入的Excel文件第一行应为字段名称（表头）</li>
            <li>导出的图片分辨率为原始模板尺寸的2倍，确保清晰度</li>
            <li>批量导出大量证书时，请耐心等待进度完成</li>
            <li>如需取消导出，可点击"取消导出"按钮</li>
          </ul>

          <div class="help-footer">
            <p>如有问题或建议，请联系软件制作者。</p>
            <p><strong>制作者：连旗</strong></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
import { PDFDocument } from 'pdf-lib'

export default {
  name: 'App',
  data() {
    return {
      templateSrc: '',
      templateImg: null,
      templateLoaded: false,
      templateWidth: 800,
      templateHeight: 600,
      zoomLevel: 1,
      isFitMode: true,
      excelData: [],
      columns: [],
      fieldConfigs: {},
      fieldPositions: {},
      activeField: '',
      currentPreviewIdx: 0,
      dragging: null,
      dragStartX: 0,
      dragStartY: 0,
      dragFieldStartX: 0,
      dragFieldStartY: 0,
      filenameParts: [],
      filenameSeparator: '-',
      selectedField: '',
      customText: '',
      exportProgress: 0,
      exportCurrent: 0,
      exportTotal: 0,
      isExporting: false,
      cancelExportFlag: false,
      showExportDialog: false,
      showFieldPanel: false,
      showPreview: false,
      isPreviewFullscreen: false,
      previewImageUrl: null,
      exportFormat: 'jpg',
      exportPath: '',
      guideLineX: null,
      guideLineY: null,
      snapDistance: 10,
      altPressed: false,
      showHelp: false,
      estimatedSizeText: '',
      exportStatusText: ''
    }
  },
  mounted() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    
    // 监听菜单事件
    if (window.electronAPI && window.electronAPI.onMenuAction) {
      window.electronAPI.onMenuAction((action) => {
        switch (action) {
          case 'load-template':
            this.loadTemplate()
            break
          case 'load-excel':
            this.loadExcel()
            break
          case 'show-help':
            this.showHelp = true
            break
        }
      })
    }
    
    this.$nextTick(() => {
      if (this.$refs.canvasContainer) {
        this.$refs.canvasContainer.focus()
      }
    })
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  },
    computed: {
    canExport() {
      return this.templateLoaded && this.excelData.length > 0 && this.visibleColumns.length > 0
    },
    finalScale() {
      return this.zoomLevel
    },
    canvasStyle() {
      const w = Math.round(this.templateWidth * this.finalScale)
      const h = Math.round(this.templateHeight * this.finalScale)
      return {
        width: w + 'px',
        height: h + 'px',
        position: 'relative',
        transformOrigin: 'top left'
      }
    },
    visibleColumns() {
      return this.columns.filter(col => this.fieldConfigs[col]?.visible)
    },
    filenamePreview() {
      if (this.excelData.length === 0) return '请先导入数据'
      if (this.filenameParts.length === 0) return '请设置文件名规则'
      
      const row = this.excelData[0]
      let name = ''
      this.filenameParts.forEach((part, idx) => {
        if (idx > 0) name += this.filenameSeparator
        if (part.isField) {
          const val = row[part.text]
          name += (val !== undefined && val !== null) ? String(val) : part.text
        } else {
          name += part.text
        }
      })
      
      const ext = this.exportFormat === 'pdf' ? 'pdf' : this.exportFormat
      return name + '.' + ext
    }
  },
  watch: {
    exportFormat() {
      this.updateEstimate()
    }
  },
  methods: {
    async loadTemplate() {
      const filePath = await window.electronAPI.selectFile({
        filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }]
      })
      if (!filePath) return

      const buffer = await window.electronAPI.readFile(filePath)
      const blob = new Blob([buffer])
      this.templateSrc = URL.createObjectURL(blob)

      const img = new Image()
      img.onload = () => {
        this.templateWidth = img.width
        this.templateHeight = img.height
        this.templateLoaded = true
        this.templateImg = img
        this.$nextTick(() => this.zoomFit())
        this.updateEstimate()
      }
      img.src = this.templateSrc
    },

    async updateEstimate() {
      const w = this.templateWidth
      const h = this.templateHeight
      const count = this.excelData.length
      if (!w || !h || !this.templateLoaded || count === 0) {
        this.estimatedSizeText = ''
        return
      }

      this.estimatedSizeText = '计算中...'

      try {
        const maxDim = 3000
        const scale = Math.min(maxDim / w, maxDim / h)
        const sw = Math.round(w * scale)
        const sh = Math.round(h * scale)

        const canvas = document.createElement('canvas')
        canvas.width = sw
        canvas.height = sh
        const ctx = canvas.getContext('2d')
        ctx.drawImage(this.templateImg, 0, 0, sw, sh)

        const isLossless = this.exportFormat === 'png' || this.exportFormat === 'pdf'
        const mimeType = isLossless ? 'image/png' : 'image/jpeg'
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, mimeType, isLossless ? undefined : 1)
        })
        if (!blob) throw new Error('toBlob failed')

        const bpp = blob.size / (sw * sh)
        let fullBytes = Math.round(bpp * w * h)
        if (this.exportFormat === 'pdf') {
          fullBytes = Math.round(fullBytes * 1.1)
        }

        if (fullBytes > 1024 * 1024) {
          this.estimatedSizeText = '约 ' + (fullBytes / 1024 / 1024).toFixed(1) + ' MB/张'
        } else {
          this.estimatedSizeText = '约 ' + Math.round(fullBytes / 1024) + ' KB/张'
        }
      } catch {
        this.estimatedSizeText = '计算失败'
      }
    },

    zoomIn() {
      this.isFitMode = false
      this.zoomLevel = Math.min(3, this.zoomLevel + 0.1)
    },

    zoomOut() {
      this.isFitMode = false
      this.zoomLevel = Math.max(0.1, this.zoomLevel - 0.1)
    },

    zoomFit() {
      if (!this.templateLoaded) return
      const container = this.$refs.canvasContainer
      if (!container) return
      const containerW = container.clientWidth - 40
      const containerH = container.clientHeight - 40
      const scaleW = containerW / this.templateWidth
      const scaleH = containerH / this.templateHeight
      this.zoomLevel = Math.min(1, scaleW, scaleH)
      this.isFitMode = true
    },

    getDefaultFontSize() {
      const minDim = Math.min(this.templateWidth, this.templateHeight)
      return Math.max(24, Math.round(minDim / 15))
    },

    async loadExcel() {
      const filePath = await window.electronAPI.selectFile({
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }]
      })
      if (!filePath) return

      const buffer = await window.electronAPI.readFile(filePath)
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet)

      if (data.length === 0) {
        alert('Excel 中没有数据')
        return
      }

      this.excelData = data
      this.columns = Object.keys(data[0])
      this.currentPreviewIdx = 0

      const defaultFontSize = this.getDefaultFontSize()

      this.fieldConfigs = {}
      this.fieldPositions = {}
      this.columns.forEach((col, idx) => {
        this.fieldConfigs[col] = {
          visible: false,
          fontFamily: 'SimSun',
          fontSize: defaultFontSize,
          color: '#000000',
          fontWeight: 'normal'
        }
        this.fieldPositions[col] = {
          x: Math.round(this.templateWidth / 2 - 50),
          y: Math.round(this.templateHeight / 2 + idx * (defaultFontSize + 10))
        }
      })

      this.filenameParts = []
      this.updateEstimate()
    },

    onFieldToggle(col, event) {
      const isChecked = event.target.checked
      if (isChecked) {
        if (!this.fieldPositions[col] || 
            this.fieldPositions[col].x > this.templateWidth || 
            this.fieldPositions[col].y > this.templateHeight) {
          this.fieldPositions[col] = {
            x: Math.round(this.templateWidth / 2 - 50),
            y: Math.round(this.templateHeight / 2)
          }
        }
      }
      this.rebuildFilename()
    },

    rebuildFilename() {
      const visibleCols = this.columns.filter(col => this.fieldConfigs[col]?.visible)
      if (visibleCols.length > 0 && this.filenameParts.length === 0) {
        this.filenameParts = visibleCols.map(col => ({ text: col, isField: true }))
      }
    },

    addFieldToFilename() {
      if (this.selectedField) {
        this.filenameParts.push({ text: this.selectedField, isField: true })
        this.selectedField = ''
      }
    },

    addTextToFilename() {
      if (this.customText) {
        this.filenameParts.push({ text: this.customText, isField: false })
        this.customText = ''
      }
    },

    removeFilenamePart(idx) {
      this.filenameParts.splice(idx, 1)
    },

    selectField(col) {
      this.activeField = col
      this.showFieldPanel = true
    },

    onKeyDown(e) {
      if (e.key === 'Alt') {
        this.altPressed = true
      }
    },

    onKeyUp(e) {
      if (e.key === 'Alt') {
        this.altPressed = false
        this.guideLineX = null
        this.guideLineY = null
      }
    },

    handleKeydown(e) {
      if (!this.activeField || !this.fieldPositions[this.activeField]) return
      
      const step = e.shiftKey ? 10 : 1
      
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault()
          this.fieldPositions[this.activeField].y = Math.max(0, this.fieldPositions[this.activeField].y - step)
          break
        case 'ArrowDown':
          e.preventDefault()
          this.fieldPositions[this.activeField].y += step
          break
        case 'ArrowLeft':
          e.preventDefault()
          this.fieldPositions[this.activeField].x = Math.max(0, this.fieldPositions[this.activeField].x - step)
          break
        case 'ArrowRight':
          e.preventDefault()
          this.fieldPositions[this.activeField].x += step
          break
      }
    },

    checkSnap(x, y) {
      const snap = this.snapDistance
      let snappedX = x
      let snappedY = y
      let showGuideX = null
      let showGuideY = null

      const centerX = this.templateWidth / 2
      const centerY = this.templateHeight / 2
      if (Math.abs(x - centerX) < snap) {
        snappedX = centerX
        showGuideX = centerX
      }
      if (Math.abs(y - centerY) < snap) {
        snappedY = centerY
        showGuideY = centerY
      }

      if (Math.abs(x) < snap) {
        snappedX = 0
        showGuideX = 0
      }
      if (Math.abs(y) < snap) {
        snappedY = 0
        showGuideY = 0
      }
      if (Math.abs(x - this.templateWidth) < snap) {
        snappedX = this.templateWidth
        showGuideX = this.templateWidth
      }
      if (Math.abs(y - this.templateHeight) < snap) {
        snappedY = this.templateHeight
        showGuideY = this.templateHeight
      }

      for (const col of this.columns) {
        if (col === this.activeField) continue
        const pos = this.fieldPositions[col]
        if (!pos) continue
        
        if (Math.abs(x - pos.x) < snap) {
          snappedX = pos.x
          showGuideX = pos.x
        }
        if (Math.abs(y - pos.y) < snap) {
          snappedY = pos.y
          showGuideY = pos.y
        }
      }

      this.guideLineX = showGuideX
      this.guideLineY = showGuideY

      return { x: snappedX, y: snappedY }
    },

    getFieldValue(col) {
      if (this.excelData.length === 0) return ''
      const row = this.excelData[this.currentPreviewIdx]
      return row[col] !== undefined ? String(row[col]) : ''
    },

    getFieldStyle(col) {
      const pos = this.fieldPositions[col] || { x: 0, y: 0 }
      const config = this.fieldConfigs[col] || {}
      const s = this.finalScale
      return {
        left: (pos.x * s) + 'px',
        top: (pos.y * s) + 'px',
        fontFamily: config.fontFamily || 'SimSun',
        fontSize: Math.round((config.fontSize || 24) * s) + 'px',
        color: config.color || '#000000',
        fontWeight: config.fontWeight || 'normal'
      }
    },

    startDrag(e, col) {
      this.activeField = col
      this.showFieldPanel = true
      this.dragging = col
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.dragFieldStartX = this.fieldPositions[col].x
      this.dragFieldStartY = this.fieldPositions[col].y

      document.addEventListener('mousemove', this.onDrag)
      document.addEventListener('mouseup', this.stopDrag)
    },

    onDrag(e) {
      if (!this.dragging) return
      let newX = Math.round(this.dragFieldStartX + (e.clientX - this.dragStartX) / this.finalScale)
      let newY = Math.round(this.dragFieldStartY + (e.clientY - this.dragStartY) / this.finalScale)
      
      newX = Math.max(0, newX)
      newY = Math.max(0, newY)

      if (this.altPressed) {
        const snapped = this.checkSnap(newX, newY)
        newX = snapped.x
        newY = snapped.y
      } else {
        this.guideLineX = null
        this.guideLineY = null
      }

      this.fieldPositions[this.dragging] = { x: newX, y: newY }
    },

    stopDrag() {
      this.dragging = null
      this.guideLineX = null
      this.guideLineY = null
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
    },

    prevRecord() {
      if (this.currentPreviewIdx > 0) {
        this.currentPreviewIdx--
      }
    },

    nextRecord() {
      if (this.currentPreviewIdx < this.excelData.length - 1) {
        this.currentPreviewIdx++
      }
    },

    generateFilename(row) {
      if (this.filenameParts.length === 0) return 'certificate'
      if (!row) return 'certificate'
      
      let name = ''
      this.filenameParts.forEach((part, idx) => {
        if (idx > 0) name += this.filenameSeparator
        if (part.isField) {
          const val = row[part.text]
          name += (val !== undefined && val !== null) ? String(val) : part.text
        } else {
          name += part.text
        }
      })
      
      return name || 'certificate'
    },

    renderToCanvas(width, height) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (this.templateImg) {
        ctx.drawImage(this.templateImg, 0, 0, width, height)
      }

      const sx = width / this.templateWidth
      const sy = height / this.templateHeight

      for (const col of this.visibleColumns) {
        const config = this.fieldConfigs[col]
        const pos = this.fieldPositions[col]
        const text = this.getFieldValue(col)
        if (!text) continue

        ctx.font = `${config.fontWeight} ${Math.round(config.fontSize * sy)}px "${config.fontFamily}"`
        ctx.fillStyle = config.color
        ctx.textBaseline = 'top'
        ctx.fillText(text, Math.round(pos.x * sx) + 8, Math.round(pos.y * sy) + 4)
      }

      return canvas
    },

    async captureCanvas() {
      return this.renderToCanvas(this.templateWidth, this.templateHeight)
    },

    async previewCurrent() {
      if (!this.canExport) return
      
      const canvas = await this.captureCanvas()
      this.previewImageUrl = canvas.toDataURL('image/png')
      this.isPreviewFullscreen = false
      this.showPreview = true
    },

    showExportModal() {
      this.exportPath = ''
      this.exportProgress = 0
      this.exportCurrent = 0
      this.exportTotal = 0
      this.cancelExportFlag = false
      this.exportStatusText = ''
      this.showExportDialog = true
      this.updateEstimate()
    },

    cancelExport() {
      if (this.isExporting) {
        this.cancelExportFlag = true
      }
      this.showExportDialog = false
    },

    async selectExportPath() {
      const dir = await window.electronAPI.selectDirectory()
      if (dir) this.exportPath = dir
    },

    async doExport() {
      if (!this.exportPath || this.isExporting) return
      this.isExporting = true
      this.exportProgress = 0
      this.cancelExportFlag = false

      this.exportTotal = this.excelData.length
      this.exportCurrent = 0

      try {
        if (this.exportFormat === 'pdf') {
          await this.exportAsPDF()
        } else {
          await this.exportAsImage()
        }
      } catch (e) {
        if (!this.cancelExportFlag) {
          alert('导出失败: ' + e.message)
        }
      }

      this.isExporting = false
    },

    canvasToBlob(canvas) {
      return new Promise((resolve) => {
        if (this.exportFormat === 'png') {
          canvas.toBlob(resolve, 'image/png')
        } else {
          canvas.toBlob(resolve, 'image/jpeg', 1)
        }
      })
    },

    async exportAsImage() {
      const ext = this.exportFormat

      for (let i = 0; i < this.excelData.length; i++) {
        if (this.cancelExportFlag) {
          alert('导出已取消')
          return
        }

        this.currentPreviewIdx = i
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0))

        this.exportStatusText = '正在渲染第 ' + (i + 1) + ' 张...'

        const canvas = await this.captureCanvas()
        const blob = await this.canvasToBlob(canvas)
        const buffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(buffer)

        const filename = this.generateFilename(this.excelData[i]) + '.' + ext
        const filePath = this.exportPath + '/' + filename
        const r = await window.electronAPI.writeFile(filePath, bytes)
        if (!r.ok) throw new Error(r.error)

        this.exportCurrent = i + 1
        this.exportProgress = Math.round((this.exportCurrent / this.exportTotal) * 100)
      }

      this.showExportDialog = false
      alert('导出完成！共导出 ' + this.exportTotal + ' 张证书')
    },

    async exportAsPDF() {
      const savedIdx = this.currentPreviewIdx

      for (let i = 0; i < this.excelData.length; i++) {
        if (this.cancelExportFlag) {
          alert('导出已取消')
          this.currentPreviewIdx = savedIdx
          return
        }

        this.currentPreviewIdx = i
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0))
        this.exportStatusText = '正在导出第 ' + (i + 1) + ' 张...'

        const canvas = await this.captureCanvas()
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
        const buffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(buffer)

        const pdfDoc = await PDFDocument.create()
        const pngImage = await pdfDoc.embedPng(bytes)
        const page = pdfDoc.addPage([this.templateWidth, this.templateHeight])
        page.drawImage(pngImage, {
          x: 0, y: 0,
          width: this.templateWidth,
          height: this.templateHeight
        })

        const pdfBytes = await pdfDoc.save()
        const filename = this.generateFilename(this.excelData[i]) + '.pdf'
        const filePath = this.exportPath + '/' + filename
        const r = await window.electronAPI.writeFile(filePath, pdfBytes)
        if (!r.ok) throw new Error(r.error + ' (路径: ' + filePath + ')')

        this.exportCurrent = i + 1
        this.exportProgress = Math.round((this.exportCurrent / this.exportTotal) * 100)
      }

      this.currentPreviewIdx = savedIdx
      this.showExportDialog = false
      alert('导出完成！共导出 ' + this.exportTotal + ' 张证书')
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.app-title {
  height: 50px;
  line-height: 50px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: bold;
  color: #409eff;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
  box-sizing: border-box;
  flex-shrink: 0;
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
}

.section {
  flex-shrink: 0;
}

.section:last-child {
  margin-bottom: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
}

.size-estimate {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.btn-block {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 36px;
}

.btn-status {
  color: #fff;
}

.field-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  min-height: 0;
}

.sidebar-bottom {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.empty-hint {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
  background: #f9f9f9;
  border-radius: 4px;
}

.field-item-simple {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.field-item-simple:hover {
  background: #f5f7fa;
}

.field-item-simple.active {
  background: #ecf5ff;
  color: #409eff;
}

.field-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
}

.field-dot.visible {
  background: #67c23a;
}

.field-toggle {
  margin-left: auto;
  cursor: pointer;
}

.field-toggle input {
  width: 16px;
  height: 16px;
}

.copyright {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 12px;
}

.zoom-value {
  min-width: 45px;
  text-align: center;
  font-size: 13px;
  color: #666;
}

.field-config-panel {
  position: fixed;
  right: 20px;
  top: 80px;
  width: 280px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #409eff;
  color: #fff;
  font-weight: bold;
}

.btn-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.panel-body {
  padding: 16px;
}

.panel-hint {
  padding: 12px 16px;
  background: #f5f7fa;
  border-top: 1px solid #ebeef5;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  color: #606266;
}

.hint-icon {
  font-size: 14px;
}

.canvas-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  outline: none;
}

.canvas-container.no-scroll {
  overflow: hidden;
}

.guide-line {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.guide-h {
  left: 0;
  right: 0;
  height: 1px;
  background: #f56c6c;
  box-shadow: 0 0 2px #f56c6c;
}

.guide-v {
  top: 0;
  bottom: 0;
  width: 1px;
  background: #f56c6c;
  box-shadow: 0 0 2px #f56c6c;
}

.preview-wrapper {
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  max-height: 90vh;
  width: 80vw;
  height: 80vh;
}

.preview-wrapper.fullscreen {
  max-width: 100vw;
  max-height: 100vh;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  font-weight: bold;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-body {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.filename-builder {
  background: #f9f9f9;
  border-radius: 4px;
  padding: 10px;
}

.filename-parts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
  min-height: 32px;
  padding: 4px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.filename-part {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
}

.filename-part.isField {
  background: #ecf5ff;
  color: #409eff;
}

.filename-part:not(.isField) {
  background: #f0f0f0;
  color: #666;
}

.part-remove {
  cursor: pointer;
  font-size: 14px;
  color: #999;
  margin-left: 2px;
}

.part-remove:hover {
  color: #f56c6c;
}

.filename-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.field-select {
  flex: 1;
  min-width: 80px;
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
}

.custom-text-input {
  flex: 1;
  min-width: 80px;
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
}

.filename-separator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex-wrap: nowrap;
}

.filename-separator label {
  white-space: nowrap;
}

.filename-separator select {
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
}

.help-modal {
  max-width: 700px;
  max-height: 80vh;
}

.help-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 4px;
}

.help-content h3 {
  color: #409eff;
  margin: 16px 0 10px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #ebeef5;
}

.help-content h3:first-child {
  margin-top: 0;
}

.help-content p {
  margin: 8px 0;
  line-height: 1.6;
  color: #606266;
}

.help-content ol,
.help-content ul {
  margin: 8px 0;
  padding-left: 24px;
  line-height: 1.8;
  color: #606266;
}

.help-content li {
  margin: 4px 0;
}

.help-content strong {
  color: #303133;
}

.help-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  text-align: center;
  color: #909399;
}
</style>
