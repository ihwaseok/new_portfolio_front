<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';
import {
    streamChatMessage,
    type ChatSource,
    type ChatTurn,
    type ChatEvidence,
    type ChatMode,
} from '@/api/notebooksApi';
import { useNotesStore } from '@/stores/notesStore';

// 대화 메시지에 출처·근거·장애 안내 정보를 함께 보관합니다.
interface Message extends ChatTurn {
    sources?: ChatSource[];
    notice?: string;
    evidence?: ChatEvidence;
    intent?: 'general' | 'document';
}

const store = useNotesStore();
const open = ref(false);
const question = ref('');
const mode = ref<ChatMode>('auto');
const modeOptions: { value: ChatMode; label: string }[] = [
    { value: 'auto', label: '자동' },
    { value: 'general', label: '일반 질문' },
    { value: 'document', label: '내 문서 검색' },
];
const messages = ref<Message[]>([]);
const pending = ref(false);
const pendingStatus = ref('답변을 준비하고 있습니다…');
const error = ref('');
const openingSource = ref(false);
const transcript = ref<HTMLElement | null>(null);
const input = ref<HTMLTextAreaElement | null>(null);
let controller: AbortController | null = null;

// 패널이 화면에 나타난 뒤 질문 입력란으로 초점을 이동합니다.
watch(open, async (value) => {
    if (value) {
        await nextTick();
        input.value?.focus();
    }
});
// 최신 메시지와 응답 대기 상태가 보이도록 대화 영역을 스크롤합니다.
watch(
    () => [
        messages.value.length,
        messages.value[messages.value.length - 1]?.content,
        pending.value,
        pendingStatus.value,
    ],
    async () => {
        await nextTick();
        transcript.value?.scrollTo({ top: transcript.value.scrollHeight, behavior: 'auto' });
    },
);
// 화면을 떠날 때 진행 중인 채팅 요청을 취소합니다.
onUnmounted(() => controller?.abort());

// 샘플 질문을 자동 모드로 설정하여 즉시 전송합니다.
async function submitSample(text: string) {
    if (pending.value) return;
    mode.value = 'auto';
    question.value = text;
    await submit();
}

// 중복 요청을 막고 최근 대화와 함께 질문을 전송합니다.
async function submit() {
    const text = question.value.trim();
    if (!text || pending.value || Array.from(text).length > 500) return;
    // 선택한 모드에 맞는 최근 메시지 6개를 각 500자 이내로 전달합니다.
    const history = messages.value
        .filter((message) => mode.value === 'auto' || message.intent === mode.value)
        .slice(-6)
        .map(({ role, content }) => ({
            role,
            content: Array.from(content).slice(0, 500).join(''),
        }));
    const userIndex = messages.value.length;
    messages.value.push({ role: 'user', content: text });
    const assistantIndex = messages.value.length;
    messages.value.push({ role: 'assistant', content: '' });
    question.value = '';
    error.value = '';
    pending.value = true;
    pendingStatus.value = '질문을 확인하고 있습니다…';
    controller = new AbortController();
    // 모델 응답이 지연되더라도 190초가 지나면 요청을 취소합니다.
    const timeout = window.setTimeout(() => controller?.abort(), 190000);
    try {
        const result = await streamChatMessage(
            text,
            history,
            {
                onText: (content) => {
                    messages.value[assistantIndex]!.content = content;
                },
                onStatus: (message) => {
                    pendingStatus.value = message;
                },
                onMeta: (intent) => {
                    messages.value[userIndex]!.intent = intent;
                    messages.value[assistantIndex]!.intent = intent;
                },
            },
            controller.signal,
            mode.value,
        );
        if (messages.value[userIndex]) messages.value[userIndex]!.intent = result.intent;
        messages.value[assistantIndex] = {
            role: 'assistant',
            content: result.answer,
            sources: result.sources,
            evidence: result.evidence,
            intent: result.intent,
            notice: result.generationUnavailable
                ? '검색된 페이지 목록을 안내합니다.'
                : result.mode === 'keyword'
                  ? '키워드 검색 결과입니다.'
                  : undefined,
        };
    } catch (e) {
        // 실패한 질문을 입력란에 복원하고 재시도 시 대화에 중복 전달되지 않게 합니다.
        messages.value.splice(userIndex);
        question.value = text;
        error.value =
            e instanceof Error && e.name === 'AbortError'
                ? '응답 대기 시간이 초과됐습니다. 다시 시도해 주세요.'
                : e instanceof Error
                  ? e.message
                  : '답변을 불러오지 못했습니다.';
    } finally {
        window.clearTimeout(timeout);
        controller = null;
        pending.value = false;
    }
}

// 출처 문서가 실제로 열린 경우에만 채팅 패널을 닫습니다.
async function openSource(source: ChatSource) {
    if (openingSource.value) return;
    openingSource.value = true;
    error.value = '';
    try {
        if (await store.openDocument(source.parentId, source.menuId)) open.value = false;
        else error.value = store.error || '문서를 열지 못했습니다. 다시 검색해 주세요.';
    } finally {
        openingSource.value = false;
    }
}

// 요청 처리 중에는 초기화를 막고 새 대화 상태를 준비합니다.
function reset() {
    if (pending.value) return;
    messages.value = [];
    question.value = '';
    error.value = '';
    input.value?.focus();
}

// 문서 경로를 읽기 쉬운 폴더·문서 위치로 표시합니다.
function sourceLocation(source: ChatSource) {
    const parts = source.path.replace(/\\/g, '/').split('/').filter(Boolean);
    if (!parts.length) return source.title;
    parts[parts.length - 1] = parts[parts.length - 1]!.replace(/\.md$/i, '');
    return parts.join(' → ');
}
</script>

<template>
    <button
        v-if="!open"
        class="chat-launcher"
        aria-controls="page-chat"
        :aria-expanded="open"
        @click="open = true"
    >
        <i class="pi pi-comments" aria-hidden="true" /> AI 챗봇
    </button>
    <section
        v-if="open"
        id="page-chat"
        class="chat-panel"
        aria-label="AI 챗봇"
        @keydown.esc="open = false"
    >
        <header class="chat-header">
            <div>
                <strong>AI 챗봇</strong>
                <p>일반 질문과 내 문서 검색을 도와드립니다</p>
            </div>
            <div class="chat-actions">
                <button :disabled="pending" title="새 대화" aria-label="새 대화" @click="reset">
                    <i class="pi pi-refresh" />
                </button>
                <button aria-label="챗봇 닫기" @click="open = false">
                    <i class="pi pi-times" />
                </button>
            </div>
        </header>
        <fieldset class="chat-mode">
            <legend class="sr-only">답변 방식 선택</legend>
            <button
                v-for="option in modeOptions"
                :key="option.value"
                type="button"
                :aria-pressed="mode === option.value"
                :disabled="pending"
                @click="mode = option.value"
            >
                {{ option.label }}
            </button>
        </fieldset>
        <div
            ref="transcript"
            class="chat-transcript"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            :aria-busy="pending"
        >
            <div v-if="!messages.length" class="chat-welcome">
                <i class="pi pi-search" aria-hidden="true" />
                <h3>무엇이 궁금하신가요?</h3>
                <p>
                    일반 질문에 답하거나 내 문서를 검색합니다.<br />페이지 카드를 누르면 문서가
                    열립니다.
                </p>
                <div class="chat-samples">
                    <button
                        type="button"
                        :disabled="pending"
                        @click="submitSample('SQL 관련정보 찾아줘')"
                    >
                        SQL 관련정보 찾아줘
                    </button>
                    <button
                        type="button"
                        :disabled="pending"
                        @click="submitSample('Docker에 대해 설명해줘')"
                    >
                        Docker에 대해 설명해줘
                    </button>
                </div>
                <p class="chat-model-notice">
                    하드웨어 제약으로 qwen3-0.6b 모델을 사용하고 있습니다. 모델 성능이 제한적이어서
                    답변이 부정확하거나 어색할 수 있습니다.
                </p>
            </div>
            <article
                v-for="(message, index) in messages"
                :key="index"
                v-show="message.role === 'user' || message.content || message.sources?.length"
                class="chat-message"
                :class="message.role"
            >
                <span class="chat-role">{{ message.role === 'user' ? '나' : 'AI 도우미' }}</span>
                <span v-if="message.role === 'assistant' && message.intent" class="intent-label">{{
                    message.intent === 'general' ? '일반 답변' : '문서 기반'
                }}</span>
                <span
                    v-if="message.evidence"
                    class="evidence-badge"
                    :class="message.evidence.status"
                >
                    {{
                        message.evidence.status === 'supported'
                            ? '근거 확인'
                            : message.evidence.status === 'partial'
                              ? '일부만 관련'
                              : '자료 부족'
                    }}
                </span>
                <p class="chat-text">{{ message.content }}</p>
                <blockquote v-if="message.evidence?.quote" class="evidence-quote">
                    {{ message.evidence.quote }}
                </blockquote>
                <p v-if="message.notice" class="chat-notice">{{ message.notice }}</p>
                <div v-if="message.sources?.length" class="chat-sources">
                    <span class="chat-notice">{{
                        message.evidence?.status === 'partial'
                            ? '참고용 관련 페이지 · 질문 전체의 답변 근거는 확인되지 않았습니다'
                            : '관련 페이지'
                    }}</span>
                    <button
                        v-for="source in message.sources"
                        :key="source.menuId"
                        class="chat-source"
                        :disabled="openingSource"
                        :aria-label="`문서 열기: ${sourceLocation(source)}`"
                        @click="openSource(source)"
                    >
                        <strong
                            ><i class="pi pi-file" aria-hidden="true" /><span>{{
                                sourceLocation(source)
                            }}</span
                            ><span aria-hidden="true">↗</span></strong
                        >
                    </button>
                </div>
            </article>
            <p v-if="pending" class="chat-pending" role="status">
                <span class="chat-spinner" aria-hidden="true"></span>
                {{ pendingStatus }}
            </p>
        </div>
        <p v-if="error" class="chat-error" role="alert">{{ error }}</p>
        <form class="chat-form" @submit.prevent="submit">
            <label class="sr-only" for="chat-question">찾고 싶은 내용</label>
            <textarea
                id="chat-question"
                ref="input"
                v-model="question"
                rows="2"
                maxlength="500"
                :disabled="pending"
                placeholder="찾고 싶은 내용을 입력하세요"
                @keydown.enter.exact.prevent="submit"
            />
            <button type="submit" :disabled="pending || !question.trim()" aria-label="질문 보내기">
                <i class="pi pi-arrow-up" aria-hidden="true" />
            </button>
            <small>Enter로 전송 · Shift+Enter로 줄바꿈</small>
        </form>
    </section>
</template>

<style scoped>
/* 아이콘 라이브러리의 회전 클래스에 의존하지 않고 대기 중 계속 회전합니다. */
.chat-spinner {
    display: inline-block;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-color);
    border-top-color: var(--accent-color, #2dbe60);
    border-radius: 50%;
    animation: chat-spin 0.8s linear infinite;
}
@keyframes chat-spin {
    to {
        transform: rotate(360deg);
    }
}
.chat-launcher {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 250;
    display: flex;
    align-items: center;
    gap: 9px;
    border: 1px solid var(--accent-color, #2dbe60);
    border-radius: 28px;
    padding: 14px 20px;
    background: #207b43;
    color: white;
    box-shadow: 0 5px 24px #0005;
    font: inherit;
    cursor: pointer;
}
.chat-panel {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 260;
    width: 420px;
    height: min(720px, calc(100dvh - 40px));
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: 16px;
    background: var(--content-bg);
    color: var(--text-primary);
    box-shadow: 0 12px 50px #0007;
    overflow: hidden;
}
.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px;
    border-bottom: 1px solid var(--border-color);
    background: var(--sidebar-bg);
}
.chat-header p,
.chat-notice {
    margin-top: 5px;
    color: var(--text-muted);
    font-size: 12px;
}
.chat-actions {
    display: flex;
    gap: 8px;
}
.chat-actions button {
    background: transparent;
    color: var(--text-secondary);
    border: 0;
    padding: 8px;
    cursor: pointer;
}
.chat-mode {
    display: flex;
    gap: 6px;
    padding: 10px 14px;
    border: 0;
    border-bottom: 1px solid var(--border-color);
}
.chat-mode button {
    flex: 1;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 8px;
    background: transparent;
    color: var(--text-secondary);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
}
.chat-mode button[aria-pressed='true'] {
    background: #245037;
    border-color: #2dbe60;
    color: #b0edc6;
}
.intent-label {
    margin-left: 8px;
    font-size: 10px;
    color: var(--text-secondary);
}
.chat-transcript {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 18px;
}
.chat-welcome {
    padding: 35px 4px;
    text-align: center;
    color: var(--text-secondary);
}
.chat-welcome > i {
    font-size: 28px;
    color: #2dbe60;
}
.chat-welcome h3 {
    margin: 16px 0 10px;
    font-size: 16px;
}
.chat-welcome p {
    font-size: 13px;
    line-height: 1.7;
}
.chat-samples {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 22px;
}
.chat-samples button {
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-primary);
    cursor: pointer;
}
.chat-welcome .chat-model-notice {
    margin-top: 16px;
    font-size: 12px;
    color: var(--text-secondary);
}
.chat-message {
    margin-bottom: 22px;
}
.chat-role {
    font-size: 11px;
    color: var(--text-muted);
}
.evidence-badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 7px;
    border-radius: 10px;
    font-size: 10px;
    background: var(--input-bg);
    color: var(--text-secondary);
}
.evidence-badge.supported {
    background: #245037;
    color: #b0edc6;
}
.evidence-badge.partial {
    background: #594522;
    color: #f0d290;
}
.evidence-quote {
    margin-top: 10px;
    padding: 8px 10px;
    border-left: 3px solid #2dbe60;
    background: var(--input-bg);
    color: var(--text-secondary);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 12px;
    line-height: 1.6;
}
.chat-text {
    margin-top: 6px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 14px;
    line-height: 1.7;
}
.chat-message.user .chat-text {
    padding: 10px 13px;
    background: var(--selected-bg, #245037);
    border-radius: 10px;
}
.chat-sources {
    display: grid;
    gap: 8px;
    margin-top: 12px;
}
.chat-source {
    width: 100%;
    text-align: left;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 9px;
    background: var(--sidebar-bg);
    color: var(--text-primary);
    cursor: pointer;
}
.chat-source:hover {
    border-color: #2dbe60;
}
.chat-source strong {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.7;
}
.chat-source strong > span:first-of-type {
    flex: 1;
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
}
.chat-pending {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.7;
}
.chat-error {
    margin: 0 16px 8px;
    color: #ed9d9d;
    font-size: 12px;
}
.chat-form {
    display: grid;
    grid-template-columns: 1fr 38px;
    gap: 8px;
    padding: 14px;
    border-top: 1px solid var(--border-color);
}
.chat-form textarea {
    min-width: 0;
    resize: none;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 10px;
    background: var(--input-bg);
    color: var(--text-primary);
    font: inherit;
    font-size: 13px;
}
.chat-form button {
    align-self: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 50%;
    background: #207b43;
    color: white;
    cursor: pointer;
}
.chat-form small {
    grid-column: 1 / -1;
    color: var(--text-muted);
    font-size: 10px;
}
button:disabled {
    opacity: 0.45;
    cursor: default;
}
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
}
button:focus-visible,
textarea:focus-visible {
    outline: 2px solid #2dbe60;
    outline-offset: 2px;
}
@media (max-width: 767px) {
    .chat-panel {
        right: 8px;
        bottom: 8px;
        width: calc(100% - 16px);
        height: calc(100dvh - 16px);
    }
    .chat-launcher {
        bottom: 16px;
        right: 16px;
    }
}
</style>
