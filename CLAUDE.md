# CLAUDE.md — edu (교육행정 업무 자동화) / 개발 짝

이 디렉터리는 **`dev-edu.rastabanj.com`을 서빙하는 개발용 코드 트리**이자
Electron 데스크톱 빌드의 단일 출처(SoT)다.

운영 짝은 `~/services/edu/` — 같은 코드가 rsync로 promote 된 사본,
`edu.rastabanj.com`을 서빙한다.

> **공통 인프라/인증서/도메인 컨벤션**: `~/infra/nginx/CLAUDE.md` 가 SoT.
> 이 파일은 그것을 중복하지 않고 **edu 프로젝트 자체**만 적는다.

> **코드 스타일/커밋/브랜치 규약**: `./CONVENTIONS.md` 가 SoT.
> 이 파일은 그것을 중복하지 않고 **why / 운영 상태 / 함정**만 적는다.

---

## 0. 한 줄 요약

| 항목 | 값 |
|---|---|
| 정체성 | 사내 비개발자용 행정 업무 자동화 도구 플랫폼 (확장형) |
| 기술 스택 | React 18 + TypeScript + Electron 31 + electron-vite + Vite 5 + Handlebars + SheetJS |
| 산출 형태 | (a) Web 정적 빌드 → nginx 컨테이너 / (b) Electron Windows 데스크톱 빌드 |
| Web 도메인 | `edu.rastabanj.com` (운영) · `dev-edu.rastabanj.com` (개발) |
| 컨테이너 | `edu` (`edu:prod`) · `edu_dev` (`edu:dev`) — `proxy` external network alias 동일 |
| 인증서 | 각각 분리 발급, 만료 2026-09-27 |
| Electron 빌드 | `~/rastabanj_workspace/edu/release/win-unpacked/교육행정 업무 자동화.exe` |
| Windows 테스트 배포 | `C:\Users\RASTABAN\Desktop\rpa-app-test\` |
| 외부 API | **없음**. 모든 처리는 클라이언트 사이드. 영속은 electron-store / localStorage |
| Git 원격 | `git@github.com:RastabanJ/edu-rpa.git` (이 디렉터리만 추적, `~/services/edu/`는 git 미적용 사본) |
| 주 작업 브랜치 | `dev_Jonghyun` |

---

## 1. 강한 규칙 — NEVER / ALWAYS (이 프로젝트 한정)

### NEVER

1. **`~/services/edu/`를 직접 수정해서 배포하지 않는다.** 변경은 항상 dev → prod 일방향.
   workspace에서 검증 → promote.
2. **운영 promote 시 `docker-compose.yml`을 덮어쓰지 않는다.** dev compose는
   `DEV_BANNER=1`, name/container/alias가 `edu_dev`. prod와 다르다.
   rsync `--exclude='docker-compose.yml'` 필수.
3. **`window.api.*`를 컴포넌트에서 직접 호출하지 않는다.** 항상 `import { platform } from './lib/platform'` 경유.
   web 빌드에서는 `window.api`가 존재하지 않는다.
4. **외부 네트워크 호출(fetch/axios) 추가 금지.** 모든 데이터는 클라이언트 사이드.
   추가가 필요하면 그 자체가 큰 결정 — 별도 합의 필요.
5. **`preload/index.d.ts` 삭제 / `window.api` 타입을 잘라내지 않는다.**
   electron 빌드에서 컴파일 깨짐.
6. **도구 ID (`toolId`)를 바꾸지 않는다.** 히스토리/electron-store 키와 묶여 있어
   이전 사용자 데이터를 못 읽게 된다 (현재 `recruitment-docs`).
7. **`name`/`appId`/`store.name` 한글 변경 금지.** Windows NSIS 인스톨러·식별자가 한글이면 깨짐.
   사용자 표시명은 `productName`("교육행정 업무 자동화")만 한글.
8. **인증서 없는 상태에서 nginx 443 server block 활성화 금지.** 발급 절차는
   `~/infra/nginx/CLAUDE.md` NEVER #2 참조.
9. **xlsx 라이브러리를 main process 번들에 포함시키지 않는다.**
   electron-vite `externalizeDepsPlugin`이 외부화 — `dependencies`에 두어야 함.
   번들되면 dynamic require가 깨진다.
10. **인증서·빌드 산출물·node_modules를 git에 올리지 않는다.** `.gitignore` 차단되어 있음.

### ALWAYS

1. **개발 변경은 `dev_Jonghyun` 브랜치에서.** development → master 흐름은 `CONVENTIONS.md`.
2. **로컬 검증 순서**: `npm run typecheck` → 변경 영역에 따라 `build:web` 또는 `pack` → dev 컨테이너 갱신.
3. **dev 컨테이너 갱신**:
   ```bash
   cd ~/rastabanj_workspace/edu && docker compose up -d --build
   ```
   `docker-compose.yml`이 `build: .`로 multi-stage Dockerfile을 그대로 빌드 — 코드 변경이 컨테이너에 반영됨.
4. **운영 promote 절차 (`~/services/edu/` 갱신)**:
   ```bash
   rsync -a \
     --exclude=node_modules --exclude=release --exclude=out --exclude=dist \
     --exclude='*.tsbuildinfo' --exclude='.git' \
     --exclude='docker-compose.yml' \
     ~/rastabanj_workspace/edu/ ~/services/edu/
   cd ~/services/edu && docker compose up -d --build
   ```
5. **외부 검증**: `curl -sI https://edu.rastabanj.com` 와 `https://dev-edu.rastabanj.com` 둘 다 `HTTP/2 200`.
   prod 응답 body의 `<title>`은 `[DEV]` prefix가 **없어야** 함.
6. **Electron 빌드 후 데스크톱 동기화**:
   ```bash
   npm run pack -- --win --x64
   rm -rf /mnt/c/Users/RASTABAN/Desktop/rpa-app-test
   cp -r release/win-unpacked /mnt/c/Users/RASTABAN/Desktop/rpa-app-test
   ```
   Windows에서 exe 실행 중이면 dll 잠금으로 복사 실패 — 종료 후 진행.

---

## 2. 현재 상태 스냅샷 (작성: 2026-06-30)

### Docker

| 컨테이너 | 이미지 | 도메인 | 비고 |
|---|---|---|---|
| `edu` | `edu:prod` | `edu.rastabanj.com` | `proxy` alias `edu`, DEV_BANNER 없음 |
| `edu_dev` | `edu:dev` | `dev-edu.rastabanj.com` | `proxy` alias `edu_dev`, `[DEV]` title prefix |

둘 다 nginx:stable-alpine 베이스 + 정적 SPA(`/usr/share/nginx/html`) 서빙. expose 80 (호스트 포트 미노출).

### 인증서

| cert-name | 만료 | conf |
|---|---|---|
| `edu.rastabanj.com` | 2026-09-27 | `~/infra/nginx/conf.d/edu.rastabanj.com.conf` |
| `dev-edu.rastabanj.com` | 2026-09-27 | `~/infra/nginx/conf.d/dev-edu.rastabanj.com.conf` |

갱신: 만료 30일 전부터 `~/infra/nginx/scripts/renew-cert.sh` 수동 실행.

### 빌드 산출물

| 산출물 | 경로 | 명령 |
|---|---|---|
| Web (정적) | `dist/` | `npm run build:web` |
| Electron main/preload/renderer | `out/` | `npm run build` (electron-vite) |
| Electron unpacked | `release/win-unpacked/` | `npm run pack -- --win --x64` |
| Electron NSIS 설치 파일 | `release/` (미생성) | `npm run dist` |

### 브랜치 (origin GitHub)

```
master         운영 트렁크
main           초기 자동 생성 (보조 보관용)
development    통합 검증
dev_Jonghyun   ★ 주 작업 브랜치
```

---

## 3. 디렉터리 / 파일 구조

```
~/rastabanj_workspace/edu/
├── CLAUDE.md                       # 이 파일
├── CONVENTIONS.md                  # 코드 스타일/커밋/브랜치 규약
├── package.json                    # name: "rpa-app" (영문 유지), productName: "교육행정 업무 자동화"
├── electron.vite.config.ts         # Electron 빌드 (main + preload + renderer)
├── vite.config.web.ts              # Web 단독 빌드 — VITE_TARGET="web" define
├── tsconfig.{json,node,web}.json
├── Dockerfile                      # multi-stage: node:20 빌드 → nginx:stable-alpine 서빙
├── docker-compose.yml              # dev 전용 — name/container/alias = edu_dev, DEV_BANNER=1
├── .dockerignore
├── .gitignore
├── sample/                         # 입력 양식 + 가이드 엑셀 (git tracked, 가짜 데이터)
└── src/
    ├── main/                       # Electron main process (Node.js)
    │   ├── index.ts                # 엔트리, BrowserWindow 생성
    │   ├── ipc.ts                  # ipcMain.handle 채널 정의
    │   ├── store.ts                # electron-store (recruitmentDefaults, runs 키)
    │   ├── excel.ts                # parseExcel + buildSampleWorkbook + buildWorkbookFromSpec
    │   └── templates.ts            # DEFAULT_TEMPLATES = [] (예전 잔재, 보존)
    ├── preload/
    │   ├── index.ts                # contextBridge.exposeInMainWorld('api', ...)
    │   └── index.d.ts              # declare global { interface Window { api: Api } }
    └── renderer/                   # React 앱 (Electron + Web 공통)
        ├── index.html              # <title> 정적, CSP 'unsafe-eval' (Handlebars용)
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── styles.css          # CSS 변수(:root) + 컴포넌트 스타일
            ├── types.ts            # ParsedRow/Sheet, Template, Run, NewRun
            ├── components/
            │   ├── ToolCatalog.tsx
            │   └── HistoryPanel.tsx
            ├── lib/
            │   └── platform/       # ★ 환경 분기 어댑터
            │       ├── types.ts    # PlatformAdapter 인터페이스 (12 함수)
            │       ├── electron.ts # window.api.* 위임
            │       ├── web.ts      # xlsx + localStorage + Blob + navigator.clipboard
            │       └── index.ts    # import.meta.env.VITE_TARGET === 'web' ? web : electron
            └── tools/
                ├── registry.ts     # TOOLS 배열
                ├── types.ts        # ToolModule, ToolContext
                └── recruitment/    # 대체 채용 자동화 도구
                    ├── index.tsx           # ToolModule export
                    ├── RecruitmentTool.tsx # 메인 컴포넌트 (Step 1 입력 / Step 2 산출물 + ProcessSidebar)
                    ├── inputs.ts           # ReplacementInputs 타입 + INPUT_GROUPS(6그룹 34필드) + 검증 + 엑셀 매핑
                    ├── compute.ts          # 임금/공제/실수령/기관부담금 계산 + 포맷팅 헬퍼 + buildContext
                    ├── outputs.ts          # OUTPUT_TEMPLATES (10종) + renderOutputs + excelBuilder
                    └── FormFields.tsx      # FieldGroup, FieldInput, OutputCard
```

---

## 4. 결정 배경 — "왜 이렇게 했는가"

### 4.1 Electron + Web 듀얼 빌드, 한 코드베이스

**선택**: `src/renderer/`를 Web/Electron 양쪽에서 그대로 사용. 환경 의존(`window.api`/`electron-store`)은 `src/renderer/src/lib/platform/` 어댑터로 추상화.

**이유**:
- Electron exe는 폐쇄망/오프라인 PC, Web은 누구나 접근 가능한 사내 도구. 둘 다 같은 사용자 그룹이 쓰므로 기능 동기화가 필요.
- 어댑터 추출이 작은 한 번의 비용(11 호출 지점)이면 듀얼 빌드가 영구히 가능.
- 빌드 분기: Vite `define`으로 `import.meta.env.VITE_TARGET` 빌드 시점 inline → 런타임 분기. tree-shake는 안 됨(두 어댑터 모두 번들), 호출만 라우팅. Web 번들이 ~470KB → ~470KB로 미미.

### 4.2 `vite.config.web.ts` 분리 (electron-vite와 별도)

**선택**: Web 빌드는 `vite build -c vite.config.web.ts`로 renderer만 빌드.

**이유**:
- electron-vite는 main/preload/renderer를 묶어 빌드 — Web에는 main/preload 불필요.
- electron-vite를 web mode로 우회시키는 건 hack. 별도 vite config 가 정직.
- `root: src/renderer` + `outDir: dist`로 단순 SPA 빌드. `define`으로 `VITE_TARGET="web"`만 주입.

### 4.3 Docker multi-stage (node 빌드 → nginx serve)

**선택**: `Dockerfile`이 자체에서 `npm run build:web` 실행 후 결과를 nginx에 복사.

**이유**:
- 호스트에서 build 산출물을 마운트하는 방식보다 재현 가능성·이식성 우위.
- dev/prod 차이는 build arg(`DEV_BANNER`)로만 분리. 동일 Dockerfile.
- `.dockerignore`로 node_modules/dist/release/out 제외 → context 작음.

### 4.4 dev/prod 식별자 완전 분리

**선택**: name=edu/edu_dev, container_name 동일, alias 동일, image tag(`edu:prod`/`edu:dev`)도 분리.

**이유**:
- `~/infra/nginx/CLAUDE.md §2.5`의 원칙. 한 식별자라도 같으면 다른 쪽 컨테이너를 가로채는 사고 발생 가능 (landing_page 사례).
- DEV_BANNER로 `<title>`에 `[DEV]` prefix까지 시각 분리 → 운영 화면을 dev로 착각 방지.

### 4.5 운영 promote 방식: rsync + compose up

**선택**: workspace 검증 후 `~/services/edu/`로 rsync, compose 파일은 prod 측을 보존(rsync 제외), `docker compose up -d --build`.

**이유**:
- landing_page 패턴 일치 (운영은 ~/services에서, html만 갈아끼움).
- git pull 방식보다 단순 (운영 측 git 미적용 — 운영 사고 시 dev/prod 동기화 차이로 인한 혼란 차단).
- compose 파일은 dev/prod별 식별자/banner가 다르므로 절대 동기화 안 됨.

### 4.6 외부 API 폐기 → 공개 웹

**상황**: 초기에는 폐쇄망 가정(electron-store + 외부 API 금지)이었으나, Web 배포로 전환하면서 공개 도메인 노출.

**현재 결정**:
- 백엔드는 여전히 없음. 모든 처리는 클라이언트 사이드.
- 영속 데이터는 환경별로 분리: Electron `electron-store`, Web `localStorage` (`edu:` prefix).
- 민감 입력(주민번호 등) 마스킹 함수(`maskRRN`, `maskName`)로 산출물 표시 시점 차단.
- 사용자 계정/공유 데이터 필요 시 별도 백엔드 결정 (지금은 device-local).

### 4.7 폼 필드 라벨 vs 엑셀 컬럼명 분리 (`excelLabel`)

**선택**: 원근로자 그룹의 `직종/성명/생년월일`은 대체근로자와 충돌 → 폼 라벨은 그대로(`'직종'`), 엑셀 컬럼명만 `'원근로자 직종'` 등으로 prefix.

**이유**:
- 폼 UI는 그룹 카드 안이라 prefix 없이도 명확.
- 엑셀 가로 양식은 컬럼명만으로 식별해야 하므로 unique 필요.
- `FieldDef.excelLabel?` 옵션으로 충돌 필드만 명시.

### 4.8 가로 엑셀 양식 + `(예시)` 첫 행 skip

**선택**: 헤더 1행 / `(예시) ...` 데이터 2행 / 빈 행 3~5. 업로드 시 셀에 `(예시)`가 포함된 행은 자동 skip, 첫 유효 데이터 행만 폼에 반영.

**이유**:
- 사용자가 row만 추가하면 여러 명 처리로 확장 가능한 구조 마련 (현재는 단건 처리만, 향후 일괄 처리 옵션).
- 예시값을 양식 안에 보존해서 사용자가 형식 추정에 활용.

### 4.9 임금 계산 — 가벼운 산식

**현재**:
- 임금 총액 = 시급 × 시간 × 일수
- 공제액 = `floor10(임금총액 × 실업급여요율)` (요율 기본 0.009)
- 실수령액 = 임금총액 − 공제액
- 기관부담금 = `Math.round(임금총액 × 기관부담금요율)` (요율 기본 0.0085)

**주의**: 기관부담금 실제 산식은 사용자가 추후 보강 예정. 가이드 엑셀 row 88-89의 1,790원이 0.0085 단순 곱셈(875)과 일치하지 않음 — 보강 시 `compute.ts`의 해당 줄만 수정.

---

## 5. 자주 하는 작업

### 5.1 새 세션 시작 체크리스트

```bash
# 컨테이너/네트워크 상태
docker ps --filter name='^edu' --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
docker network inspect proxy --format '{{range .Containers}}{{.Name}} {{end}}' | grep -o 'edu[^ ]*'

# 외부 응답
curl -sI https://dev-edu.rastabanj.com/ | head -1
curl -sI https://edu.rastabanj.com/ | head -1

# 인증서 만료
docker exec infra-nginx ls /etc/letsencrypt/live/ | grep edu

# 현재 브랜치
cd ~/rastabanj_workspace/edu && git status -sb

# workspace ↔ services 차이 (compose 제외)
diff -rq --exclude=node_modules --exclude=release --exclude=out --exclude=dist \
  --exclude='*.tsbuildinfo' --exclude='.git' --exclude=docker-compose.yml \
  ~/rastabanj_workspace/edu/ ~/services/edu/ 2>/dev/null | head -10
```

### 5.2 코드 수정 → dev 반영

```bash
cd ~/rastabanj_workspace/edu
# 작업 (dev_Jonghyun 브랜치)
npm run typecheck
docker compose up -d --build     # 컨테이너 재빌드 + 재기동
curl -sI https://dev-edu.rastabanj.com/ | head -3
```

### 5.3 dev → 운영 promote

```bash
# 1) workspace 변경 사항이 development/master로 머지된 후
rsync -a \
  --exclude=node_modules --exclude=release --exclude=out --exclude=dist \
  --exclude='*.tsbuildinfo' --exclude='.git' \
  --exclude='docker-compose.yml' \
  ~/rastabanj_workspace/edu/ ~/services/edu/

# 2) 운영 컨테이너 재빌드
cd ~/services/edu && docker compose up -d --build

# 3) 검증
curl -sI https://edu.rastabanj.com/ | head -3
curl -s https://edu.rastabanj.com/ | grep -i title   # [DEV] 없어야 함
```

### 5.4 Electron exe 빌드 + Windows 데스크톱 동기화

```bash
cd ~/rastabanj_workspace/edu
npm run pack -- --win --x64
# Windows에서 앱 실행 중이면 종료 요청
rm -rf /mnt/c/Users/RASTABAN/Desktop/rpa-app-test
cp -r release/win-unpacked /mnt/c/Users/RASTABAN/Desktop/rpa-app-test
```

### 5.5 새 도구 추가

`CONVENTIONS.md §10` 참조. 요약:
1. `src/renderer/src/tools/<toolId>/` 생성 (`index.tsx`, `ToolName.tsx`, `inputs.ts`, `compute.ts`, `outputs.ts`)
2. `tools/registry.ts`에 `available: true`로 등록
3. 마스터 입력 → 산출물 카드 흐름이 동일 패턴 (recruitment 참고)
4. 환경 의존 호출은 무조건 `platform.*` 경유

### 5.6 산출물 추가 (기존 도구 안)

1. `outputs.ts`의 `OUTPUT_TEMPLATES` 배열에 `OutputTemplate` 객체 추가
2. 표 형식이면 `excelBuilder` 같이 정의해서 엑셀 다운로드 버튼 자동 생성
3. 카테고리 신규 시 `FormFields.tsx`의 `CATEGORY_LABEL` + `styles.css`의 `.output-cat.cat-*` 색상도 추가

### 5.7 인증서 갱신 (만료 30일 전)

```bash
cd ~/infra/nginx && ./scripts/renew-cert.sh
# 또는
docker compose run --rm certbot renew --webroot -w /var/www/certbot
docker compose exec -T nginx nginx -t
docker compose exec -T nginx nginx -s reload
```

---

## 6. 흔한 함정

1. **`window.api` 직접 호출이 슬그머니 추가됨** — 새 코드 추가 시 IDE 자동완성이 `window.api`를 제안할 수 있음.
   `platform.*`만 쓰도록 코드 리뷰 단계에서 점검. Web 빌드 후 브라우저 콘솔에 `Cannot read properties of undefined (reading '...')` 에러가 보이면 누락된 직접 호출이다.

2. **preload `Api` 타입 ↔ `PlatformAdapter` 인터페이스 비동기화**.
   preload에 새 IPC 함수 추가 시 ① `main/ipc.ts` 핸들러 ② `preload/index.ts` api 객체 ③ `lib/platform/types.ts` 인터페이스 ④ `electron.ts` 위임 ⑤ `web.ts` 구현 모두 갱신.

3. **xlsx dynamic require**: `xlsx`는 `electron-vite`의 `externalizeDepsPlugin`이 외부화해서 정상 동작. **`devDependencies`로 잘못 옮기면** main process 번들 안에 들어가서 dynamic require 시 깨짐. `dependencies` 유지 필수.

4. **HCell(한컴 셀)로 작성된 xlsx 파싱 안 됨**. SheetJS 기본 파싱이 `Sheets` 객체를 못 채움. 가이드 엑셀(`sample/대체채용업무.xlsx`)이 그 케이스. 실 사용 양식은 LibreOffice/Excel 표준 — 일반 사용자 입력은 문제 없음. 가이드 분석 시에만 별도 XML 파싱이 필요.

5. **DEV title prefix는 컨테이너 빌드 시점에 sed로 박힘**. 코드 수정만 하고 `docker compose up -d` 하지 않으면 반영 안 됨. 항상 `--build` 옵션.

6. **CSP `unsafe-eval` 제거 금지**. Handlebars가 런타임에 `new Function()`으로 컴파일. 제거하면 모든 산출물 생성이 깨짐. 사용자가 직접 템플릿 편집해야 하므로 precompile 우회 불가.

7. **electron-store 키와 localStorage 키 비동기화**. 같은 사용자가 데스크톱→웹 옮겨도 데이터는 따로. 향후 동기화가 필요하면 별도 백엔드 설계 결정.

8. **node_modules 동기화**: package.json/package-lock.json 변경 후 `docker compose up -d --build`로는 컨테이너만 갱신. 호스트의 `npm run pack`이나 `typecheck`을 돌리려면 `npm install` 별도 실행.

9. **`~/services/edu/`에는 node_modules가 아예 없음** — 호스트에서 typecheck/pack 안 함. 운영 컨테이너는 Docker 빌드 안에서 npm ci 함. 운영 측에서 npm install 절대 금지 (디스크 낭비 + 신뢰성 저하).

10. **infra-nginx reload 직후 첫 요청 race** — 재시도하면 정상. `~/infra/nginx/CLAUDE.md §5` 함정 1 참조.

---

## 7. 도구: 대체 채용 자동화 (`recruitment-docs`)

### 입력 (6그룹, 34필드)

| 그룹 | 필드 |
|---|---|
| 기관 | 학교명, 원장(사용자/발령권자), 행정실명 |
| 원근로자 (휴가자) | 직종, 성명, 생년월일, 무기계약 전환일 |
| 대체근로자 | 성명, 성별, 생년월일, 만나이, 주민번호, 주소, 연락처, 계좌, 직종(대체) |
| 휴가·계약 | 휴가사유(select), 시작·종료·일수, 근무시간, 시급, 채용일·계약서일, 고용보험 공제 |
| 관련 문서 | 품의/노사협력과 대호, 발령 근거, 휴가 상세 보고사항 |
| 회계 | 지급일, 실업급여요율, 기관부담금 요율 |

### 산출물 10종

| 카테고리 | 이름 | excelBuilder |
|---|---|---|
| draft | 기안 ① 성범죄·아동학대 전력조회 결과 보고 | × |
| draft | 기안 ② 근로계약 체결 보고 | × |
| draft | 기안 ③ 교육지원청 채용보고 | × |
| draft | 기안 ③ 첨부 표 (휴가 사용 보고 + 대체직 채용) | ✓ (2시트) |
| sms | 임금명세서 SMS | × |
| row | 발령대장 1행 | ✓ |
| row | 근로내용확인신고서 1행 | ✓ |
| row | 대체인력비 지원신청 1행 | ✓ |
| contract | 근로계약서 본문 | × |
| table | 임금 계산표 (검토용) | × |

### 휴가사유별 법령 매핑 (`compute.ts`)

- 연차 → 제61조 / 병가 → 제66조 / 학습휴가 → 제72조 제6항 / 특별휴가 → 제72조 제7항 / 가족돌봄휴가 → 제69조 제5항 제1호

### 좌측 사이드바: 17단계 업무 프로세스

`PROCESS_SECTIONS` 상수에 정의 — 채용계약(7) / 인건비 지급(6) / 보험료 신고납부(4). 접기/펼치기 토글.

---

## 8. 관련 파일 / 참조

- 운영 짝: `~/services/edu/` (`edu.rastabanj.com`)
- 인프라 SoT: `~/infra/nginx/CLAUDE.md` (도메인/인증서/네트워크/운영-개발 분기 컨벤션)
- nginx confs: `~/infra/nginx/conf.d/edu.rastabanj.com.conf`, `dev-edu.rastabanj.com.conf`
- 코드 컨벤션: `./CONVENTIONS.md` (브랜치/커밋/스타일)
- Windows 배포 메모: `~/.claude/projects/-home-rastabanj/memory/reference_windows_deploy.md`
- 가이드 엑셀: `sample/대체채용업무.xlsx` (HCell 작성, 산출물 본문 사양 원전)
- 입력 양식: `sample/대체채용_샘플1건.xlsx`

---

## 9. 변경 이력 / changelog 정책

이 파일은 운영 원칙 + 현재 상태 스냅샷이지 changelog가 아니다.
큰 변화(새 도구 추가, 어댑터 함수 추가, 인프라 변경 등)가 있을 때
**스냅샷과 결정 배경을 업데이트**하고, 세부 커밋 히스토리는 git log에 맡긴다.
