import { createRouter, createWebHistory } from 'vue-router';
import MainView from '../views/MainView.vue';

// 기본 경로에서 문서 탐색과 챗봇을 제공하는 메인 화면을 표시합니다.
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'main',
            component: MainView,
        },
    ],
});

export default router;
