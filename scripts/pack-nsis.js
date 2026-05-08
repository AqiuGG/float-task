/**
 * 使用本地 NSIS 将 win-unpacked 打包成安装程序
 * 使用 LZMA Solid 压缩，精简不必要的文件
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const unpackedDir = path.join(projectRoot, 'dist-electron', 'win-unpacked')
const nsisOutput = path.join(projectRoot, 'dist-electron', 'FloatTask-Setup-1.0.1.exe')

// Step 1: 精简 win-unpacked 目录
console.log('📦 精简安装包...')

// 1a. 只保留需要的 locale 文件
const keepLocales = new Set(['zh-CN.pak', 'zh-TW.pak', 'en-US.pak', 'en-GB.pak'])
const localesDir = path.join(unpackedDir, 'locales')
if (fs.existsSync(localesDir)) {
  const localeFiles = fs.readdirSync(localesDir)
  let removed = 0
  localeFiles.forEach(f => {
    if (!keepLocales.has(f)) {
      fs.unlinkSync(path.join(localesDir, f))
      removed++
    }
  })
  console.log(`  ✅ locales 精简: 移除 ${removed} 个语言包，保留 4 个`)
}

// 1b. 删除不需要的大文件
const filesToRemove = [
  'LICENSES.chromium.html',      // 18.5MB 许可证文件
  'vk_swiftshader_icd.json',     // Vulkan 配置（桌面应用不需要）
]

filesToRemove.forEach(f => {
  const fp = path.join(unpackedDir, f)
  if (fs.existsSync(fp)) {
    const size = fs.statSync(fp).size
    fs.unlinkSync(fp)
    console.log(`  ✅ 删除 ${f} (${(size / 1024 / 1024).toFixed(1)} MB)`)
  }
})

// 1c. 删除 vk_swiftshader 目录（GPU 软件渲染，桌面应用不需要）
const swiftshaderDir = path.join(unpackedDir, 'vk_swiftshader')
if (fs.existsSync(swiftshaderDir)) {
  const size = getDirSize(swiftshaderDir)
  fs.rmSync(swiftshaderDir, { recursive: true, force: true })
  console.log(`  ✅ 删除 vk_swiftshader/ (${(size / 1024 / 1024).toFixed(1)} MB)`)
}

// 1d. 删除 fxc（Shader 编译器，不需要）
const fxcPath = path.join(unpackedDir, 'fxc')
if (fs.existsSync(fxcPath)) {
  const size = fs.statSync(fxcPath).size
  fs.unlinkSync(fxcPath)
  console.log(`  ✅ 删除 fxc (${(size / 1024 / 1024).toFixed(1)} MB)`)
}

// Step 2: 计算 win-unpacked 总大小
const totalSize = getDirSize(unpackedDir)
console.log(`\n📏 精简后总大小: ${(totalSize / 1024 / 1024).toFixed(1)} MB`)

// Step 3: 检查 NSIS 是否可用
console.log('\n🔧 检查 NSIS...')

const nsisPaths = [
  'C:\\Program Files (x86)\\NSIS\\makensis.exe',
  'C:\\Program Files\\NSIS\\makensis.exe',
]

let makensisPath = null
for (const p of nsisPaths) {
  if (fs.existsSync(p)) {
    makensisPath = p
    break
  }
}

if (!makensisPath) {
  // 尝试 PATH
  try {
    const { execSync: es } = require('child_process')
    es('makensis /VERSION', { stdio: 'pipe' })
    makensisPath = 'makensis'
  } catch (e) {}
}

if (!makensisPath) {
  console.error('  ❌ NSIS 未找到')
  console.error('     请确保 NSIS 已安装（默认路径：C:\\Program Files (x86)\\NSIS）')
  process.exit(1)
}
console.log(`  ✅ NSIS 已找到: ${makensisPath}`)

// Step 4: 生成 NSIS 脚本并编译
console.log('\n🔨 生成 NSIS 安装包...')

const nsisScript = `
; FloatTask (灵动便签) - NSIS 安装脚本
Unicode true
!include "MUI2.nsh"

; 基本信息
Name "灵动便签 FloatTask"
OutFile "${nsisOutput.replace(/\\/g, '\\\\')}"
InstallDir "$LOCALAPPDATA\\FloatTask"
InstallDirRegKey HKCU "Software\\FloatTask" "InstallDir"
RequestExecutionLevel user

; 压缩设置
SetCompressor /SOLID lzma
SetCompressorDictSize 64

; 版本信息
VIProductVersion "1.0.1.0"
VIAddVersionKey "ProductName" "FloatTask"
VIAddVersionKey "ProductVersion" "1.0.1"
VIAddVersionKey "CompanyName" "Aqiu_GG"
VIAddVersionKey "FileDescription" "FloatTask Installer"
VIAddVersionKey "LegalCopyright" "Copyright 2026 Aqiu_GG"

; 界面设置
!define MUI_ICON "${path.join(projectRoot, 'electron', 'icon.ico').replace(/\\/g, '\\\\')}"
!define MUI_UNICON "${path.join(projectRoot, 'electron', 'icon.ico').replace(/\\/g, '\\\\')}"
!define MUI_ABORTWARNING

; 安装页面
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; 卸载页面
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; 语言
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

; 安装段
Section "Install"
  SetOutPath "$INSTDIR"

  ; 复制所有文件
  File /r "${unpackedDir.replace(/\\/g, '\\\\')}\\*.*"

  ; 创建卸载程序
  WriteUninstaller "$INSTDIR\\uninstall.exe"

  ; 写入注册表
  WriteRegStr HKCU "Software\\FloatTask" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FloatTask" "DisplayName" "灵动便签 FloatTask"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FloatTask" "UninstallString" '"$INSTDIR\\uninstall.exe"'
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FloatTask" "DisplayIcon" '"$INSTDIR\\FloatTask.exe"'
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FloatTask" "Publisher" "Aqiu_GG"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FloatTask" "DisplayVersion" "1.0.1"
  WriteRegDWORD HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FloatTask" "NoModify" 1
  WriteRegDWORD HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FloatTask" "NoRepair" 1

  ; 创建桌面快捷方式
  CreateShortCut "$DESKTOP\\灵动便签.lnk" "$INSTDIR\\FloatTask.exe"

  ; 创建开始菜单快捷方式
  CreateDirectory "$SMPROGRAMS\\灵动便签"
  CreateShortCut "$SMPROGRAMS\\灵动便签\\灵动便签.lnk" "$INSTDIR\\FloatTask.exe"
  CreateShortCut "$SMPROGRAMS\\灵动便签\\卸载.lnk" "$INSTDIR\\uninstall.exe"
SectionEnd

; 卸载段
Section "Uninstall"
  ; 删除文件
  RMDir /r "$INSTDIR"

  ; 删除快捷方式
  Delete "$DESKTOP\\灵动便签.lnk"
  RMDir /r "$SMPROGRAMS\\灵动便签"

  ; 删除注册表
  DeleteRegKey HKCU "Software\\FloatTask"
  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FloatTask"
SectionEnd
`

const nsisScriptPath = path.join(projectRoot, 'dist-electron', 'installer.nsi')
// NSIS 需要 UTF-8 BOM 编码来支持中文
const bom = Buffer.from([0xEF, 0xBB, 0xBF])
fs.writeFileSync(nsisScriptPath, bom + Buffer.from(nsisScript, 'utf-8'))

// 执行 NSIS 编译
try {
  execSync(`"${makensisPath}" "${nsisScriptPath}"`, {
    cwd: projectRoot,
    stdio: 'inherit'
  })

  if (fs.existsSync(nsisOutput)) {
    const fileSize = fs.statSync(nsisOutput).size
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1)
    console.log(`\n${'='.repeat(50)}`)
    console.log(`  ✅ NSIS 安装包生成成功！`)
    console.log(`${'='.repeat(50)}`)
    console.log(``)
    console.log(`  📦 安装包: ${nsisOutput}`)
    console.log(`  📏 大小: ${fileSizeMB} MB`)
    console.log(``)
    console.log(`  💡 发给同事后，双击安装即可使用`)
    console.log(`${'='.repeat(50)}`)

    // 清理临时脚本
    fs.unlinkSync(nsisScriptPath)
  } else {
    console.error('\n❌ 安装包未生成，请检查 NSIS 编译日志')
  }
} catch (e) {
  console.error('❌ NSIS 编译失败:', e.message)
}

// 辅助函数：计算目录大小
function getDirSize(dirPath) {
  let size = 0
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })
    items.forEach(item => {
      const fullPath = path.join(dirPath, item.name)
      if (item.isDirectory()) {
        size += getDirSize(fullPath)
      } else {
        try { size += fs.statSync(fullPath).size } catch (e) {}
      }
    })
  } catch (e) {}
  return size
}
