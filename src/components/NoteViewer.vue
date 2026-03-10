<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import mermaid from 'mermaid'
import { useNotesStore } from '@/stores/notesStore'

mermaid.initialize({ startOnLoad: false, theme: 'dark' })

const store = useNotesStore()

const renderedContent = computed(() => {
  if (!store.noteContent) return ''
  return marked(store.noteContent) as string
})

watch(renderedContent, async () => {
  await nextTick()
  await mermaid.run({ querySelector: '.markdown-body .language-mermaid' })
})
</script>

<template>
  <main class="note-viewer">
    <div v-if="!store.selectedNoteId" class="empty-state">
      <div class="empty-icon">📝</div>
      <p class="empty-text">노트를 선택하세요</p>
      <p class="empty-sub">왼쪽 패널에서 메뉴와 항목을 선택하면<br>내용이 여기에 표시됩니다.</p>
    </div>

    <div v-else-if="store.contentLoading" class="empty-state">
      <div class="empty-icon">⏳</div>
      <p class="empty-text">불러오는 중...</p>
    </div>

    <div v-else-if="store.error && !store.noteContent" class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p class="empty-text">{{ store.error }}</p>
    </div>

    <template v-else>
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
