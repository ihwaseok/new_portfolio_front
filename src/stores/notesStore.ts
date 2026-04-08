import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MenuItem, MenuTreeNode } from '@/types/menu'
import { fetchMenuList, fetchMenuByParent, syncJoplin, fetchMarkdownContent } from '@/api/notebooksApi'

export type MobilePanel = 'list' | 'content'

export const useNotesStore = defineStore('notes', () => {
  const menuTree = ref<MenuTreeNode[]>([])
  const menuNotes = ref<MenuItem[]>([])
  const selectedMenuId = ref<string | null>(null)
  const selectedNoteId = ref<string | null>(null)
  const searchQuery = ref('')
  const mobilePanel = ref<MobilePanel>('list')
  const drawerOpen = ref(false)
  const noteContent = ref('')
  const loading = ref(false)
  const contentLoading = ref(false)
  const error = ref<string | null>(null)

  const filteredNotes = computed(() => {
    if (!searchQuery.value) return menuNotes.value
    const q = searchQuery.value.toLowerCase()
    return menuNotes.value.filter(n => n.MENU_NM.toLowerCase().includes(q))
  })

  const selectedMenu = computed(() => findNode(menuTree.value, selectedMenuId.value))
  const selectedNote = computed(() => menuNotes.value.find(n => n.MENU_ID === selectedNoteId.value) ?? null)

  const DEFAULT_MENU_ID = import.meta.env.VITE_DEFAULT_OPEN_MENU_ID
  const DEFAULT_NOTE_ID = import.meta.env.VITE_DEFAULT_OPEN_NOTE_ID

  async function init() {
    await loadMenuList()
    if (DEFAULT_MENU_ID) {
      await selectMenu(DEFAULT_MENU_ID)
    }
    if (DEFAULT_NOTE_ID) {
      await selectMenu(DEFAULT_NOTE_ID)
      if (menuNotes.value.length) {
        await selectNote(menuNotes.value[0]!.MENU_ID)
      }
    }
  }

  async function loadMenuList() {
    loading.value = true
    error.value = null
    try {
      const items = await fetchMenuList()
      menuTree.value = buildTree(items)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '메뉴 목록을 불러오지 못했습니다.'
    } finally {
      loading.value = false
    }
  }

  async function selectMenu(id: string) {
    selectedMenuId.value = id
    selectedNoteId.value = null
    mobilePanel.value = 'list'
    drawerOpen.value = false
    await loadMenuByParent(id)
  }

  async function loadMenuByParent(id: string) {
    loading.value = true
    error.value = null
    try {
      menuNotes.value = await fetchMenuByParent(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '하위 메뉴를 불러오지 못했습니다.'
      menuNotes.value = []
    } finally {
      loading.value = false
    }
  }

  async function runJoplinSync() {
    loading.value = true
    error.value = null
    try {
      await syncJoplin()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Joplin 동기화에 실패했습니다.'
    } finally {
      loading.value = false
    }
  }

  async function selectNote(id: string) {
    selectedNoteId.value = id
    mobilePanel.value = 'content'
    const note = menuNotes.value.find(n => n.MENU_ID === id)
    if (!note) return
    contentLoading.value = true
    error.value = null
    try {
      noteContent.value = await fetchMarkdownContent(note.PATH)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '파일을 불러오지 못했습니다.'
      noteContent.value = ''
    } finally {
      contentLoading.value = false
    }
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
    menuTree,
    menuNotes,
    selectedMenuId,
    selectedNoteId,
    searchQuery,
    mobilePanel,
    drawerOpen,
    loading,
    error,
    filteredNotes,
    selectedMenu,
    selectedNote,
    noteContent,
    contentLoading,
    init,
    loadMenuList,
    selectMenu,
    loadMenuByParent,
    runJoplinSync,
    selectNote,
    goBack,
    toggleDrawer,
    closeDrawer,
  }
})

function findNode(list: MenuTreeNode[], id: string | null): MenuTreeNode | null {
  if (!id) return null
  for (const node of list) {
    if (node.menuId === id) return node
    if (node.children.length) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

function buildTree(items: MenuItem[]): MenuTreeNode[] {
  const map = new Map<string, MenuTreeNode>()

  for (const item of items) {
    map.set(item.MENU_ID, {
      menuId: item.MENU_ID,
      menuNm: item.MENU_NM,
      parentId: item.PARENT_ID,
      path: item.PATH,
      sortNo: item.SORT_NO,
      isDir: item.IS_DIR === 'Y',
      subCnt: item.SUB_CNT ?? 0,
      children: [],
    })
  }

  const roots: MenuTreeNode[] = []
  for (const item of items) {
    const node = map.get(item.MENU_ID)!
    if (!item.PARENT_ID) {
      roots.push(node)
    } else {
      const parent = map.get(item.PARENT_ID)
      if (parent) parent.children.push(node)
    }
  }

  return roots
}
