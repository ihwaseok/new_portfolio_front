<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import { useNotesStore } from '@/stores/notesStore'

const store = useNotesStore()

const renderedContent = computed(() => {
  if (!store.selectedNote) return ''
  return marked(store.selectedNote.content) as string
})
</script>

<template>
  <main class="note-viewer">
    <div v-if="!store.selectedNote" class="empty-state">
      <div class="empty-icon">📝</div>
      <p class="empty-text">노트를 선택하세요</p>
      <p class="empty-sub">왼쪽 패널에서 노트북과 노트를 선택하면<br>내용이 여기에 표시됩니다.</p>
    </div>

    <template v-else>
      <div class="note-header">
        <h1 class="note-title">{{ store.selectedNote.title }}</h1>
        <div class="note-meta">
          <span class="meta-item">{{ store.selectedNote.updatedAt }}</span>
          <span v-if="store.selectedNotebook" class="meta-item meta-sep">
            {{ store.selectedNotebook.title }}
          </span>
        </div>
      </div>

      <div class="markdown-body" v-html="renderedContent" />
    </template>
  </main>
</template>

<style scoped>
.note-viewer {
  flex: 1;
  overflow-y: auto;
  background-color: var(--content-bg);
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
}

.empty-sub {
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
}

.note-header {
  padding: 32px 48px 20px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.note-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 10px;
  line-height: 1.3;
}

.note-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  font-size: 12px;
  color: var(--text-muted);
}

.meta-sep::before {
  content: '·';
  margin-right: 8px;
}

.markdown-body {
  padding: 24px 48px 64px;
  flex: 1;
}
</style>

<style>
/* Markdown rendered content (global, no scoped) */
.markdown-body {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  max-width: 800px;
}

.markdown-body h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 28px 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.markdown-body h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 12px;
  color: var(--text-primary);
}

.markdown-body h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 20px 0 8px;
  color: var(--text-primary);
}

.markdown-body p {
  margin: 0 0 14px;
}

.markdown-body a {
  color: var(--accent-color);
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body code {
  font-family: 'Consolas', 'Fira Code', monospace;
  font-size: 13px;
  background-color: var(--code-bg);
  color: var(--code-color);
  padding: 2px 6px;
  border-radius: 4px;
}

.markdown-body pre {
  background-color: var(--pre-bg);
  border-radius: 6px;
  padding: 16px 20px;
  overflow-x: auto;
  margin: 14px 0;
  border: 1px solid var(--border-color);
}

.markdown-body pre code {
  background: transparent;
  padding: 0;
  font-size: 13px;
  color: var(--pre-color);
}

.markdown-body blockquote {
  margin: 14px 0;
  padding: 10px 16px;
  border-left: 4px solid var(--accent-color);
  background-color: var(--blockquote-bg);
  color: var(--text-secondary);
  border-radius: 0 4px 4px 0;
}

.markdown-body blockquote p {
  margin: 0;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 24px;
  margin: 0 0 14px;
}

.markdown-body li {
  margin-bottom: 4px;
}

.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 14px;
}

.markdown-body th,
.markdown-body td {
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  text-align: left;
}

.markdown-body th {
  background-color: var(--table-header-bg);
  font-weight: 600;
  color: var(--text-primary);
}

.markdown-body tr:nth-child(even) td {
  background-color: var(--table-row-alt);
}

.markdown-body hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 20px 0;
}

.markdown-body input[type='checkbox'] {
  margin-right: 6px;
}
</style>
