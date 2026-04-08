<script setup lang="ts">
import type { MenuTreeNode } from '@/types/menu'

const props = defineProps<{
  node: MenuTreeNode
  depth: number
  collapsed: Record<string, boolean>
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [node: MenuTreeNode]
  toggle: [id: string]
}>()

const hasChildren = !!props.node.children.length
const isOpen = () => !props.collapsed[props.node.menuId]
const isSelected = () => props.node.menuId === props.selectedId

function calcTotalSubCnt(node: MenuTreeNode): number {
  if (!node.children.length) return node.subCnt
  return node.children.reduce((sum, child) => sum + calcTotalSubCnt(child), 0)
}

const totalSubCnt = calcTotalSubCnt(props.node)

function handleClick() {
  emit('select', props.node)
}

function handleDblClick() {
  if (hasChildren) emit('toggle', props.node.menuId)
}

function handleArrowClick(e: MouseEvent) {
  e.stopPropagation()
  emit('toggle', props.node.menuId)
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
      <span class="title-area">
        <span class="nb-title">{{ node.menuNm }}</span>
        <span v-if="totalSubCnt > 0" class="sub-cnt">{{ totalSubCnt }}</span>
      </span>
      <span
        v-if="hasChildren"
        class="arrow"
        :class="{ open: isOpen() }"
        @click="handleArrowClick"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>

    <ul v-if="hasChildren && isOpen()" class="tree-list">
      <NotebookTreeItem
        v-for="child in node.children"
        :key="child.menuId"
        :node="child"
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
  padding-right: 6px;
  height: 32px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 13px;
  border-radius: 6px;
  transition: background-color 0.1s;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
  gap: 4px;
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

.title-area {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  min-width: 0;
}

.nb-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-cnt {
  font-size: 11px;
  color: var(--accent-color);
  background-color: var(--tag-bg);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
  margin-right: 2px;
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
