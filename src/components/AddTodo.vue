<template>
  <div class="add-todo">
    <!-- 快速输入栏 -->
    <div class="quick-input" :class="{ expanded: isExpanded }">
      <div class="input-row">
        <button class="add-icon-btn" @click="toggleExpand">
          {{ isExpanded ? '▼' : '+' }}
        </button>
        <input
          ref="mainInput"
          v-model="text"
          class="main-input"
          placeholder="添加待办事项..."
          @keydown.enter="handleEnter"
          @focus="isExpanded = true"
        />
        <button
          v-if="text.trim()"
          class="submit-btn"
          @click="submit"
          :style="{ background: themeColor }"
        >
          ↵
        </button>
      </div>

      <!-- 展开的选项 -->
      <transition name="expand">
        <div v-if="isExpanded" class="expand-options" @mousedown.prevent>
          <div class="option-row">
            <label class="option-label">分类</label>
            <div class="option-chips">
              <button
                v-for="tag in tags"
                :key="tag.value"
                class="chip"
                :class="{ active: selectedTag === tag.value }"
                @click="selectedTag = tag.value"
              >
                {{ tag.emoji }} {{ tag.label }}
              </button>
            </div>
          </div>

          <div class="option-row">
            <label class="option-label">优先级</label>
            <div class="option-chips">
              <button
                v-for="p in priorities"
                :key="p.value"
                class="chip"
                :class="{ active: selectedPriority === p.value, [`priority-${p.value}`]: true }"
                @click="selectedPriority = p.value"
              >
                {{ p.emoji }} {{ p.label }}
              </button>
            </div>
          </div>

          <div class="option-row">
            <label class="option-label">截止日期</label>
            <input
              v-model="dueDate"
              type="date"
              class="date-input"
            />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'

const props = defineProps({
  themeColor: { type: String, default: '#7c3aed' }
})

// 通过 inject 获取 todos 和保存函数（来自 App.vue）
const todos = inject('todos')
const saveTodosFn = inject('saveTodos')

const text = ref('')
const isExpanded = ref(false)
const selectedTag = ref('other')
const selectedPriority = ref('normal')
const mainInput = ref(null)

// 获取今天的日期字符串 yyyy-MM-dd
function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dueDate = ref(todayStr())

const tags = [
  { value: 'work', label: '工作', emoji: '💼' },
  { value: 'life', label: '生活', emoji: '🏠' },
  { value: 'study', label: '学习', emoji: '📚' },
  { value: 'health', label: '健康', emoji: '💪' },
  { value: 'other', label: '其他', emoji: '🔖' }
]

const priorities = [
  { value: 'urgent', label: '紧急', emoji: '🔴' },
  { value: 'important', label: '重要', emoji: '🟡' },
  { value: 'normal', label: '普通', emoji: '🟢' }
]

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) mainInput.value?.focus()
}

function handleEnter(e) {
  if (e.shiftKey) return
  submit()
}

function submit() {
  const trimmed = text.value.trim()
  if (!trimmed) return

  const newTodo = {
    id: Date.now(),
    text: trimmed,
    tag: selectedTag.value || 'other',
    priority: selectedPriority.value || 'normal',
    done: false,
    dueDate: dueDate.value || null,
    note: '',
    createdAt: Date.now()
  }

  // 直接添加到 todos 并保存
  todos.value.unshift(newTodo)
  saveTodosFn()

  // 重置表单
  text.value = ''
  dueDate.value = todayStr()
  isExpanded.value = false
}
</script>

<style scoped>
.add-todo {
  width: 100%;
}

.quick-input {
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.2);
  overflow: hidden;
  transition: border-color 0.15s;
}

.quick-input.expanded,
.quick-input:focus-within {
  border-color: rgba(255,255,255,0.25);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
}

.add-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text, #e2e8f0);
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.15s;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
}

.add-icon-btn:hover {
  opacity: 1;
}

.main-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text, #e2e8f0);
  font-size: 13px;
  font-family: inherit;
}

.main-input::placeholder {
  opacity: 0.4;
}

.submit-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.submit-btn:hover {
  opacity: 0.85;
}

/* 展开选项 */
.expand-options {
  padding: 8px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-label {
  font-size: 11px;
  opacity: 0.5;
  white-space: nowrap;
  min-width: 42px;
}

.option-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.chip {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 10px;
  cursor: pointer;
  color: var(--text, #e2e8f0);
  transition: all 0.15s;
  white-space: nowrap;
}

.chip:hover {
  background: rgba(255,255,255,0.12);
}

.chip.active {
  background: var(--accent, #7c3aed);
  border-color: var(--accent, #7c3aed);
  color: white;
}

.chip.priority-urgent.active {
  background: #f43f5e;
  border-color: #f43f5e;
}

.chip.priority-important.active {
  background: #f59e0b;
  border-color: #f59e0b;
}

.chip.priority-normal.active {
  background: #10b981;
  border-color: #10b981;
}

.date-input {
  flex: 1;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--text, #e2e8f0);
  font-size: 11px;
  outline: none;
  font-family: inherit;
}

.date-input:focus {
  border-color: rgba(255,255,255,0.3);
}

/* 展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
