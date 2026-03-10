<script setup lang="ts">
import { useNotesStore } from '@/stores/notesStore'

const store = useNotesStore()
</script>

<template>
  <div class="note-list">
    <div class="list-header">
      <span v-if="store.selectedMenu" class="notebook-name">
        {{ store.selectedMenu.menuNm }}
      </span>
      <span v-else class="notebook-name placeholder">메뉴를 선택하세요</span>
      <span v-if="store.filteredNotes.length" class="note-count">
        {{ store.filteredNotes.length }}
      </span>
    </div>

    <div v-if="!store.selectedMenuId" class="empty-state">
      <p>← 메뉴를 선택하세요</p>
    </div>

    <div v-else-if="store.loading" class="empty-state">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="store.filteredNotes.length === 0" class="empty-state">
      <p>항목이 없습니다</p>
    </div>

    <ul v-else class="notes-ul">
      <li
        v-for="note in store.filteredNotes"
        :key="note.MENU_ID"
        class="note-item"
        :class="{ selected: note.MENU_ID === store.selectedNoteId }"
        @click="store.selectNote(note.MENU_ID)"
      >
        <div class="note-title">{{ note.MENU_NM }}</div>
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
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-item.selected .note-title {
  color: var(--accent-color);
  font-weight: 600;
}

</style>
