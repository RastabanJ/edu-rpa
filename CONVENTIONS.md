# 교육행정 업무 자동화 (edu) — 코드 컨벤션

이 문서는 `RastabanJ/edu-rpa` 저장소에서 작업할 때 따르는 규칙을 정리한다.
변경하고 싶은 항목이 생기면 이 문서를 먼저 갱신하고 그 다음 코드를 바꾼다.

---

## 1. 브랜치 전략

| 브랜치 | 역할 | 푸시 권한 / 머지 출처 |
|---|---|---|
| `master` | 운영 트렁크 — `edu.rastabanj.com`에 배포되는 상태 | `development` 머지만 |
| `main` | GitHub 기본 트렁크 (초기 자동 생성, 비활성) | 보조 보관용. 통상 작업 안 함 |
| `development` | 통합 브랜치 — `dev-edu.rastabanj.com` 검증용 | `dev_Jonghyun` 등 작업 브랜치 머지 대상 |
| `dev_Jonghyun` | 주 작업 브랜치 | 자유 커밋 |
| `feature/*`, `fix/*` | 필요 시 단기 브랜치 | `dev_Jonghyun` 또는 `development`에서 분기 |

**작업 흐름**: `dev_Jonghyun`에서 작업 → 검증 → `development` 머지 → dev 환경에서 통합 테스트 → `master` 머지 → 운영 promote.

운영 promote는 `~/services/edu/`로 rsync 후 `docker compose up -d --build`.

---

## 2. 커밋 메시지

### 형식 (Conventional Commits 기반, 한국어 메시지)

```
<type>(<scope>): <한 줄 요약>

<본문 — 왜 변경했는지, 어떤 트레이드오프가 있었는지>

<footer — BREAKING CHANGE / 이슈 참조 등>
```

- 한 줄 요약은 **50자 이내**, 동사 원형 또는 명사구로 시작. 마침표 없음.
- 본문은 **why** 위주. what은 코드 diff가 설명함.
- 본문은 한 줄당 ~72자 줄바꿈.

### type

| type | 용도 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변화 없는 코드 정리 |
| `style` | 포매팅·세미콜론·들여쓰기 (의미 변화 없음) |
| `docs` | 문서만 변경 |
| `test` | 테스트 추가/수정 |
| `build` | 빌드 시스템·의존성 |
| `ci` | CI 설정 |
| `chore` | 그 외 잡일 (gitignore, scripts 등) |
| `perf` | 성능 개선 |

### scope (선택)

도구·영역 단위 키워드 — 비워도 되지만 있으면 검색·필터링이 쉬워진다.

자주 쓸 scope:
- `recruitment` — 대체채용 자동화 도구
- `platform` — 어댑터(웹/Electron 분기)
- `infra` — Docker / nginx / 배포 관련
- `ui` — 공통 UI/스타일
- `outputs` — 산출물 템플릿
- `compute` — 계산·포맷팅 로직
- `excel` — 엑셀 입출력

### 예시

```
feat(recruitment): 근로계약서 본문 산출물 추가

가이드 엑셀 image52~55에 PNG로 들어있던 본문을 텍스트 템플릿으로 옮김.
변수 치환으로 한 번에 9개 조항 + 서명란까지 생성되도록 함.
```

```
fix(ui): 고용보험 공제 체크박스가 입력 박스 스타일을 받아 깨지던 문제

.field-input input 셀렉터에 :not([type='checkbox']) 제외 조건 추가.
체크박스 전용 스타일을 별도 룰로 분리.
```

```
chore: gitignore에 dist/release/out 빌드 산출물 추가
```

### 금지

- `update`, `fix bug`, `wip` 같은 무의미한 메시지
- 한 커밋에 무관한 변경 두 가지 이상 (관심사 분리: 1 commit = 1 의도)
- 본문에서 "이 PR은…" 같은 표현 (커밋 메시지는 영구 기록, PR 컨텍스트와 분리)

---

## 3. 파일/디렉터리 구조

```
src/
├── main/                   # Electron main process (Node.js)
│   ├── index.ts            # 엔트리
│   ├── ipc.ts              # IPC 핸들러
│   ├── store.ts            # electron-store
│   ├── excel.ts            # 엑셀 파싱/생성
│   └── templates.ts        # (현재 미사용, 보존)
├── preload/                # Electron preload (contextBridge)
│   ├── index.ts
│   └── index.d.ts
└── renderer/               # React 앱 (Web/Electron 공통)
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── styles.css
        ├── types.ts        # 공통 타입
        ├── components/     # 도구 무관 공용 UI (Catalog, History 등)
        ├── lib/
        │   └── platform/   # 어댑터 분기 — 모든 환경 의존성은 여기서만
        └── tools/
            ├── registry.ts
            ├── types.ts
            └── <toolId>/   # 도구 1개 = 디렉터리 1개
                ├── index.tsx       # ToolModule export
                ├── ToolName.tsx    # 메인 컴포넌트
                ├── inputs.ts       # 입력 타입/메타데이터/검증
                ├── compute.ts      # 파생값 계산/포맷팅 (순수 함수)
                ├── outputs.ts      # Handlebars 템플릿 + 렌더
                └── FormFields.tsx  # 도구 전용 UI 부속
```

### 원칙

1. **도구는 폴더 단위로 자기완결**. 외부에서 `tools/<id>`만 import. 도구간 직접 의존 금지.
2. **`main` ↔ `renderer` 직접 import 금지**. preload IPC 또는 어댑터를 통해서만 통신.
3. **renderer에서 환경 분기는 `lib/platform`에서만**. 컴포넌트는 `platform.xxx` 호출.
4. **`window.api.*` 직접 호출 금지** — 항상 `platform.*` 경유.

---

## 4. TypeScript 스타일

### 일반

- `strict: true` 유지. `any` 금지. `unknown` + 타입 가드 사용.
- `interface` 보다 `type` (확장이 단순, 일관성).
- export는 named export 기본. default export는 피함.
- 함수 컴포넌트 반환 타입은 `JSX.Element` 명시.

### 네이밍

| 항목 | 규칙 | 예 |
|---|---|---|
| 컴포넌트 | PascalCase | `OutputCard`, `FieldGroup` |
| 함수/변수 | camelCase | `renderOutputs`, `handleNext` |
| 타입/인터페이스 | PascalCase | `ReplacementInputs`, `RenderedOutput` |
| 상수 (모듈 스코프) | UPPER_SNAKE | `DEFAULT_INPUTS`, `INPUT_GROUPS` |
| 파일 — 컴포넌트 | PascalCase.tsx | `RecruitmentTool.tsx` |
| 파일 — 로직/타입 | camelCase.ts | `compute.ts`, `inputs.ts` |
| 필드 키 | 영문 camelCase | `subName`, `contractStart` |
| 사용자에 보이는 라벨 | 한국어 | `'성명'`, `'계약 시작일'` |

### 모듈

- import 순서: ① 외부 패키지 → ② 절대 경로 → ② 상대 경로. 그룹 간 빈 줄.
- 같은 디렉터리 import는 `./` 사용, 한 단계 위는 `../`.
- 별도 경로 별칭 추가 금지 (`@renderer`는 이미 있음).

### React

- hooks는 함수 최상단에 묶음. 조건부 호출 금지.
- side effect는 `useEffect`에. 동기 setState chain 금지.
- 큰 컴포넌트는 같은 파일 안에서 보조 컴포넌트로 분리 (별 파일까지 안 가도 됨).
- prop drilling 2단계 이상이면 context 검토.

---

## 5. UI/스타일

- 모든 사용자 텍스트는 **한국어**.
- 비개발자 사용자 기준 — 라벨은 명확하고 짧게.
- 색상/spacing/border-radius는 `styles.css`의 CSS 변수(`--primary`, `--border` 등) 재사용. 인라인 스타일 지양.
- 아이콘은 이모지 직접 사용 (`📄`, `🕘`). 별도 아이콘 라이브러리 추가하지 않음.
- 새 CSS 클래스는 BEM 비슷하게 `.block` / `.block-element` / `.block.modifier` 형태.

---

## 6. 산출물 템플릿 (도구별)

- Handlebars 사용. 템플릿 본문은 `outputs.ts`에 문자열 상수로.
- 변수는 `{{f.xxx}}` (포맷된 값) / `{{xxx}}` (원본) 명확히 구분 — `buildContext`의 `f` 속성에 포맷 결과를 모음.
- 표 형식 산출물은 텍스트 본문(`body`) + 엑셀 빌더(`excelBuilder`) 둘 다 제공.
- 카테고리: `draft` / `sms` / `row` / `table` / `contract` — 색상 매핑은 `styles.css`의 `.output-cat.cat-*`.

---

## 7. 외부 통신 / 데이터 정책

1. **외부 API 호출 절대 금지**. 모든 처리는 클라이언트 사이드.
2. 영속 데이터:
   - Electron — `electron-store` (`recruitmentDefaults`, `runs` 키)
   - Web — `localStorage` (`edu:recruitmentDefaults`, `edu:recruitmentDefaults`)
3. 민감 정보(주민번호 등)는 화면 표시 시 마스킹 (`maskRRN`, `maskName`). 저장은 평문이지만 로컬 한정.
4. 의존성 추가 시 라이센스/번들 사이즈 검토. 외부 네트워크 호출 라이브러리는 거부.

---

## 8. 빌드/배포

### 명령

| 명령 | 용도 |
|---|---|
| `npm run dev` | Electron dev (HMR) |
| `npm run dev:web` | Web dev 서버 (포트 5173) |
| `npm run typecheck` | TypeScript 검사 |
| `npm run build:web` | 정적 Web 빌드 → `dist/` |
| `npm run pack -- --win --x64` | Windows Electron 빌드 → `release/win-unpacked/` |
| `docker compose up -d --build` | dev/prod 컨테이너 빌드+기동 |

### 게이트

머지/배포 전 반드시:
1. `npm run typecheck` 통과
2. Web 또는 Electron 빌드 성공 (변경 영역에 따라)
3. dev 환경에서 1건 이상 시나리오 수동 검증

---

## 9. PR / 코드 리뷰

- 작업 단위가 작으면 직접 `development`에 머지해도 OK.
- 흐름/구조가 바뀌는 변경은 PR 만들어 리뷰.
- PR 제목은 커밋 메시지 한 줄 요약 형식 그대로.
- PR 본문에 **무엇이 바뀌었는지** + **어떻게 검증했는지** 두 섹션.

---

## 10. 새 도구 추가 절차

1. `src/renderer/src/tools/<toolId>/` 디렉터리 생성
2. `index.tsx` — `ToolModule` export
3. `ToolName.tsx` — 메인 컴포넌트
4. `inputs.ts` / `compute.ts` / `outputs.ts` 등 도구 내 분리
5. `src/renderer/src/tools/registry.ts`에 등록 (`available: true`)
6. 첫 사용자 입력 → 산출물 카드 표시까지 동작 확인
7. 도구 이름·아이콘·설명은 `index.tsx`에서 한 곳에서만 정의

---

## 11. 의도하지 않은 결정 / 회피

- **테스트 코드는 아직 없음**. 추가하면 `*.test.ts` 동일 디렉터리, `vitest` 도입.
- **린트/포맷 자동화 없음**. 추후 `eslint` + `prettier` 도입 시 `style:` 커밋 별도.
- **자동 배포 파이프라인 없음**. CI 도입 시 `master` push → 운영 promote 스크립트 후보.
- **electron-store ↔ localStorage 동기화 없음**. Web/Electron 데이터는 분리된 상태.

---

이 컨벤션을 깨야 할 사정이 생기면 PR 본문에 사유를 남기고 머지. 반복되면 이 문서를 갱신.
