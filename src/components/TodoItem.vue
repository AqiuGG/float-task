<template>
  <div class="todo-item" :class="[`priority-${todo.priority}`, { done: todo.done }]">
    <!-- 优先级指示条 -->
    <div class="priority-bar"></div>

    <!-- 勾选框 -->
    <button class="checkbox" @click="onToggle">
      <span v-if="todo.done">✓</span>
    </button>

    <!-- 内容区 -->
    <div class="item-content" @dblclick="startEdit">
      <template v-if="!editing">
        <div class="item-text" :class="{ strikethrough: todo.done }">{{ todo.text }}</div>
        <div class="item-meta">
          <span v-if="todo.tag" class="item-tag">{{ getTagEmoji(todo.tag) }}</span>
          <span v-if="todo.dueDate" class="item-due" :class="{ overdue: isOverdue(todo.dueDate) }">
            📅 {{ formatDate(todo.dueDate) }}
          </span>
          <span v-if="todo.note" class="item-note" :title="todo.note">📌</span>
        </div>
      </template>

      <!-- 编辑模式 -->
      <div v-else class="edit-form" @click.stop>
        <input
          ref="editInput"
          v-model="editText"
          class="edit-input"
          @keydown.enter="saveEdit"
          @keydown.esc="cancelEdit"
          @blur="saveEdit"
        />
        <div class="edit-meta">
          <select v-model="editTag" class="edit-select">
            <option value="work">💼 工作</option>
            <option value="life">🏠 生活</option>
            <option value="study">📚 学习</option>
            <option value="health">💪 健康</option>
            <option value="other">🔖 其他</option>
          </select>
          <select v-model="editPriority" class="edit-select">
            <option value="urgent">🔴 紧急</option>
            <option value="important">🟡 重要</option>
            <option value="normal">🟢 普通</option>
          </select>
          <input
            v-model="editDueDate"
            type="date"
            class="edit-select"
          />
        </div>
        <textarea
          v-model="editNote"
          class="edit-textarea"
          placeholder="备注（可选）"
          rows="2"
        ></textarea>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="item-actions" @mousedown.stop>
      <button class="action-btn" @click="startEdit" title="编辑">✏️</button>
      <button class="action-btn delete" @click="onDelete" title="删除">🗑️</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, inject } from 'vue'

const props = defineProps({
  todo: Object,
  themeColor: String
})

// 通过 inject 获取操作函数（来自 App.vue）
const toggleTodo = inject('toggleTodo')
const deleteTodo = inject('deleteTodo')
const editTodo = inject('editTodo')

const editing = ref(false)
const editText = ref('')
const editTag = ref('')
const editPriority = ref('')
const editDueDate = ref('')
const editNote = ref('')
const editInput = ref(null)

const tagEmojis = {
  work: '💼', life: '🏠', study: '📚', health: '💪', other: '🔖'
}

function getTagEmoji(tag) {
  return tagEmojis[tag] || '🔖'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = d.getTime() - today.getTime()
  if (diff < 0) return '已过期'
  if (diff < 86400000) return '今天'
  if (diff < 172800000) return '明天'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr).getTime() < Date.now() - 86400000
}

async function startEdit() {
  editing.value = true
  editText.value = props.todo.text
  editTag.value = props.todo.tag || 'other'
  editPriority.value = props.todo.priority || 'normal'
  editDueDate.value = props.todo.dueDate || ''
  editNote.value = props.todo.note || ''
  await nextTick()
  editInput.value?.focus()
}

function saveEdit() {
  if (!editText.value.trim()) {
    cancelEdit()
    return
  }
  editTodo({
    id: props.todo.id,
    text: editText.value.trim(),
    tag: editTag.value,
    priority: editPriority.value,
    dueDate: editDueDate.value || null,
    note: editNote.value
  })
  editing.value = false
}

function cancelEdit() {
  editing.value = false
}

function onToggle() {
  toggleTodo(props.todo.id)
}

function onDelete() {
  deleteTodo(props.todo.id)
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 6px;
  border-radius: 8px;
  margin-bottom: 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  transition: all 0.15s;
  position: relative;
  overflow: hidden;
}

.todo-item:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.12);
}

.todo-item.done {
  opacity: 0.5;
}

/* 优先级条 */
.priority-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 8px 0 0 8px;
}

.priority-urgent .priority-bar { background: #f43f5e; }
.priority-important .priority-bar { background: #f59e0b; }
.priority-normal .priority-bar { background: #10b981; }

/* 勾选框 */
.checkbox {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 2px solid rgba(255,255,255,0.3);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  color: #10b981;
  font-size: 11px;
  font-weight: bold;
  transition: all 0.15s;
}

.todo-item.done .checkbox {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.checkbox:hover {
  border-color: #10b981;
}

/* 内容区 */
.item-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.item-text {
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
  color: var(--text, #e2e8f0);
}

.item-text.strikethrough {
  text-decoration: line-through;
  opacity: 0.6;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
}

.item-tag {
  font-size: 11px;
}

.item-due {
  font-size: 10px;
  color: #60a5fa;
  opacity: 0.8;
}

.item-due.overdue {
  color: #f43f5e;
  font-weight: 600;
}

.item-note {
  font-size: 11px;
  cursor: help;
}

/* 操作按钮 */
.item-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.todo-item:hover .item-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 12px;
  transition: background 0.15s;
}

.action-btn:hover {
  background: rgba(255,255,255,0.1);
}

.action-btn.delete:hover {
  background: rgba(255,80,80,0.2);
}

/* 编辑表单 */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-input {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  padding: 5px 8px;
  color: inherit;
  font-size: 13px;
  width: 100%;
  outline: none;
}

.edit-input:focus {
  border-color: var(--accent, #7c3aed);
}

.edit-meta {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.edit-select {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  padding: 3px 5px;
  color: inherit;
  font-size: 11px;
  flex: 1;
  min-width: 0;
  outline: none;
}

.edit-textarea {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  padding: 4px 8px;
  color: inherit;
  font-size: 11px;
  width: 100%;
  resize: none;
  outline: none;
  font-family: inherit;
}
</style>
