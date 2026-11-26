import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

// 템플릿 예제용 카운터로 현재 문서 탐색 기능과는 별개입니다.
export const useCounterStore = defineStore('counter', () => {
    const count = ref(0);
    const doubleCount = computed(() => count.value * 2);
    // 예제 카운터 값을 증가시킵니다.
    function increment() {
        count.value++;
    }

    return { count, doubleCount, increment };
});
