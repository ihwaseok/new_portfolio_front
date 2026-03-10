/** /sample/menuList, /sample/menuByParent 공통 응답 항목 */
export interface MenuItem {
  MENU_ID: string
  MENU_NM: string
  PARENT_ID: string
  PATH: string
  SORT_NO: number
  IS_DIR: 'Y' | 'N'
  CHILD_MENU_ID?: string | null
  SUB_CNT?: number
}

/** 트리 렌더링용 노드 (flat list → tree 변환 후) */
export interface MenuTreeNode {
  menuId: string
  menuNm: string
  parentId: string
  path: string
  sortNo: number
  isDir: boolean
  subCnt: number
  children: MenuTreeNode[]
}
