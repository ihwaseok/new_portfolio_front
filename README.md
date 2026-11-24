# new_portfolio_front — 새 노트 사이트·영상 데모 프런트엔드

## 목적

노트북 트리, 노트 목록, 본문을 보여주는 반응형 노트 열람 사이트입니다. `new_portfolio_back`의 메뉴·동기화 API를 호출하며, 별도 모드에서 CCTV·웹캠 영상과 외부 객체 인식 결과를 보여주는 데모 화면도 제공합니다.

## 기술 스택

- Vue 3, TypeScript, Vite 7, Vue Router
- Pinia를 통한 메뉴·노트·화면·소켓 상태 관리
- Fetch API를 통한 서버 통신
- `marked`를 이용한 Markdown 렌더링, Mermaid 다이어그램 표시
- PrimeIcons, CSS 기반 반응형 레이아웃
- WebSocket, WebRTC, MediaMTX 연동용 WHEP·WHIP 클라이언트

## 노트 기능의 동작 방식

1. 메인 화면 진입 시 Pinia 스토어가 전체 메뉴를 요청하고 부모 ID를 기준으로 트리를 구성합니다.
2. 폴더 선택 시 하위 노트를 요청하고, 검색어로 현재 목록의 제목을 필터링합니다.
3. 노트 선택 시 `VITE_CONTENT_ROOT`와 파일 경로를 조합해 정적 서버에서 Markdown 본문을 가져옵니다.
4. 본문을 HTML로 변환하고 Mermaid 코드 블록을 다이어그램으로 표시합니다.
5. 데스크톱에서는 트리·목록·본문을 나란히 배치하고, 모바일에서는 드로어와 목록·본문 전환으로 표시합니다.

API 주소와 인증 키는 `VITE_API_BASE_URL`, `VITE_API_AUTH_KEY`를 사용합니다. 기본으로 열 메뉴·노트도 환경변수로 지정할 수 있습니다.

## 영상 데모의 동작 방식

- CCTV 영상은 MediaMTX의 WHEP 주소에 WebRTC로 연결해 수신합니다.
- 웹캠은 브라우저의 `getUserMedia`로 확보한 후 WHIP로 MediaMTX에 송신하고 로컬 미리보기를 표시합니다.
- WebSocket으로 스트리밍 시작·종료 메시지를 전송하고 `AI_DETECTION` 메시지의 좌표·라벨을 받아 영상 위 Canvas에 인식 영역을 그립니다.
- 소켓 유틸리티는 연결 재시도, 대기 메시지 큐, 주기적인 PING을 처리합니다.

객체 인식 자체는 외부 서버에서 수행하는 구조입니다. 영상 기능에는 별도 MediaMTX와 WebSocket·분석 서버가 필요하며, 데모 코드의 연결 주소는 실행 환경에 맞게 조정해야 합니다.

**주요 파일:** [메인 화면](./src/views/MainView.vue), [노트 상태 관리](./src/stores/notesStore.ts), [노트 API 클라이언트](./src/api/notebooksApi.ts), [영상 데모](./src/components/VisionSample.vue), [WebRTC 유틸리티](./src/util/WebrtcUtil.ts)

## 기존 개발 안내

# vue-template

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
