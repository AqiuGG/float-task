<template>
  <div
    class="app-container"
    :style="containerStyle"
    :class="{ 'edge-hidden': isEdgeHidden }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- 标题栏（可拖拽） -->
    <div class="title-bar" @mousedown="startDrag">
      <div class="title-left">
        <span class="app-icon">📝</span>
        <span class="app-title">灵动便签</span>
      </div>
      <div class="title-actions" @mousedown.stop>
        <button class="icon-btn" @click="showSettings = !showSettings" title="设置">
          ⚙️
        </button>
        <button class="icon-btn" @click="minimize" title="最小化">
          ➖
        </button>
        <button class="icon-btn close-btn" @click="closeWindow" title="隐藏到托盘">
          ✕
        </button>
      </div>
    </div>

    <!-- 设置面板 -->
    <transition name="slide-down">
      <SettingsPanel
        v-if="showSettings"
        :settings="settings"
        @update="onSettingsUpdate"
        @show-about="showAbout = true"
        @close="showSettings = false"
      />
    </transition>

    <!-- 关于页面 -->
    <transition name="slide-down">
      <AboutPanel
        v-if="showAbout"
        @close="showAbout = false"
      />
    </transition>

    <!-- 主内容区 -->
    <div v-if="!showSettings" class="main-content">
      <!-- 统计栏 -->
      <div class="stats-bar">
        <span class="stat-item">
          <span class="stat-num">{{ pendingCount }}</span>
          <span class="stat-label">待完成</span>
        </span>
        <span class="stat-divider">|</span>
        <span class="stat-item">
          <span class="stat-num done">{{ doneCount }}</span>
          <span class="stat-label">已完成</span>
        </span>
        <span class="stat-divider">|</span>
        <span class="stat-item">
          <span class="stat-num urgent">{{ urgentCount }}</span>
          <span class="stat-label">紧急</span>
        </span>
      </div>

      <!-- 分类标签过滤 -->
      <div class="tag-filter">
        <button
          v-for="tag in allTags"
          :key="tag.value"
          class="tag-btn"
          :class="{ active: filterTag === tag.value }"
          @click="filterTag = filterTag === tag.value ? 'all' : tag.value"
        >
          {{ tag.emoji }} {{ tag.label }}
        </button>
      </div>

      <!-- 待办列表 -->
      <div class="todo-list">
        <!-- 未完成任务 -->
        <TransitionGroup name="todo-list-anim" tag="div">
          <TodoItem
            v-for="todo in filteredTodos"
            :key="todo.id"
            :todo="todo"
            :theme-color="settings.textColor"
            @toggle="toggleTodo"
            @delete="deleteTodo"
            @edit="editTodo"
          />
        </TransitionGroup>

        <!-- 已完成任务（折叠） -->
        <div v-if="doneTodos.length > 0" class="done-section">
          <div class="done-toggle" @click="showDone = !showDone">
            <span>{{ showDone ? '▼' : '▶' }}</span>
            已完成 ({{ doneTodos.length }})
          </div>
          <button class="clear-btn" @click.stop="clearDone" title="清除所有已完成">
            清除
          </button>
          <TransitionGroup v-if="showDone" name="todo-list-anim" tag="div">
            <TodoItem
              v-for="todo in doneTodos"
              :key="todo.id"
              :todo="todo"
              :theme-color="settings.textColor"
              @toggle="toggleTodo"
              @delete="deleteTodo"
              @edit="editTodo"
            />
          </TransitionGroup>
        </div>

        <!-- 空状态 -->
        <div v-if="pendingTodos.length === 0 && doneTodos.length === 0" class="empty-state">
          <div class="empty-icon">🎉</div>
          <div class="empty-text">没有待办事项</div>
          <div class="empty-sub">点击下方按钮添加</div>
        </div>
      </div>

      <!-- 快速添加区域 -->
      <div class="add-area">
        <AddTodo @add="addTodo" :theme-color="settings.accentColor" />
      </div>
    </div>

    <!-- 边缘收缩时的触发条 -->
    <div v-if="isEdgeHidden" class="edge-peek-bar">
      <span>📝</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import TodoItem from './components/TodoItem.vue'
import AddTodo from './components/AddTodo.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import AboutPanel from './components/AboutPanel.vue'

// ============ 状态 ============
const todos = ref([])
const settings = ref({
  opacity: 0.92,
  bgColor: '#1e1e2e',
  accentColor: '#7c3aed',
  textColor: '#e2e8f0',
  theme: 'dark',
  alwaysOnTop: true,
  edgeHide: true,
  borderRadius: 12,
  showSeconds: false
})

const showSettings = ref(false)
const showAbout = ref(false)
const showDone = ref(false)
const filterTag = ref('all')
const isEdgeHidden = ref(false)

const allTags = [
  { value: 'all', label: '全部', emoji: '📋' },
  { value: 'work', label: '工作', emoji: '💼' },
  { value: 'life', label: '生活', emoji: '🏠' },
  { value: 'study', label: '学习', emoji: '📚' },
  { value: 'health', label: '健康', emoji: '💪' },
  { value: 'other', label: '其他', emoji: '🔖' }
]

// ============ 计算属性 ============
const pendingTodos = computed(() =>
  todos.value.filter(t => !t.done)
)

const doneTodos = computed(() =>
  todos.value.filter(t => t.done)
)

const filteredTodos = computed(() => {
  if (filterTag.value === 'all') return pendingTodos.value
  return pendingTodos.value.filter(t => t.tag === filterTag.value)
})

const pendingCount = computed(() => pendingTodos.value.length)
const doneCount = computed(() => doneTodos.value.length)
const urgentCount = computed(() => pendingTodos.value.filter(t => t.priority === 'urgent').length)

const containerStyle = computed(() => {
  const hex = settings.value.bgColor || '#1e1e2e'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${settings.value.bgOpacity ?? 0.92})`,
    borderRadius: `${settings.value.borderRadius ?? 12}px`,
    '--accent': settings.value.accentColor || '#7c3aed',
    '--text': settings.value.textColor || '#e2e8f0',
    '--text-muted': 'rgba(226,232,240,0.5)'
  }
})

// 通过 provide/inject 把操作函数直接注入子组件，绕过 emit
provide('addTodo', addTodo)
provide('toggleTodo', toggleTodo)
provide('deleteTodo', deleteTodo)
provide('editTodo', editTodo)
provide('clearDone', clearDone)
provide('saveTodos', saveTodos)
provide('todos', todos)

// ============ 初始化 ============
onMounted(async () => {
  await loadData()

  // 监听来自主进程的事件
  if (window.electronAPI) {
    window.electronAPI.onEdgeHideChanged((hidden) => {
      isEdgeHidden.value = hidden
    })
    window.electronAPI.onSettingsLoaded((s) => {
      if (s && Object.keys(s).length > 0) {
        settings.value = { ...settings.value, ...s }
      }
    })
  }

  // 检查今日到期任务
  checkDueTodos()
})

async function loadData() {
  if (window.electronAPI) {
    try {
      const savedTodos = await window.electronAPI.getTodos()
      console.log('[App] loadData: 收到', savedTodos ? savedTodos.length : 0, '条待办 (来自 electronAPI)')
      if (savedTodos && Array.isArray(savedTodos)) {
        todos.value = savedTodos
      } else {
        console.warn('[App] loadData: 待办数据格式异常:', typeof savedTodos)
      }
      const savedSettings = await window.electronAPI.getSettings()
      if (savedSettings) {
        settings.value = { ...settings.value, ...savedSettings }
      }
    } catch (e) {
      console.error('[App] loadData 异常:', e)
    }
  }

  // 兜底：如果 electronAPI 数据为空，尝试从 localStorage 恢复
  if ((!todos.value || todos.value.length === 0) && localStorage.getItem('float-todo-todos')) {
    try {
      const localTodos = JSON.parse(localStorage.getItem('float-todo-todos'))
      if (localTodos && Array.isArray(localTodos) && localTodos.length > 0) {
        todos.value = localTodos
        console.log('[App] loadData: 从 localStorage 恢复了', localTodos.length, '条待办')
      }
    } catch (e) {
      console.error('[App] localStorage 读取失败:', e)
    }
  }

  // 浏览器预览模式（无 electronAPI 且无本地数据），加载示例数据
  if (!window.electronAPI && (!todos.value || todos.value.length === 0)) {
    todos.value = [
      { id: 1, text: '完成项目报告', tag: 'work', priority: 'urgent', done: false, dueDate: null, createdAt: Date.now() },
      { id: 2, text: '健身30分钟', tag: 'health', priority: 'normal', done: false, dueDate: null, createdAt: Date.now() },
      { id: 3, text: '阅读一小时', tag: 'study', priority: 'important', done: true, dueDate: null, createdAt: Date.now() }
    ]
  }
}

// ============ 待办操作 ============
async function addTodo(newTodo) {
  console.log('[App] addTodo 被调用, newTodo:', JSON.stringify(newTodo))
  const todo = {
    id: Date.now(),
    text: newTodo.text,
    tag: newTodo.tag || 'other',
    priority: newTodo.priority || 'normal',
    done: false,
    dueDate: newTodo.dueDate || null,
    note: newTodo.note || '',
    createdAt: Date.now()
  }
  console.log('[App] 创建 todo 对象:', JSON.stringify(todo), ', 当前 todos 总数将变为:', todos.value.length + 1)
  todos.value.unshift(todo)
  await saveTodos()
}

async function toggleTodo(id) {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.done = !todo.done
    todo.doneAt = todo.done ? Date.now() : null
    await saveTodos()
  }
}

async function deleteTodo(id) {
  todos.value = todos.value.filter(t => t.id !== id)
  await saveTodos()
}

async function editTodo(updatedTodo) {
  const idx = todos.value.findIndex(t => t.id === updatedTodo.id)
  if (idx !== -1) {
    todos.value[idx] = { ...todos.value[idx], ...updatedTodo }
    await saveTodos()
  }
}

async function clearDone() {
  todos.value = todos.value.filter(t => !t.done)
  await saveTodos()
}

async function saveTodos() {
  // 强制深拷贝，确保传输的是纯 JSON 数据而非 Vue Proxy
  const rawData = JSON.parse(JSON.stringify(todos.value))
  console.log('[App] saveTodos 被调用, todos 数量:', rawData.length)

  if (window.electronAPI) {
    console.log('[App] electronAPI 存在, 准备调用 saveTodos IPC')
    try {
      const result = await window.electronAPI.saveTodos(rawData)
      console.log('[App] saveTodos result:', JSON.stringify(result))
      if (result && !result.success) {
        console.error('[App] saveTodos 失败:', result.error)
      }
    } catch (e) {
      console.error('[App] saveTodos 异常:', e)
    }
  } else {
    console.warn('[App] ⚠️ electronAPI 不存在! 使用 localStorage 兜底存储')
    try {
      localStorage.setItem('float-todo-todos', JSON.stringify(rawData))
      console.warn('[App] localStorage 兜底保存成功')
    } catch (e2) {
      console.error('[App] localStorage 兜底也失败:', e2)
    }
  }
}

// ============ 设置更新 ============
async function onSettingsUpdate(newSettings) {
  settings.value = { ...settings.value, ...newSettings }
  if (window.electronAPI) {
    await window.electronAPI.saveSettings(newSettings)
  }
}

// ============ 窗口操作 ============
function minimize() {
  if (window.electronAPI) window.electronAPI.minimize()
}

function closeWindow() {
  if (window.electronAPI) window.electronAPI.close()
}

// ============ 鼠标事件 ============
function onMouseEnter() {
  if (isEdgeHidden.value && window.electronAPI) {
    window.electronAPI.showFromEdge()
  }
}

function onMouseLeave() { }

// 拖拽标题栏（使用 Electron 原生拖拽）
function startDrag(e) {
  if (e.button !== 0) return
  // 通过 CSS -webkit-app-region: drag 处理
}

// ============ 到期提醒检测 ============
function checkDueTodos() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTs = today.getTime()
  const tomorrowTs = todayTs + 86400000

  todos.value.forEach(todo => {
    if (!todo.done && todo.dueDate) {
      const dueTs = new Date(todo.dueDate).getTime()
      if (dueTs <= todayTs) {
        notifyDue(todo, '已过期')
      } else if (dueTs < tomorrowTs) {
        notifyDue(todo, '今天到期')
      }
    }
  })
}

function notifyDue(todo, msg) {
  if (window.electronAPI) {
    window.electronAPI.showNotification(`待办提醒：${msg}`, todo.text)
  }
}
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
  color: var(--text, #e2e8f0);
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
  font-size: 13px;
  position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

/* 标题栏 */
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  -webkit-app-region: drag;
  background: rgba(0,0,0,0.15);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-icon {
  font-size: 15px;
}

.app-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #e2e8f0);
  letter-spacing: 0.5px;
}

.title-actions {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.15s, background 0.15s;
  color: inherit;
}

.icon-btn:hover {
  opacity: 1;
  background: rgba(255,255,255,0.1);
}

.close-btn:hover {
  background: rgba(255,80,80,0.3) !important;
  opacity: 1 !important;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  gap: 8px;
  background: rgba(0,0,0,0.1);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent, #7c3aed);
}

.stat-num.done {
  color: #10b981;
}

.stat-num.urgent {
  color: #f43f5e;
}

.stat-label {
  font-size: 10px;
  opacity: 0.6;
}

.stat-divider {
  opacity: 0.2;
  font-size: 16px;
}

/* 标签过滤 */
.tag-filter {
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  flex-shrink: 0;
  scrollbar-width: none;
}

.tag-filter::-webkit-scrollbar {
  display: none;
}

.tag-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 3px 8px;
  font-size: 10px;
  cursor: pointer;
  white-space: nowrap;
  color: var(--text, #e2e8f0);
  opacity: 0.7;
  transition: all 0.15s;
}

.tag-btn:hover {
  opacity: 1;
  background: rgba(255,255,255,0.12);
}

.tag-btn.active {
  background: var(--accent, #7c3aed);
  border-color: var(--accent, #7c3aed);
  opacity: 1;
  color: white;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 待办列表 */
.todo-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
}

/* 已完成区域 */
.done-section {
  margin-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 6px;
}

.done-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-muted, rgba(226,232,240,0.5));
  cursor: pointer;
  font-size: 11px;
  padding: 4px 8px;
  width: 100%;
  text-align: left;
}

.done-toggle:hover {
  color: var(--text, #e2e8f0);
}

.clear-btn {
  margin-left: auto;
  background: rgba(255,80,80,0.15);
  border: 1px solid rgba(255,80,80,0.3);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  color: #f87171;
  cursor: pointer;
}

.clear-btn:hover {
  background: rgba(255,80,80,0.3);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.5;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.empty-sub {
  font-size: 11px;
  opacity: 0.7;
}

/* 添加区域 */
.add-area {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 8px;
  flex-shrink: 0;
}

/* 边缘隐藏状态 */
.edge-hidden {
  overflow: hidden;
}

.edge-peek-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;
  writing-mode: vertical-rl;
  font-size: 16px;
  padding: 8px 2px;
  background: var(--accent, #7c3aed);
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.todo-list-anim-enter-active {
  transition: all 0.2s ease;
}

.todo-list-anim-leave-active {
  transition: all 0.15s ease;
}

.todo-list-anim-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.todo-list-anim-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
