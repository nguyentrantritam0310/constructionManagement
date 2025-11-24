/**
 * Script to copy contract template from assets to public folder
 * Run: node copy-template.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sourceFile = join(__dirname, 'src', 'assets', 'mau-hop-dong-lao-dong-chung.docx')
const destFile = join(__dirname, 'public', 'mau-hop-dong-lao-dong-chung.docx')

try {
  if (!existsSync(sourceFile)) {
    console.log('⚠️  File template không tồn tại tại:', sourceFile)
    console.log('📝 Vui lòng:')
    console.log('   1. Chuyển đổi file mau-hop-dong-lao-dong-chung.doc sang .docx')
    console.log('   2. Đặt file vào thư mục src/assets/')
    console.log('   3. Chạy lại script này')
    process.exit(1)
  }

  console.log('📋 Đang copy file template...')
  const fileContent = readFileSync(sourceFile)
  writeFileSync(destFile, fileContent)
  console.log('✅ Đã copy file template thành công!')
  console.log('   Từ:', sourceFile)
  console.log('   Đến:', destFile)
} catch (error) {
  console.error('❌ Lỗi khi copy file:', error.message)
  process.exit(1)
}

