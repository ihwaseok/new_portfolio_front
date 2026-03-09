import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notebooks, notes, type Notebook } from '@/data/notebooksData'

export type MobilePanel = 'list' | 'content'

export const useNotesStore = defineStore('notes', () => {
  const selectedNotebookId = ref<string | null>(null)
  const selectedNoteId = ref<string | null>(null)
  const searchQuery = ref('')
  const mobilePanel = ref<MobilePanel>('list')
  const drawerOpen = ref(false)

  const filteredNotes = computed(() => {
    if (!selectedNotebookId.value) return []
    const nb = findNotebook(notebooks, selectedNotebookId.value)
    if (!nb) return []
    const ids = getAllDescendantIds(nb)
    const notebookNotes = notes.filter(n => ids.includes(n.notebookId))
    if (!searchQuery.value) return notebookNotes
    const q = searchQuery.value.toLowerCase()
    return notebookNotes.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    )
  })

  const selectedNote = computed(() =>
    notes.find(n => n.id === selectedNoteId.value) ?? null
  )

  const selectedNotebook = computed(() =>
    findNotebook(notebooks, selectedNotebookId.value)
  )

  function selectNotebook(id: string) {
    selectedNotebookId.value = id
    selectedNoteId.value = null
    mobilePanel.value = 'list'
    drawerOpen.value = false   // 노트북 선택 시 드로어 닫기
  }

  function selectNote(id: string) {
    selectedNoteId.value = id
    mobilePanel.value = 'content'
  }

  function goBack() {
    mobilePanel.value = 'list'
  }

  function toggleDrawer() {
    drawerOpen.value = !drawerOpen.value
  }

  function closeDrawer() {
    drawerOpen.value = false
  }

  return {
    notebooks,
    selectedNotebookId,
    selectedNoteId,
    searchQuery,
    mobilePanel,
    drawerOpen,
    filteredNotes,
    selectedNote,
    selectedNotebook,
    selectNotebook,
    selectNote,
    goBack,
    toggleDrawer,
    closeDrawer,
  }
})

function findNotebook(list: Notebook[], id: string | null): Notebook | null {
  if (!id) return null
  for (const nb of list) {
    if (nb.id === id) return nb
    if (nb.children) {
      const found = findNotebook(nb.children, id)
      if (found) return found
    }
  }
  return null
}

function getAllDescendantIds(nb: Notebook): string[] {
  const ids = [nb.id]
  if (nb.children) {
    for (const child of nb.children) {
      ids.push(...getAllDescendantIds(child))
    }
  }
  return ids
}
