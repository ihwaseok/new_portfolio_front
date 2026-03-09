// ── 기존 노트 ─────────────────────────────────────────────
import vueCompositionApi from './notes/vue-composition-api.md?raw'
import vueRouter from './notes/vue-router.md?raw'
import pinia from './notes/pinia.md?raw'
import cssGrid from './notes/css-grid.md?raw'
import cssVariables from './notes/css-variables.md?raw'
import expressNote from './notes/express.md?raw'
import sql from './notes/sql.md?raw'
import meetingMarch from './notes/meeting-march.md?raw'
import designReview from './notes/design-review.md?raw'
import projectPlan from './notes/project-plan.md?raw'
import cleanCode from './notes/clean-code.md?raw'
import principles from './notes/principles.md?raw'
import weeklyReview from './notes/weekly-review.md?raw'

// ── 신규 노트 ─────────────────────────────────────────────
import algorithmSort from './notes/algorithm-sort.md?raw'
import dataStructure from './notes/data-structure.md?raw'
import bigO from './notes/big-o.md?raw'
import dockerBasics from './notes/docker-basics.md?raw'
import gitWorkflow from './notes/git-workflow.md?raw'
import ciCd from './notes/ci-cd.md?raw'
import typescriptAdvanced from './notes/typescript-advanced.md?raw'
import javascriptCore from './notes/javascript-core.md?raw'
import reactHooks from './notes/react-hooks.md?raw'
import restApiDesign from './notes/rest-api-design.md?raw'
import meetingQ1Review from './notes/meeting-q1-review.md?raw'
import sprintPlanning from './notes/sprint-planning.md?raw'
import bookAtomicHabits from './notes/book-atomic-habits.md?raw'
import travelJapan from './notes/travel-japan.md?raw'
import fitnessLog from './notes/fitness-log.md?raw'
import linuxCommands from './notes/linux-commands.md?raw'

export interface Notebook {
  id: string
  title: string
  icon: string
  children?: Notebook[]
}

export interface Note {
  id: string
  notebookId: string
  title: string
  updatedAt: string
  content: string
}

export const notebooks: Notebook[] = [
  {
    id: 'dev',
    title: '개발 노트',
    icon: '💻',
    children: [
      {
        id: 'dev-frontend',
        title: 'Frontend',
        icon: '🎨',
        children: [
          { id: 'dev-frontend-vue', title: 'Vue.js', icon: '📁' },
          { id: 'dev-frontend-react', title: 'React', icon: '📁' },
          { id: 'dev-frontend-css', title: 'CSS & Design', icon: '📁' },
        ],
      },
      {
        id: 'dev-backend',
        title: 'Backend',
        icon: '🖥️',
        children: [
          { id: 'dev-backend-node', title: 'Node.js', icon: '📁' },
          { id: 'dev-backend-db', title: 'Database', icon: '📁' },
          { id: 'dev-backend-api', title: 'API 설계', icon: '📁' },
        ],
      },
      {
        id: 'dev-cs',
        title: 'CS 기초',
        icon: '🧠',
        children: [
          { id: 'dev-cs-algo', title: '알고리즘', icon: '📁' },
          { id: 'dev-cs-ds', title: '자료구조', icon: '📁' },
        ],
      },
      {
        id: 'dev-devops',
        title: 'DevOps',
        icon: '⚙️',
        children: [
          { id: 'dev-devops-docker', title: 'Docker', icon: '📁' },
          { id: 'dev-devops-git', title: 'Git', icon: '📁' },
          { id: 'dev-devops-cicd', title: 'CI/CD', icon: '📁' },
        ],
      },
    ],
  },
  {
    id: 'study',
    title: '스터디',
    icon: '📚',
    children: [
      { id: 'study-js', title: 'JavaScript', icon: '📁' },
      { id: 'study-ts', title: 'TypeScript', icon: '📁' },
      { id: 'study-linux', title: 'Linux', icon: '📁' },
    ],
  },
  {
    id: 'work',
    title: '업무',
    icon: '💼',
    children: [
      { id: 'work-meeting', title: '회의록', icon: '📁' },
      { id: 'work-project', title: '프로젝트 계획', icon: '📁' },
      { id: 'work-sprint', title: '스프린트', icon: '📁' },
    ],
  },
  {
    id: 'personal',
    title: '개인',
    icon: '🌱',
    children: [
      { id: 'personal-reading', title: '독서 기록', icon: '📁' },
      { id: 'personal-daily', title: '일상', icon: '📁' },
      { id: 'personal-travel', title: '여행', icon: '📁' },
      { id: 'personal-health', title: '건강 & 운동', icon: '📁' },
    ],
  },
]

export const notes: Note[] = [
  // ── Vue.js ────────────────────────────────────────────
  {
    id: 'note-vue-1',
    notebookId: 'dev-frontend-vue',
    title: 'Vue 3 Composition API 가이드',
    updatedAt: '2024-03-05',
    content: vueCompositionApi,
  },
  {
    id: 'note-vue-2',
    notebookId: 'dev-frontend-vue',
    title: 'Vue Router 5 기초',
    updatedAt: '2024-03-04',
    content: vueRouter,
  },
  {
    id: 'note-vue-3',
    notebookId: 'dev-frontend-vue',
    title: 'Pinia 상태관리',
    updatedAt: '2024-03-02',
    content: pinia,
  },

  // ── React ─────────────────────────────────────────────
  {
    id: 'note-react-1',
    notebookId: 'dev-frontend-react',
    title: 'React Hooks 정리',
    updatedAt: '2024-03-06',
    content: reactHooks,
  },

  // ── CSS & Design ──────────────────────────────────────
  {
    id: 'note-css-1',
    notebookId: 'dev-frontend-css',
    title: 'CSS Grid 레이아웃',
    updatedAt: '2024-03-01',
    content: cssGrid,
  },
  {
    id: 'note-css-2',
    notebookId: 'dev-frontend-css',
    title: 'CSS 변수 (Custom Properties)',
    updatedAt: '2024-02-28',
    content: cssVariables,
  },

  // ── Node.js ───────────────────────────────────────────
  {
    id: 'note-node-1',
    notebookId: 'dev-backend-node',
    title: 'Express.js 기초',
    updatedAt: '2024-02-25',
    content: expressNote,
  },

  // ── Database ──────────────────────────────────────────
  {
    id: 'note-db-1',
    notebookId: 'dev-backend-db',
    title: 'SQL 기초 쿼리',
    updatedAt: '2024-02-20',
    content: sql,
  },

  // ── API 설계 ──────────────────────────────────────────
  {
    id: 'note-api-1',
    notebookId: 'dev-backend-api',
    title: 'REST API 설계 원칙',
    updatedAt: '2024-03-08',
    content: restApiDesign,
  },

  // ── 알고리즘 ──────────────────────────────────────────
  {
    id: 'note-algo-1',
    notebookId: 'dev-cs-algo',
    title: '정렬 알고리즘',
    updatedAt: '2024-03-03',
    content: algorithmSort,
  },
  {
    id: 'note-algo-2',
    notebookId: 'dev-cs-algo',
    title: 'Big-O 표기법',
    updatedAt: '2024-02-29',
    content: bigO,
  },

  // ── 자료구조 ──────────────────────────────────────────
  {
    id: 'note-ds-1',
    notebookId: 'dev-cs-ds',
    title: '자료구조 기초 (스택/큐/연결리스트)',
    updatedAt: '2024-03-01',
    content: dataStructure,
  },

  // ── Docker ────────────────────────────────────────────
  {
    id: 'note-docker-1',
    notebookId: 'dev-devops-docker',
    title: 'Docker 기초',
    updatedAt: '2024-03-07',
    content: dockerBasics,
  },

  // ── Git ───────────────────────────────────────────────
  {
    id: 'note-git-1',
    notebookId: 'dev-devops-git',
    title: 'Git 협업 워크플로우',
    updatedAt: '2024-03-05',
    content: gitWorkflow,
  },

  // ── CI/CD ─────────────────────────────────────────────
  {
    id: 'note-cicd-1',
    notebookId: 'dev-devops-cicd',
    title: 'CI/CD 파이프라인 (GitHub Actions)',
    updatedAt: '2024-03-04',
    content: ciCd,
  },

  // ── JavaScript 스터디 ─────────────────────────────────
  {
    id: 'note-js-1',
    notebookId: 'study-js',
    title: 'JavaScript 핵심 개념',
    updatedAt: '2024-03-09',
    content: javascriptCore,
  },

  // ── TypeScript 스터디 ─────────────────────────────────
  {
    id: 'note-ts-1',
    notebookId: 'study-ts',
    title: 'TypeScript 유틸리티 타입',
    updatedAt: '2024-03-08',
    content: typescriptAdvanced,
  },

  // ── Linux 스터디 ──────────────────────────────────────
  {
    id: 'note-linux-1',
    notebookId: 'study-linux',
    title: '리눅스 명령어 치트시트',
    updatedAt: '2024-03-06',
    content: linuxCommands,
  },

  // ── 회의록 ────────────────────────────────────────────
  {
    id: 'note-meeting-1',
    notebookId: 'work-meeting',
    title: '2024년 3월 주간 회의',
    updatedAt: '2024-03-06',
    content: meetingMarch,
  },
  {
    id: 'note-meeting-2',
    notebookId: 'work-meeting',
    title: '디자인 리뷰 회의',
    updatedAt: '2024-03-03',
    content: designReview,
  },
  {
    id: 'note-meeting-3',
    notebookId: 'work-meeting',
    title: '2024 Q1 분기 리뷰',
    updatedAt: '2024-03-29',
    content: meetingQ1Review,
  },

  // ── 프로젝트 계획 ─────────────────────────────────────
  {
    id: 'note-project-1',
    notebookId: 'work-project',
    title: '노트 퍼블리싱 사이트 계획',
    updatedAt: '2024-03-07',
    content: projectPlan,
  },

  // ── 스프린트 ──────────────────────────────────────────
  {
    id: 'note-sprint-1',
    notebookId: 'work-sprint',
    title: 'Sprint 12 계획',
    updatedAt: '2024-03-10',
    content: sprintPlanning,
  },

  // ── 독서 기록 ─────────────────────────────────────────
  {
    id: 'note-reading-1',
    notebookId: 'personal-reading',
    title: '클린 코드 (로버트 마틴)',
    updatedAt: '2024-03-01',
    content: cleanCode,
  },
  {
    id: 'note-reading-2',
    notebookId: 'personal-reading',
    title: '원칙 (레이 달리오)',
    updatedAt: '2024-02-15',
    content: principles,
  },
  {
    id: 'note-reading-3',
    notebookId: 'personal-reading',
    title: '아주 작은 습관의 힘 (제임스 클리어)',
    updatedAt: '2024-01-31',
    content: bookAtomicHabits,
  },

  // ── 일상 ──────────────────────────────────────────────
  {
    id: 'note-daily-1',
    notebookId: 'personal-daily',
    title: '3월 첫째 주 회고',
    updatedAt: '2024-03-07',
    content: weeklyReview,
  },

  // ── 여행 ──────────────────────────────────────────────
  {
    id: 'note-travel-1',
    notebookId: 'personal-travel',
    title: '오사카·교토 여행 기록',
    updatedAt: '2024-02-27',
    content: travelJapan,
  },

  // ── 건강 & 운동 ───────────────────────────────────────
  {
    id: 'note-fitness-1',
    notebookId: 'personal-health',
    title: '운동 기록 & 루틴',
    updatedAt: '2024-03-09',
    content: fitnessLog,
  },
]
