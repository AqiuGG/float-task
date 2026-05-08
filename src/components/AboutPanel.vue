<template>
  <div class="about-panel">
    <div class="about-header">
      <span>ℹ️ 关于灵动便签</span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="about-body">
      <div class="app-logo">
        <div class="logo-icon">📝</div>
        <div class="app-name">灵动便签</div>
        <div class="app-subname">FloatTask</div>
        <div class="app-version">v1.0.1</div>
      </div>

      <div class="divider"></div>

      <div class="author-section">
        <div class="section-title">开发者</div>
        <div class="author-card">
          <div class="author-avatar">A</div>
          <div class="author-info">
            <div class="author-name">Aqiu_GG</div>
            <a class="author-email" :href="'mailto:1343723089@outlook.com'">1343723089@outlook.com</a>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="tech-section">
        <div class="section-title">技术栈</div>
        <div class="tech-tags">
          <span class="tech-tag">Electron</span>
          <span class="tech-tag">Vue 3</span>
          <span class="tech-tag">Vite</span>
        </div>
      </div>

      <div class="footer-text">
        © 2026 Aqiu_GG. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.about-panel {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  max-height: 70vh;
  overflow-y: auto;
}

.about-header {
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

.about-body {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.app-logo {
  text-align: center;
}

.logo-icon {
  font-size: 40px;
  margin-bottom: 8px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}

.app-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text, #e2e8f0);
  letter-spacing: 1px;
}

.app-subname {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 2px;
}

.app-version {
  font-size: 11px;
  opacity: 0.4;
  margin-top: 4px;
  font-family: monospace;
}

.divider {
  width: 60%;
  height: 1px;
  background: rgba(255,255,255,0.08);
}

.author-section,
.tech-section {
  width: 100%;
}

.section-title {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.4;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  text-align: center;
}

.author-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 10px 14px;
}

.author-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent, #7c3aed), #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: 13px;
  font-weight: 600;
}

.author-email {
  font-size: 10px;
  opacity: 0.6;
  text-decoration: none;
  color: var(--accent, #7c3aed);
  word-break: break-all;
}

.author-email:hover {
  opacity: 1;
  text-decoration: underline;
}

.tech-tags {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tech-tag {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 10px;
  opacity: 0.7;
}

.footer-text {
  font-size: 9px;
  opacity: 0.3;
  text-align: center;
  margin-top: 4px;
}
</style>
