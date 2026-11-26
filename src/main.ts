import './assets/main.css';
import 'primeicons/primeicons.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

// 공통 상태 저장소와 라우터를 등록한 뒤 Vue 앱을 화면에 연결합니다.
const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
