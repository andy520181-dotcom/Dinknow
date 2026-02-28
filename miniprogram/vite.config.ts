import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [
    uni(),
    // 将根目录 images 复制到小程序输出目录，供转发卡片 imageUrl: '/images/share-image.png' 使用
    {
      name: 'copy-share-image',
      closeBundle() {
        const outDir = process.env.UNI_OUTPUT_DIR || 'dist/build/mp-weixin'
        const from = path.resolve(__dirname, 'images/share-image.png')
        const toDir = path.resolve(__dirname, outDir, 'images')
        const to = path.join(toDir, 'share-image.png')
        if (fs.existsSync(from)) {
          fs.mkdirSync(toDir, { recursive: true })
          fs.copyFileSync(from, to)
        }
      },
    },
  ],
})
