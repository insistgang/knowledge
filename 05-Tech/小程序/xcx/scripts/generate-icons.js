/**
 * 生成简单的 tabBar 图标
 */
const fs = require('fs')
const path = require('path')

// 简单的 PNG 图标数据（1色透明背景的简单图标）
// 使用最简单的 1x1 像素 PNG 格式
const createSimplePNG = (color) => {
  // 最小的 PNG 文件格式（1x1 像素，灰色）
  const basePNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x40, // width (64px)
    0x00, 0x00, 0x00, 0x40, // height (64px)
    0x08, // bit depth
    0x06, // color type (RGBA)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x00, 0x00, 0x00, 0x01, // sRGB chunk length
    0x73, 0x52, 0x47, 0x42, // sRGB
    0x00, // rendering intent
    0x00, 0x00, 0x00, 0x20, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    // Image data (compressed)
    0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D,
    0x0A, 0x63, 0x10, 0x8D, 0x50, 0x81, 0x90, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82
  ])
  return basePNG
}

// 创建图标目录
const distDir = path.join(__dirname, '../dist/images/tabbar')
const srcDir = path.join(__dirname, '../src/images/tabbar')

;[distDir, srcDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// 图标配置
const icons = [
  { name: 'home.png', color: '#999' },
  { name: 'home-active.png', color: '#4A90E2' },
  { name: 'exercise.png', color: '#999' },
  { name: 'exercise-active.png', color: '#4A90E2' },
  { name: 'chat.png', color: '#999' },
  { name: 'chat-active.png', color: '#4A90E2' },
  { name: 'profile.png', color: '#999' },
  { name: 'profile-active.png', color: '#4A90E2' }
]

// 生成图标文件
icons.forEach(icon => {
  const pngData = createSimplePNG(icon.color)
  fs.writeFileSync(path.join(distDir, icon.name), pngData)
  fs.writeFileSync(path.join(srcDir, icon.name), pngData)
  console.log(`Created: ${icon.name}`)
})

console.log('TabBar icons generated successfully!')
