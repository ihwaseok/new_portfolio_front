<script setup lang="ts">
import { computed } from 'vue'
import { useNotesStore } from '@/stores/notesStore'

const store = useNotesStore()

const contextTitle = computed(() => {
  if (store.mobilePanel === 'content') return store.selectedNote?.MENU_NM ?? ''
  return store.selectedMenu?.menuNm ?? 'My Notes'
})
</script>

<template>
  <header class="topbar">

    <!-- 모바일: 햄버거 메뉴 (콘텐츠 뷰에서는 숨김) -->
    <button v-if="store.mobilePanel !== 'content'" class="hamburger" aria-label="메뉴 열기" @click="store.toggleDrawer()">
      <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
        <rect width="18" height="2" rx="1"/>
        <rect y="6" width="18" height="2" rx="1"/>
        <rect y="12" width="18" height="2" rx="1"/>
      </svg>
    </button>

    <!-- 모바일: 컨텍스트 타이틀 + 뒤로가기 -->
    <div class="mobile-header">
      <button
        v-if="store.mobilePanel === 'content'"
        class="back-btn"
        @click="store.goBack()"
      >
        <svg width="8" height="13" viewBox="0 0 8 13" fill="currentColor">
          <path d="M7 1L1 6.5L7 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        목록
      </button>
      <span class="mobile-title">{{ contextTitle }}</span>
    </div>

    <!-- 데스크탑: 로고 + 타이틀 -->
    <div class="desktop-header">
      <div class="logo-mark"><i class="pi pi-book" /></div>
      <span class="app-title">LSH Portfolio</span>
    </div>

    <div class="spacer" />

    <!-- 우측 버튼 그룹 -->
    <div class="topbar-actions">
      <!--
      <button class="action-btn text-btn focus-btn" :class="{ 'focus-active': store.focusMode }" @click="store.toggleFocusMode()" title="AI 테스트">
        <i class="pi pi-microchip-ai" />
        <span>AI 테스트</span>
      </button>
      -->
      <a href="https://mylsh-redmine.duckdns.org" target="_blank" rel="noopener" class="action-btn text-btn">
        <i class="pi pi-list-check" />
        <span>일감관리</span>
      </a>
      <a href="https://mylsh-zabbix.duckdns.org" target="_blank" rel="noopener" class="action-btn text-btn">
        <i class="pi pi-desktop" />
        <span>모니터링</span>
      </a>
      <a href="https://github.com/ihwaseok" target="_blank" rel="noopener" class="action-btn icon-btn" title="GitHub">
        <i class="pi pi-github" />
      </a>
    </div>

  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  height: 52px;
  background-color: var(--topbar-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
  gap: 10px;
  flex-shrink: 0;
  z-index: 100;
}

/* ── 햄버거 (모바일 전용) ── */
.hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  flex-shrink: 0;
  transition: background-color 0.15s;
}

.hamburger:hover {
  background-color: var(--hover-bg);
}

/* ── 모바일 헤더 영역 ── */
.mobile-header {
  display: none;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
  font-size: 13px;
  font-weight: 500;
  padding: 4px 0;
  flex-shrink: 0;
  white-space: nowrap;
}

.mobile-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

/* ── 데스크탑 헤더 영역 ── */
.desktop-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mark {
  width: 28px;
  height: 28px;
  background-color: var(--accent-color);
  color: #ffffff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}

.app-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.spacer {
  flex: 1;
}

/* ── 우측 버튼 그룹 ── */
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--text-secondary);
  border-radius: 6px;
  transition: background-color 0.15s, color 0.15s;
  white-space: nowrap;
}

.action-btn:hover {
  background-color: var(--hover-bg);
  color: var(--text-primary);
}

.text-btn {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--border-color);
  background-color: var(--hover-bg);
  color: var(--text-primary);
}

.text-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background-color: var(--selected-bg);
}

.text-btn .pi {
  font-size: 13px;
}

.icon-btn {
  padding: 6px 8px;
  font-size: 18px;
}

.focus-btn {
  border: 1px solid var(--border-color);
  background-color: var(--hover-bg);
  cursor: pointer;
}

.focus-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background-color: var(--selected-bg);
}

.focus-active {
  border-color: var(--accent-color) !important;
  color: var(--accent-color) !important;
  background-color: var(--selected-bg) !important;
}

/* ── 반응형 ── */
@media (max-width: 767px) {
  .hamburger      { display: flex; }
  .mobile-header  { display: flex; }
  .desktop-header { display: none; }

  .topbar-actions .text-btn span { display: none; }
  .topbar-actions .text-btn { padding: 6px 8px; }
  .spacer { display: none; }
}
</style>
