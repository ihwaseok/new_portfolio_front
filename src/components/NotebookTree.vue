<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNotesStore } from '@/stores/notesStore'
import type { MenuTreeNode } from '@/types/menu'
import NotebookTreeItem from './NotebookTreeItem.vue'

const DEFAULT_OPEN_ID = import.meta.env.VITE_DEFAULT_OPEN_MENU_ID

const store = useNotesStore()
const collapsed = ref<Record<string, boolean>>({})

// 트리 로드 완료 후 초기 collapsed 상태 설정 (1회만 실행)
watch(() => store.menuTree, (tree) => {
  if (!tree.length) return
  const ids = collectParentIds(tree)
  const next: Record<string, boolean> = {}
  ids.forEach(id => { next[id] = true })
  if (DEFAULT_OPEN_ID) next[DEFAULT_OPEN_ID] = false
  collapsed.value = next
}, { once: true })

function toggle(id: string) {
  collapsed.value[id] = !collapsed.value[id]
}

function selectNode(node: MenuTreeNode) {
  store.selectMenu(node.menuId)
}

function expandAll() {
  collapsed.value = {}
}

function collapseAll() {
  const ids = collectParentIds(store.menuTree)
  const next: Record<string, boolean> = {}
  ids.forEach(id => { next[id] = true })
  collapsed.value = next
}

function collectParentIds(list: MenuTreeNode[]): string[] {
  const ids: string[] = []
  for (const node of list) {
    if (node.children.length) {
      ids.push(node.menuId)
      ids.push(...collectParentIds(node.children))
    }
  }
  return ids
}
</script>

<template>
  <nav class="notebook-tree">
    <div class="tree-toolbar">
      <button class="toolbar-btn" title="전체 펼치기" @click="expandAll">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5.5L7 2L11 5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 8.5L7 12L11 8.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="toolbar-btn" title="전체 줄이기" @click="collapseAll">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2.5L7 6L11 2.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 11.5L7 8L11 11.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div v-if="store.loading && !store.menuTree.length" class="loading-state">
      불러오는 중...
    </div>
    <div v-else-if="store.error && !store.menuTree.length" class="error-state">
      {{ store.error }}
    </div>

    <ul v-else class="tree-list">
      <NotebookTreeItem
        v-for="node in store.menuTree"
        :key="node.menuId"
        :node="node"
        :depth="0"
        :collapsed="collapsed"
        :selected-id="store.selectedMenuId"
        @select="selectNode"
        @toggle="toggle"
      />
    </ul>
  </nav>
</template>

<style scoped>
.notebook-tree {
  width: 280px;
  min-width: 280px;
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

.loading-state,
.error-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
  font-size: 13px;
  text-align: center;
  color: var(--text-muted);
}

.error-state {
  color: #e06c6c;
}
</style>
