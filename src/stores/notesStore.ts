import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MenuItem, MenuTreeNode } from '@/types/menu'
import { fetchCommonCodes, fetchMenuList, fetchMenuByParent, syncJoplin, fetchMarkdownContent } from '@/api/notebooksApi'

export type MobilePanel = 'list' | 'content'

export const useNotesStore = defineStore('notes', () => {
  const menuTree = ref<MenuTreeNode[]>([])
  const menuNotes = ref<MenuItem[]>([])
  const selectedMenuId = ref<string | null>(null)
  const selectedNoteId = ref<string | null>(null)
  const searchQuery = ref('')
  const mobilePanel = ref<MobilePanel>('list')
  const drawerOpen = ref(false)
  const focusMode = ref(false)
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

  const defaultOpenMenuId = ref<string | null>(null)

  async function init() {
    selectedMenuId.value = null
    selectedNoteId.value = null
    menuNotes.value = []
    noteContent.value = ''
    defaultOpenMenuId.value = null
    let defaultNoteId = ''
    let configError: string | null = null
    try {
      const codes = await fetchCommonCodes('PORTFOLIO')
      defaultOpenMenuId.value = codes.find(c => c.CODE === 'DEFAULT_OPEN_MENU_ID')?.CODE_VALUE.trim() || null
      defaultNoteId = codes.find(c => c.CODE === 'DEFAULT_OPEN_NOTE_ID')?.CODE_VALUE.trim() || ''
    } catch {
      configError = '초기 페이지 설정을 불러오지 못했습니다. 메뉴에서 문서를 선택해 주세요.'
    }
    await loadMenuList()
    if (error.value) return
    if (defaultOpenMenuId.value && findNode(menuTree.value, defaultOpenMenuId.value)) {
      await selectMenu(defaultOpenMenuId.value)
      if (error.value) return
    }
    if (defaultNoteId) {
      // menuList contains folders only. Membership, not its derived IS_DIR flag,
      // identifies a folder (leaf folders can be reported as IS_DIR=N).
      const folder = findNode(menuTree.value, defaultNoteId)
      if (folder) {
        await openFirstDocument(folder)
      } else {
        const parentId = defaultNoteId.slice(0, defaultNoteId.lastIndexOf('_'))
        if (findNode(menuTree.value, parentId)) {
          await selectMenu(parentId)
          if (menuNotes.value.some(note => note.MENU_ID === defaultNoteId && isDocument(note))) {
            await selectNote(defaultNoteId)
          }
        }
      }
    }
    if (configError) error.value = configError
  }

  function isDocument(note: MenuItem) {
    return note.IS_DIR === 'N' && /\.md$/i.test(note.PATH)
  }

  async function openFirstDocument(folder: MenuTreeNode): Promise<boolean> {
    await selectMenu(folder.menuId)
    if (error.value) return false
    const first = menuNotes.value.find(isDocument)
    if (first) {
      await selectNote(first.MENU_ID)
      return true
    }
    for (const child of folder.children) {
      if (await openFirstDocument(child)) return true
      if (error.value) return false
    }
    // An empty folder remains selectable without requesting it as Markdown.
    await selectMenu(folder.menuId)
    return false
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
    noteContent.value = ''
    mobilePanel.value = 'list'
    drawerOpen.value = false
    await loadMenuByParent(id)
  }

  async function loadMenuByParent(id: string) {
    loading.value = true
    error.value = null
    try {
      menuNotes.value = (await fetchMenuByParent(id)).filter(isDocument)
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
    const note = menuNotes.value.find(n => n.MENU_ID === id)
    if (!note || !isDocument(note)) return
    selectedNoteId.value = id
    mobilePanel.value = 'content'
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

  async function openDocument(parentId: string, noteId: string): Promise<boolean> {
    searchQuery.value = ''
    await selectMenu(parentId)
    if (error.value) return false
    if (!menuNotes.value.some(note => note.MENU_ID === noteId && isDocument(note))) {
      error.value = '문서가 이동되었거나 삭제되었습니다. 다시 검색해 주세요.'
      return false
    }
    await selectNote(noteId)
    return !error.value
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

  function toggleFocusMode() {
    focusMode.value = !focusMode.value
  }

  return {
    menuTree,
    defaultOpenMenuId,
    menuNotes,
    selectedMenuId,
    selectedNoteId,
    searchQuery,
    mobilePanel,
    drawerOpen,
    focusMode,
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
    openDocument,
    goBack,
    toggleDrawer,
    closeDrawer,
    toggleFocusMode,
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
