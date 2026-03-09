<script setup lang="ts">
import type { Notebook } from '@/data/notebooksData'

const props = defineProps<{
  notebook: Notebook
  depth: number
  collapsed: Record<string, boolean>
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [notebook: Notebook]
  toggle: [id: string]
}>()

const hasChildren = !!props.notebook.children?.length
const isOpen = () => !props.collapsed[props.notebook.id]
const isSelected = () => props.notebook.id === props.selectedId

function handleClick() {
  emit('select', props.notebook)
}

function handleDblClick() {
  if (hasChildren) emit('toggle', props.notebook.id)
}

function handleArrowClick(e: MouseEvent) {
  e.stopPropagation()
  emit('toggle', props.notebook.id)
}
</script>

<template>
  <li class="tree-item">
    <div
      class="tree-node"
      :class="{ selected: isSelected() }"
      :style="{ paddingLeft: (10 + depth * 14) + 'px' }"
      @click="handleClick"
      @dblclick="handleDblClick"
    >
      <span class="nb-title">{{ notebook.title }}</span>
      <span
        v-if="hasChildren"
        class="arrow"
        :class="{ open: isOpen() }"
        @click="handleArrowClick"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>

    <ul v-if="hasChildren && isOpen()" class="tree-list">
      <NotebookTreeItem
        v-for="child in notebook.children"
        :key="child.id"
        :notebook="child"
        :depth="depth + 1"
        :collapsed="collapsed"
        :selected-id="selectedId"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </ul>
  </li>
</template>

<style scoped>
.tree-item {
  list-style: none;
}

.tree-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 6px;
  height: 32px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  border-radius: 6px;
  transition: background-color 0.1s;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
}

.tree-node:hover {
  background-color: var(--hover-bg);
  color: var(--text-primary);
}

.tree-node.selected {
  background-color: var(--selected-bg);
  color: var(--accent-color);
  font-weight: 600;
}

.nb-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow {
  color: var(--text-muted);
  transition: transform 0.15s, background-color 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 0;
  margin-right: 2px;
}

.arrow svg {
  display: block;
  width: 12px;
  height: 12px;
}

.arrow:hover {
  background-color: var(--hover-bg);
  color: var(--text-primary);
}

.arrow.open {
  transform: rotate(90deg);
}
</style>
