/**
 * 生成 TabBar 图标 - 使用 pngjs
 */
const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

// 图标尺寸（微信推荐 81x81）
const SIZE = 81

// 颜色配置
const COLOR_NORMAL = { r: 153, g: 153, b: 153, a: 255 }  // 灰色 #999999
const COLOR_ACTIVE = { r: 74, g: 144, b: 226, a: 255 }   // 蓝色 #4A90E2

// 目标目录
const distDir = path.join(__dirname, '../dist/images/tabbar')
const srcDir = path.join(__dirname, '../src/images/tabbar')

;[distDir, srcDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

/**
 * 创建空白 PNG
 */
function createPNG() {
  const png = new PNG({ width: SIZE, height: SIZE })
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = (SIZE * y + x) << 2
      png.data[idx] = 0
      png.data[idx + 1] = 0
      png.data[idx + 2] = 0
      png.data[idx + 3] = 0
    }
  }
  return png
}

/**
 * 设置像素颜色
 */
function setPixel(png, x, y, color) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const idx = (SIZE * y + x) << 2
  png.data[idx] = color.r
  png.data[idx + 1] = color.g
  png.data[idx + 2] = color.b
  png.data[idx + 3] = color.a
}

/**
 * 绘制圆形
 */
function drawCircle(png, cx, cy, radius, color) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(png, Math.floor(cx + dx), Math.floor(cy + dy), color)
      }
    }
  }
}

/**
 * 绘制矩形
 */
function drawRect(png, x, y, w, h, color) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      setPixel(png, x + i, y + j, color)
    }
  }
}

/**
 * 绘制三角形
 */
function drawTriangle(png, x, y, w, h, color) {
  for (let j = 0; j < h; j++) {
    const rowW = Math.floor(w * (1 - j / h))
    const startX = Math.floor(x - rowW / 2)
    for (let i = 0; i < rowW; i++) {
      setPixel(png, startX + i, y + j, color)
    }
  }
}

/**
 * 绘制首页图标（房子）
 */
function drawHomeIcon(color) {
  const png = createPNG()
  const cx = Math.floor(SIZE / 2)
  const cy = Math.floor(SIZE / 2)

  // 房子主体
  drawRect(png, cx - 18, cy + 2, 36, 28, color)
  // 屋顶
  drawTriangle(png, cx, cy - 16, 48, 18, color)

  return png
}

/**
 * 绘制练习图标（笔）
 */
function drawExerciseIcon(color) {
  const png = createPNG()
  const cx = Math.floor(SIZE / 2)
  const cy = Math.floor(SIZE / 2)

  // 简单的笔形状 - 垂直矩形
  drawRect(png, cx - 3, cy - 20, 6, 40, color)
  // 笔尖三角形
  drawTriangle(png, cx, cy + 20, 8, 8, color)

  return png
}

/**
 * 绘制 AI 图标（对话气泡）
 */
function drawChatIcon(color) {
  const png = createPNG()
  const cx = Math.floor(SIZE / 2)
  const cy = Math.floor(SIZE / 2)

  // 气泡主体（圆角矩形）
  const bubbleX = cx - 20
  const bubbleY = cy - 12
  const bubbleW = 40
  const bubbleH = 26

  // 画矩形
  drawRect(png, bubbleX, bubbleY, bubbleW, bubbleH, color)
  // 左下角小三角
  drawRect(png, bubbleX - 4, bubbleY + bubbleH - 8, 6, 8, color)

  // 三个点
  drawCircle(png, cx - 10, cy, 3, { r: 255, g: 255, b: 255, a: 255 })
  drawCircle(png, cx, cy, 3, { r: 255, g: 255, b: 255, a: 255 })
  drawCircle(png, cx + 10, cy, 3, { r: 255, g: 255, b: 255, a: 255 })

  return png
}

/**
 * 绘制我的图标（人像）
 */
function drawProfileIcon(color) {
  const png = createPNG()
  const cx = Math.floor(SIZE / 2)
  const cy = Math.floor(SIZE / 2)

  // 头
  drawCircle(png, cx, cy - 8, 16, color)
  // 身体（半圆）
  drawCircle(png, cx, cy + 20, 24, color)

  return png
}

/**
 * 生成所有图标
 */
async function generateIcons() {
  const icons = [
    { name: 'home.png', draw: () => drawHomeIcon(COLOR_NORMAL) },
    { name: 'home-active.png', draw: () => drawHomeIcon(COLOR_ACTIVE) },
    { name: 'exercise.png', draw: () => drawExerciseIcon(COLOR_NORMAL) },
    { name: 'exercise-active.png', draw: () => drawExerciseIcon(COLOR_ACTIVE) },
    { name: 'chat.png', draw: () => drawChatIcon(COLOR_NORMAL) },
    { name: 'chat-active.png', draw: () => drawChatIcon(COLOR_ACTIVE) },
    { name: 'profile.png', draw: () => drawProfileIcon(COLOR_NORMAL) },
    { name: 'profile-active.png', draw: () => drawProfileIcon(COLOR_ACTIVE) }
  ]

  for (const icon of icons) {
    const png = icon.draw()

    const buffer = PNG.sync.write(png)
    fs.writeFileSync(path.join(distDir, icon.name), buffer)
    fs.writeFileSync(path.join(srcDir, icon.name), buffer)
    console.log(`✓ Created: ${icon.name}`)
  }

  console.log('\n✓ TabBar icons generated successfully!')
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err)
  process.exit(1)
})
