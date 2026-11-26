import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MenuItem, MenuTreeNode } from '@/types/menu';
import {
    fetchCommonCodes,
    fetchMenuList,
    fetchMenuByParent,
    syncJoplin,
    fetchMarkdownContent,
} from '@/api/notebooksApi';

export type MobilePanel = 'list' | 'content';

const menuNameCollator = new Intl.Collator('ko', { numeric: true });

// 문서 탐색 상태와 모바일 화면 전환 상태를 함께 관리합니다.
export const useNotesStore = defineStore('notes', () => {
    const menuTree = ref<MenuTreeNode[]>([]);
    const menuNotes = ref<MenuItem[]>([]);
    const selectedMenuId = ref<string | null>(null);
    const selectedNoteId = ref<string | null>(null);
    const searchQuery = ref('');
    const mobilePanel = ref<MobilePanel>('list');
    const drawerOpen = ref(false);
    const focusMode = ref(false);
    const noteContent = ref('');
    const loading = ref(false);
    const contentLoading = ref(false);
    const error = ref<string | null>(null);

    // 선택한 폴더의 문서 제목을 검색어로 필터링합니다.
    const filteredNotes = computed(() => {
        if (!searchQuery.value) return menuNotes.value;
        const q = searchQuery.value.toLowerCase();
        return menuNotes.value.filter((n) => n.MENU_NM.toLowerCase().includes(q));
    });

    const selectedMenu = computed(() => findNode(menuTree.value, selectedMenuId.value));
    const selectedNote = computed(
        () => menuNotes.value.find((n) => n.MENU_ID === selectedNoteId.value) ?? null,
    );

    const defaultOpenMenuId = ref<string | null>(null);

    // 공통코드에서 초기 메뉴·문서를 조회하고 유효한 문서를 엽니다.
    async function init() {
        selectedMenuId.value = null;
        selectedNoteId.value = null;
        menuNotes.value = [];
        noteContent.value = '';
        defaultOpenMenuId.value = null;
        let defaultNoteId = '';
        let configError: string | null = null;
        try {
            const codes = await fetchCommonCodes('PORTFOLIO');
            defaultOpenMenuId.value =
                codes.find((c) => c.CODE === 'DEFAULT_OPEN_MENU_ID')?.CODE_VALUE.trim() || null;
            defaultNoteId =
                codes.find((c) => c.CODE === 'DEFAULT_OPEN_NOTE_ID')?.CODE_VALUE.trim() || '';
        } catch {
            configError = '초기 페이지 설정을 불러오지 못했습니다. 메뉴에서 문서를 선택해 주세요.';
        }
        await loadMenuList();
        if (error.value) return;
        if (defaultOpenMenuId.value && findNode(menuTree.value, defaultOpenMenuId.value)) {
            await selectMenu(defaultOpenMenuId.value);
            if (error.value) return;
        }
        if (defaultNoteId) {
            // 말단 폴더가 IS_DIR=N으로 반환될 수 있으므로 트리 포함 여부로 폴더를 판별합니다.
            const folder = findNode(menuTree.value, defaultNoteId);
            if (folder) {
                await openFirstDocument(folder);
            } else {
                const parentId = defaultNoteId.slice(0, defaultNoteId.lastIndexOf('_'));
                if (findNode(menuTree.value, parentId)) {
                    await selectMenu(parentId);
                    if (
                        menuNotes.value.some(
                            (note) => note.MENU_ID === defaultNoteId && isDocument(note),
                        )
                    ) {
                        await selectNote(defaultNoteId);
                    }
                }
            }
        }
        if (configError) error.value = configError;
    }

    // 폴더를 제외하고 Markdown 문서인지 확인합니다.
    function isDocument(note: MenuItem) {
        return note.IS_DIR === 'N' && /\.md$/i.test(note.PATH);
    }

    // 현재 폴더부터 하위 폴더 순서로 첫 문서를 찾습니다.
    async function openFirstDocument(folder: MenuTreeNode): Promise<boolean> {
        await selectMenu(folder.menuId);
        if (error.value) return false;
        const first = menuNotes.value.find(isDocument);
        if (first) {
            await selectNote(first.MENU_ID);
            return true;
        }
        for (const child of folder.children) {
            if (await openFirstDocument(child)) return true;
            if (error.value) return false;
        }
        // 빈 폴더는 Markdown 본문을 요청하지 않고 폴더 선택 상태로 유지합니다.
        await selectMenu(folder.menuId);
        return false;
    }

    // 메뉴 응답을 조회하여 계층 트리로 변환합니다.
    async function loadMenuList() {
        loading.value = true;
        error.value = null;
        try {
            const items = await fetchMenuList();
            menuTree.value = buildTree(items);
        } catch (e) {
            error.value = e instanceof Error ? e.message : '메뉴 목록을 불러오지 못했습니다.';
        } finally {
            loading.value = false;
        }
    }

    // 이전 본문을 비우고 선택한 폴더의 문서 목록을 불러옵니다.
    async function selectMenu(id: string) {
        selectedMenuId.value = id;
        selectedNoteId.value = null;
        noteContent.value = '';
        mobilePanel.value = 'list';
        drawerOpen.value = false;
        await loadMenuByParent(id);
    }

    // 폴더에 속한 실제 문서만 목록에 반영합니다.
    async function loadMenuByParent(id: string) {
        loading.value = true;
        error.value = null;
        try {
            menuNotes.value = (await fetchMenuByParent(id))
                .filter(isDocument)
                .sort((a, b) => menuNameCollator.compare(a.MENU_NM, b.MENU_NM));
        } catch (e) {
            error.value = e instanceof Error ? e.message : '하위 메뉴를 불러오지 못했습니다.';
            menuNotes.value = [];
        } finally {
            loading.value = false;
        }
    }

    // 서버에 Joplin 문서와 검색 인덱스 동기화를 요청합니다.
    async function runJoplinSync() {
        loading.value = true;
        error.value = null;
        try {
            await syncJoplin();
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Joplin 동기화에 실패했습니다.';
        } finally {
            loading.value = false;
        }
    }

    // 문서 본문을 불러오고 모바일 화면을 본문으로 전환합니다.
    async function selectNote(id: string) {
        const note = menuNotes.value.find((n) => n.MENU_ID === id);
        if (!note || !isDocument(note)) return;
        selectedNoteId.value = id;
        mobilePanel.value = 'content';
        contentLoading.value = true;
        error.value = null;
        try {
            noteContent.value = await fetchMarkdownContent(note.PATH);
        } catch (e) {
            error.value = e instanceof Error ? e.message : '파일을 불러오지 못했습니다.';
            noteContent.value = '';
        } finally {
            contentLoading.value = false;
        }
    }

    // 검색 필터를 해제하고 출처 문서의 존재를 확인한 뒤 엽니다.
    async function openDocument(parentId: string, noteId: string): Promise<boolean> {
        searchQuery.value = '';
        await selectMenu(parentId);
        if (error.value) return false;
        if (!menuNotes.value.some((note) => note.MENU_ID === noteId && isDocument(note))) {
            error.value = '문서가 이동되었거나 삭제되었습니다. 다시 검색해 주세요.';
            return false;
        }
        await selectNote(noteId);
        return !error.value;
    }

    // 모바일 본문 화면에서 목록으로 돌아갑니다.
    function goBack() {
        mobilePanel.value = 'list';
    }

    // 모바일 메뉴 드로어의 표시 상태를 전환합니다.
    function toggleDrawer() {
        drawerOpen.value = !drawerOpen.value;
    }

    // 모바일 메뉴 드로어를 닫습니다.
    function closeDrawer() {
        drawerOpen.value = false;
    }

    // 문서 탐색 화면과 영상 데모 화면을 전환합니다.
    function toggleFocusMode() {
        focusMode.value = !focusMode.value;
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
    };
});

// 하위 폴더를 재귀 탐색하여 메뉴를 찾습니다.
function findNode(list: MenuTreeNode[], id: string | null): MenuTreeNode | null {
    if (!id) return null;
    for (const node of list) {
        if (node.menuId === id) return node;
        if (node.children.length) {
            const found = findNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

// 부모 메뉴 ID를 기준으로 평면 목록을 계층 트리로 연결합니다.
function buildTree(items: MenuItem[]): MenuTreeNode[] {
    const map = new Map<string, MenuTreeNode>();

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
        });
    }

    const roots: MenuTreeNode[] = [];
    for (const item of items) {
        const node = map.get(item.MENU_ID)!;
        if (!item.PARENT_ID) {
            roots.push(node);
        } else {
            const parent = map.get(item.PARENT_ID);
            if (parent) parent.children.push(node);
        }
    }

    function sortNodes(nodes: MenuTreeNode[]) {
        nodes.sort((a, b) => menuNameCollator.compare(a.menuNm, b.menuNm));
        for (const node of nodes) sortNodes(node.children);
    }

    sortNodes(roots);
    return roots;
}
