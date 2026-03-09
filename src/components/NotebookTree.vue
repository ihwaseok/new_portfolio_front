<script setup lang="ts">
import { ref } from 'vue'
import { useNotesStore } from '@/stores/notesStore'
import type { Notebook } from '@/data/notebooksData'
import NotebookTreeItem from './NotebookTreeItem.vue'

const store = useNotesStore()
const collapsed = ref<Record<string, boolean>>({})

function toggle(id: string) {
  collapsed.value[id] = !collapsed.value[id]
}

function selectNotebook(nb: Notebook) {
  store.selectNotebook(nb.id)
}

function expandAll() {
  collapsed.value = {}
}

function collapseAll() {
  const ids = collectParentIds(store.notebooks)
  const next: Record<string, boolean> = {}
  ids.forEach(id => { next[id] = true })
  collapsed.value = next
}

function collectParentIds(list: Notebook[]): string[] {
  const ids: string[] = []
  for (const nb of list) {
    if (nb.children?.length) {
      ids.push(nb.id)
      ids.push(...collectParentIds(nb.children))
    }
  }
  return ids
}
</script>

<template>
  <nav class="notebook-tree">
    <div class="tree-toolbar">
      <button class="toolbar-btn" title="전체 펼치기" @click="expandAll">
        <!-- unfold: 두 화살표가 위아래로 벌어짐 -->
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5.5L7 2L11 5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 8.5L7 12L11 8.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="toolbar-btn" title="전체 줄이기" @click="collapseAll">
        <!-- fold: 두 화살표가 가운데로 모임 -->
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2.5L7 6L11 2.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 11.5L7 8L11 11.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <ul class="tree-list">
      <NotebookTreeItem
        v-for="nb in store.notebooks"
        :key="nb.id"
        :notebook="nb"
        :depth="0"
        :collapsed="collapsed"
        :selected-id="store.selectedNotebookId"
        @select="selectNotebook"
        @toggle="toggle"
      />
    </ul>
  </nav>
</template>

<style scoped>
.notebook-tree {
  width: 210px;
  min-width: 210px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  padding: 8px 8px 4px;
  flex-shrink: 0;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  transition: background-color 0.1s, color 0.1s;
}

.toolbar-btn:hover {
  background-color: var(--hover-bg);
  color: var(--text-primary);
}

.tree-list {
  list-style: none;
  margin: 0;
  padding: 0 6px 12px;
}
</style>
