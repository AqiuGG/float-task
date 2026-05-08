/**
 * 将 win-unpacked 目录打包成自解压安装程序（.exe）
 * 使用 7-Zip SFX 模块创建免安装的可执行文件
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const unpackedDir = path.join(projectRoot, 'dist-electron', 'win-unpacked')
const outputFile = path.join(projectRoot, 'dist-electron', '悬浮待办精灵-Setup-1.0.0.exe')

// 检查 win-unpacked 是否存在
if (!fs.existsSync(unpackedDir)) {
  console.error('Error: dist-electron/win-unpacked not found. Run build first.')
  process.exit(1)
}

// 查找 7za.exe
const sevenZip = path.join(
  projectRoot, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe'
)

if (!fs.existsSync(sevenZip)) {
  console.error('Error: 7za.exe not found in node_modules/7zip-bin')
  process.exit(1)
}

// 方案1：使用 7zip 直接创建 zip（如果之前已生成则跳过）
const zipFile = path.join(projectRoot, 'dist-electron', '悬浮待办精灵-v1.0.0.zip')

// 先确保有最新的 zip
console.log('Creating zip archive...')
execSync(`"${sevenZip}" a -tzip -mx=9 "${zipFile}" ".\\win-unpacked\\*"`, {
  cwd: path.join(projectRoot, 'dist-electron'),
  stdio: 'inherit'
})

// 获取 zip 文件大小
const zipSize = fs.statSync(zipFile).size
const zipSizeMB = (zipSize / 1024 / 1024).toFixed(1)

console.log(`\n====================================`)
console.log(`  ✅ 打包完成！`)
console.log(`====================================`)
console.log(``)
console.log(`  📦 ZIP 包: ${zipFile}`)
console.log(`  📏 大小: ${zipSizeMB} MB`)
console.log(``)
console.log(`  📁 免安装版: ${unpackedDir}`)
console.log(`     直接运行: ${path.join(unpackedDir, '悬浮待办精灵.exe')}`)
console.log(``)
console.log(`  💡 发送给同事: 直接发送 ZIP 包，`)
console.log(`     解压后运行「悬浮待办精灵.exe」即可`)
console.log(`====================================`)

// 将输出路径写入文件，供后续获取
fs.writeFileSync(
  path.join(projectRoot, 'dist-electron', 'output.txt'),
  JSON.stringify({
    zip: zipFile,
    exe: path.join(unpackedDir, '悬浮待办精灵.exe'),
    size: zipSizeMB + ' MB'
  }, null, 2)
)
