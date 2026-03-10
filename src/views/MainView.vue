<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotesStore } from '@/stores/notesStore'
import AppTopBar from '@/components/AppTopBar.vue'
import NotebookTree from '@/components/NotebookTree.vue'
import NoteList from '@/components/NoteList.vue'
import NoteViewer from '@/components/NoteViewer.vue'

const store = useNotesStore()

const isMobile = ref(false)

function updateBreakpoint() {
  const prev = isMobile.value
  isMobile.value = window.innerWidth < 768
  // 데스크탑으로 전환 시 드로어 닫기
  if (prev && !isMobile.value) store.closeDrawer()
}

onMounted(() => {
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
  store.init()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateBreakpoint)
})
</script>

<template>
  <div class="app-layout">
    <AppTopBar />

    <div class="app-body">

      <!-- 드로어 오버레이 (모바일) -->
      <Transition name="overlay">
        <div v-if="isMobile && store.drawerOpen" class="drawer-overlay" @click="store.closeDrawer()" />
      </Transition>

      <!-- NotebookTree: 데스크탑/태블릿은 일반 패널, 모바일은 드로어 -->
      <div class="notebook-tree-wrapper" :class="{ 'drawer-open': isMobile && store.drawerOpen }">
        <NotebookTree />
      </div>

      <!-- NoteList -->
      <NoteList v-show="!isMobile || store.mobilePanel === 'list'" />

      <!-- NoteViewer -->
      <NoteViewer v-show="!isMobile || store.mobilePanel === 'content'" />

    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--content-bg);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* ── 드로어 오버레이 ── */
.drawer-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 200;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* ── NotebookTree 래퍼 ── */
.notebook-tree-wrapper {
  display: flex;
  flex-shrink: 0;
}

@media (max-width: 767px) {
  /* 모바일: NotebookTree를 드로어로 전환 */
  .notebook-tree-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 201;
    transform: translateX(-100%);
    transition: transform 0.27s cubic-bezier(0.4, 0, 0.2, 1);
    /* NotebookTree 내부 너비를 따라감 */
  }

  .notebook-tree-wrapper.drawer-open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
  }

  /* NoteList / NoteViewer 모바일 전체 너비 */
  :deep(.note-list),
  :deep(.note-viewer) {
    width: 100% !important;
    min-width: 0 !important;
    flex: 1 !important;
    border-right: none !important;
  }
}

/* ── 태블릿: 패널 폭 축소 ── */
@media (min-width: 768px) and (max-width: 1023px) {
  :deep(.notebook-tree) {
    width: 220px !important;
    min-width: 220px !important;
  }

  :deep(.note-list) {
    width: 210px !important;
    min-width: 210px !important;
  }
}
</style>
