<script setup lang="ts">
import { useNotesStore } from '@/stores/notesStore'

const store = useNotesStore()

function getPreview(content: string) {
  return content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/gs, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 80)
}
</script>

<template>
  <div class="note-list">
    <div class="list-header">
      <span v-if="store.selectedNotebook" class="notebook-name">
        {{ store.selectedNotebook.title }}
      </span>
      <span v-else class="notebook-name placeholder">노트북을 선택하세요</span>
      <span v-if="store.filteredNotes.length" class="note-count">
        {{ store.filteredNotes.length }}
      </span>
    </div>

    <div v-if="!store.selectedNotebookId" class="empty-state">
      <p>← 노트북을 선택하세요</p>
    </div>

    <div v-else-if="store.filteredNotes.length === 0" class="empty-state">
      <p>노트가 없습니다</p>
    </div>

    <ul v-else class="notes-ul">
      <li
        v-for="note in store.filteredNotes"
        :key="note.id"
        class="note-item"
        :class="{ selected: note.id === store.selectedNoteId }"
        @click="store.selectNote(note.id)"
      >
        <div class="note-title">{{ note.title }}</div>
        <div class="note-meta">{{ note.updatedAt }}</div>
        <div class="note-preview">{{ getPreview(note.content) }}</div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.note-list {
  width: 250px;
  min-width: 250px;
  background-color: var(--notelist-bg);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.notebook-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notebook-name.placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.note-count {
  font-size: 11px;
  color: var(--accent-color);
  background-color: var(--tag-bg);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
  margin-left: 8px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  padding: 16px;
}

.notes-ul {
  list-style: none;
  margin: 0;
  padding: 6px 0;
  overflow-y: auto;
}

.note-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 0.1s;
  border-left: 3px solid transparent;
}

.note-item:hover {
  background-color: var(--hover-bg);
}

.note-item.selected {
  background-color: var(--selected-bg);
  border-left-color: var(--accent-color);
}

.note-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-item.selected .note-title {
  color: var(--accent-color);
  font-weight: 600;
}

.note-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.note-preview {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
