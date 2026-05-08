<template>
  <div class="settings-panel">
    <div class="settings-header">
      <span>⚙️ 外观设置</span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="settings-body">
      <!-- 主题快选 -->
      <div class="setting-row">
        <label class="setting-label">预设主题</label>
        <div class="theme-chips">
          <button
            v-for="t in themes"
            :key="t.id"
            class="theme-chip"
            :class="{ active: currentThemeId === t.id }"
            :style="{ background: t.bgColor }"
            @click="applyTheme(t)"
            :title="t.name"
          >
            <span class="theme-dot" :style="{ background: t.accent }"></span>
            <span class="theme-name">{{ t.name }}</span>
          </button>
        </div>
      </div>

      <!-- 背景颜色 -->
      <div class="setting-row">
        <label class="setting-label">背景颜色</label>
        <div class="color-picker-row">
          <input
            type="color"
            v-model="local.bgColor"
            class="color-swatch"
            @input="emit('update', { bgColor: local.bgColor })"
          />
          <input
            v-model="local.bgColor"
            class="color-text"
            maxlength="7"
            placeholder="#1e1e2e"
            @change="emit('update', { bgColor: local.bgColor })"
          />
        </div>
      </div>

      <!-- 主题色 -->
      <div class="setting-row">
        <label class="setting-label">主题色</label>
        <div class="color-picker-row">
          <input
            type="color"
            v-model="local.accentColor"
            class="color-swatch"
            @input="emit('update', { accentColor: local.accentColor })"
          />
          <div class="accent-presets">
            <button
              v-for="c in accentColors"
              :key="c"
              class="accent-dot"
              :style="{ background: c }"
              :class="{ active: local.accentColor === c }"
              @click="setAccent(c)"
            ></button>
          </div>
        </div>
      </div>

      <!-- 背景透明度 -->
      <div class="setting-row">
        <label class="setting-label">背景透明度</label>
        <div class="slider-row">
          <input
            type="range"
            v-model.number="local.bgOpacity"
            min="0.1"
            max="1"
            step="0.01"
            class="slider"
            :style="sliderStyle(local.bgOpacity)"
            @input="emit('update', { bgOpacity: local.bgOpacity })"
          />
          <span class="slider-val">{{ Math.round(local.bgOpacity * 100) }}%</span>
        </div>
      </div>

      <!-- 窗口整体透明度 -->
      <div class="setting-row">
        <label class="setting-label">窗口透明度</label>
        <div class="slider-row">
          <input
            type="range"
            v-model.number="local.opacity"
            min="0.2"
            max="1"
            step="0.01"
            class="slider"
            :style="sliderStyle(local.opacity)"
            @input="emit('update', { opacity: local.opacity })"
          />
          <span class="slider-val">{{ Math.round(local.opacity * 100) }}%</span>
        </div>
      </div>

      <!-- 圆角 -->
      <div class="setting-row">
        <label class="setting-label">窗口圆角</label>
        <div class="slider-row">
          <input
            type="range"
            v-model.number="local.borderRadius"
            min="0"
            max="24"
            step="1"
            class="slider"
            :style="sliderStyle(local.borderRadius / 24)"
            @input="emit('update', { borderRadius: local.borderRadius })"
          />
          <span class="slider-val">{{ local.borderRadius }}px</span>
        </div>
      </div>

      <!-- 功能设置 -->
      <div class="setting-section-title">功能</div>

      <div class="setting-row toggle-row">
        <label class="setting-label">始终置顶</label>
        <button
          class="toggle-btn"
          :class="{ on: local.alwaysOnTop }"
          @click="toggleSetting('alwaysOnTop')"
        >
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </button>
      </div>

      <div class="setting-row toggle-row">
        <label class="setting-label">边缘自动隐藏</label>
        <button
          class="toggle-btn"
          :class="{ on: local.edgeHide }"
          @click="toggleSetting('edgeHide')"
        >
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </button>
      </div>

      <div class="setting-row toggle-row">
        <label class="setting-label">开机自启动</label>
        <button
          class="toggle-btn"
          :class="{ on: autoLaunch }"
          @click="toggleAutoLaunch"
        >
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </button>
      </div>

      <!-- 快捷键提示 -->
      <div class="shortcut-hint">
        <span>⌨️ 快捷键</span>
        <kbd>Alt + T</kbd>
        <span>呼出/隐藏</span>
      </div>

      <!-- 关于按钮 -->
      <div class="about-btn-wrap">
        <button class="about-btn" @click="$emit('show-about')">
          <span>ℹ️</span> 关于灵动便签
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'

const props = defineProps({ settings: Object })
const emit = defineEmits(['update', 'close', 'show-about'])

const local = reactive({ ...props.settings })

// 开机自启状态
const autoLaunch = ref(false)

onMounted(async () => {
  if (window.electronAPI?.getAutoLaunch) {
    autoLaunch.value = await window.electronAPI.getAutoLaunch()
  }
})

async function toggleAutoLaunch() {
  const newValue = !autoLaunch.value
  if (window.electronAPI?.setAutoLaunch) {
    autoLaunch.value = await window.electronAPI.setAutoLaunch(newValue)
  }
}

watch(() => props.settings, (val) => {
  Object.assign(local, val)
}, { deep: true })

const themes = [
  { id: 'dark',    name: '暗夜',   bgColor: '#1e1e2e', accent: '#7c3aed', textColor: '#e2e8f0', bgOpacity: 0.92 },
  { id: 'midnight',name: '午夜',   bgColor: '#0f172a', accent: '#3b82f6', textColor: '#e2e8f0', bgOpacity: 0.95 },
  { id: 'forest',  name: '森林',   bgColor: '#14532d', accent: '#22c55e', textColor: '#dcfce7', bgOpacity: 0.90 },
  { id: 'ocean',   name: '海洋',   bgColor: '#0c4a6e', accent: '#06b6d4', textColor: '#e0f2fe', bgOpacity: 0.90 },
  { id: 'rose',    name: '玫瑰',   bgColor: '#4c0519', accent: '#f43f5e', textColor: '#ffe4e6', bgOpacity: 0.90 },
  { id: 'light',   name: '浅色',   bgColor: '#f8fafc', accent: '#6366f1', textColor: '#1e293b', bgOpacity: 0.95 },
  { id: 'warm',    name: '暖棕',   bgColor: '#292524', accent: '#f59e0b', textColor: '#fef3c7', bgOpacity: 0.92 },
  { id: 'glass',   name: '磨砂',   bgColor: '#334155', accent: '#e2e8f0', textColor: '#f1f5f9', bgOpacity: 0.70 },
]

const accentColors = [
  '#7c3aed', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#f43f5e', '#ec4899', '#8b5cf6'
]

let currentThemeId = ''

function applyTheme(t) {
  currentThemeId = t.id
  const updates = {
    bgColor: t.bgColor,
    accentColor: t.accent,
    textColor: t.textColor,
    bgOpacity: t.bgOpacity
  }
  Object.assign(local, updates)
  emit('update', updates)
}

function setAccent(c) {
  local.accentColor = c
  currentThemeId = ''
  emit('update', { accentColor: c })
}

function toggleSetting(key) {
  local[key] = !local[key]
  emit('update', { [key]: local[key] })
}

function sliderStyle(ratio) {
  const pct = Math.round(ratio * 100)
  return {
    background: `linear-gradient(to right, var(--accent, #7c3aed) ${pct}%, rgba(255,255,255,0.15) ${pct}%)`
  }
}
</script>

<style scoped>
.settings-panel {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  max-height: 70vh;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.5;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}
.close-btn:hover { opacity: 1; background: rgba(255,80,80,0.2); }

.settings-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-section-title {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.4;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-label {
  font-size: 11px;
  opacity: 0.65;
  white-space: nowrap;
  min-width: 70px;
}

/* 主题快选 */
.theme-chips {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.theme-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  cursor: pointer;
  font-size: 10px;
  color: white;
  transition: all 0.15s;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

.theme-chip:hover {
  transform: scale(1.05);
  border-color: rgba(255,255,255,0.4);
}

.theme-chip.active {
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
}

.theme-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.theme-name {
  font-size: 10px;
}

/* 颜色选择 */
.color-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid rgba(255,255,255,0.2);
  cursor: pointer;
  padding: 0;
  background: none;
  flex-shrink: 0;
}

.color-text {
  flex: 1;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px;
  padding: 4px 8px;
  color: inherit;
  font-size: 11px;
  font-family: monospace;
  outline: none;
  max-width: 80px;
}

.accent-presets {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.accent-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.accent-dot:hover {
  transform: scale(1.2);
}

.accent-dot.active {
  border-color: white;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.4);
}

/* 滑块 */
.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent, #7c3aed);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  transition: transform 0.1s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.slider-val {
  font-size: 11px;
  opacity: 0.6;
  min-width: 32px;
  text-align: right;
}

/* 开关 */
.toggle-row {
  justify-content: space-between;
}

.toggle-btn {
  position: relative;
  width: 36px;
  height: 20px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: rgba(255,255,255,0.15);
  transition: background 0.2s;
}

.toggle-btn.on .toggle-track {
  background: var(--accent, #7c3aed);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.toggle-btn.on .toggle-thumb {
  transform: translateX(16px);
}

/* 快捷键提示 */
.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  font-size: 11px;
  opacity: 0.7;
}

kbd {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  font-family: monospace;
}

/* 关于按钮 */
.about-btn-wrap {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.about-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 6px 16px;
  font-size: 11px;
  color: inherit;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.about-btn:hover {
  opacity: 0.9;
  background: rgba(255,255,255,0.1);
}
</style>
