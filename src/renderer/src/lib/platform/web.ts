import * as XLSX from 'xlsx'
import type { Session } from '../auth'
import { isAllowedId } from '../auth'
import type { NewRun, ParsedRow, ParsedSheet, Run } from '../../types'
import type {
  OpenExcelResult,
  PlatformAdapter,
  SaveFile,
  SaveManyResult,
  WorkbookSpec
} from './types'

const KEY_RUNS = 'edu:runs'
const KEY_DEFAULTS = 'edu:recruitmentDefaults'
const KEY_SESSION = 'edu:session'
const APP_VERSION = '0.0.1-web'
const RUN_HISTORY_LIMIT = 200

type TemplateField = { label: string; example: string; width: number }

const TEMPLATE_FIELDS: TemplateField[] = [
  { label: '학교명', example: '배곧초록유치원', width: 18 },
  { label: '원장(사용자/발령권자)', example: '배곧초록유치원장', width: 22 },
  { label: '행정실명', example: '행정실', width: 10 },
  { label: '원근로자 직종', example: '조리실무사', width: 14 },
  { label: '원근로자 성명', example: 'OOO', width: 12 },
  { label: '원근로자 생년월일', example: '1980-03-15', width: 14 },
  { label: '무기계약 전환일', example: '2010-03-01', width: 14 },
  { label: '성명', example: '홍길동', width: 12 },
  { label: '성별', example: '여', width: 6 },
  { label: '생년월일', example: '1975-01-01', width: 14 },
  { label: '연령(만나이)', example: '만50세', width: 10 },
  { label: '주민등록번호', example: '000101-2111111', width: 18 },
  { label: '현 주소', example: '경기도 시흥시 OO로', width: 26 },
  { label: '연락처', example: '010-1234-5678', width: 16 },
  { label: '계좌번호', example: 'OO은행 1234-5678-12349', width: 26 },
  { label: '직종(대체)', example: '조리실무사 대체', width: 16 },
  { label: '휴가사유', example: '학습휴가', width: 12 },
  { label: '계약 시작일', example: '2026-06-22', width: 14 },
  { label: '계약 종료일', example: '2026-06-22', width: 14 },
  { label: '근무 일수', example: '1', width: 10 },
  { label: '근무 시작 시각', example: '08:00', width: 12 },
  { label: '근무 종료 시각', example: '17:00', width: 12 },
  { label: '하루 근무시간', example: '8', width: 12 },
  { label: '시급(원)', example: '12860', width: 12 },
  { label: '채용일', example: '2026-06-22', width: 14 },
  { label: '계약서 작성일', example: '2026-06-22', width: 14 },
  { label: '고용보험 공제 (만 65세 미만)', example: 'O', width: 26 },
  { label: '품의 관련대호', example: '배곧초록유치원-1995(2026. 3. 18.)', width: 36 },
  { label: '노사협력과 관련대호', example: '경기도교육청 노사협력과-8156(2025. 11. 4.)', width: 38 },
  { label: '발령 근거', example: '배곧초록유치원-0000(2026.6.22.)', width: 30 },
  { label: '휴가 상세 보고사항', example: '2026학년도 재량휴업일 2일, 기존 0일 사용, 금번 1일 사용', width: 40 },
  { label: '지급일', example: '2026-06-24', width: 14 },
  { label: '고용보험 실업급여요율', example: '0.009', width: 18 },
  { label: '기관부담금 요율', example: '0.0085', width: 14 }
]

function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function setJSON(key: string, val: unknown): void {
  localStorage.setItem(key, JSON.stringify(val))
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    let settled = false
    const settle = (f: File | null): void => {
      if (settled) return
      settled = true
      input.remove()
      resolve(f)
    }
    input.onchange = () => settle(input.files?.[0] ?? null)
    input.oncancel = () => settle(null)
    window.addEventListener(
      'focus',
      () => setTimeout(() => settle(input.files?.[0] ?? null), 300),
      { once: true }
    )
    document.body.appendChild(input)
    input.click()
  })
}

function safeFilename(name: string, ext: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, '_')
  return cleaned.endsWith(`.${ext}`) ? cleaned : `${cleaned}.${ext}`
}

function workbookToBlob(wb: XLSX.WorkBook): Blob {
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

function parseSheetFromBuffer(file: File, buffer: ArrayBuffer): ParsedSheet {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) throw new Error('엑셀에 시트가 없습니다.')
  const sheet = wb.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false
  })
  const columns = new Set<string>()
  const rows: ParsedRow[] = raw.map((row) => {
    const out: ParsedRow = {}
    for (const [key, value] of Object.entries(row)) {
      const cleanKey = String(key).trim()
      if (!cleanKey) continue
      out[cleanKey] = value == null ? '' : String(value).trim()
      columns.add(cleanKey)
    }
    return out
  })
  return {
    filePath: file.name,
    fileName: file.name,
    sheetName,
    columns: Array.from(columns),
    rows
  }
}

function buildTemplateWorkbook(): XLSX.WorkBook {
  const header = TEMPLATE_FIELDS.map((f) => f.label)
  const exampleRow = TEMPLATE_FIELDS.map((f) => `(예시) ${f.example}`)
  const empty = TEMPLATE_FIELDS.map(() => '')
  const ws = XLSX.utils.aoa_to_sheet([header, exampleRow, empty, empty, empty])
  ws['!cols'] = TEMPLATE_FIELDS.map((f) => ({ wch: f.width }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '입력양식')
  return wb
}

function buildWorkbookFromSpec(spec: WorkbookSpec): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  for (const s of spec.sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows)
    const cols = s.rows[0]?.length ?? 0
    if (cols > 0) {
      ws['!cols'] = Array.from({ length: cols }, (_, i) => {
        const max = Math.max(
          ...s.rows.map((r) =>
            String(r[i] ?? '')
              .split('\n')
              .reduce((m, l) => Math.max(m, l.length), 0)
          )
        )
        return { wch: Math.min(Math.max(max + 2, 10), 48) }
      })
    }
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
  }
  return wb
}

async function saveFileSequential(files: SaveFile[]): Promise<string[]> {
  const saved: string[] = []
  for (const f of files) {
    const name = safeFilename(f.name, 'txt')
    downloadBlob(new Blob([f.content], { type: 'text/plain;charset=utf-8' }), name)
    saved.push(name)
    await new Promise((r) => setTimeout(r, 80))
  }
  return saved
}

export const webAdapter: PlatformAdapter = {
  async getVersion() {
    return APP_VERSION
  },

  async openExcel(): Promise<OpenExcelResult> {
    const file = await pickFile('.xlsx,.xls,.csv')
    if (!file) return null
    try {
      const buffer = await file.arrayBuffer()
      const sheet = parseSheetFromBuffer(file, buffer)
      return { ok: true, sheet }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, error: message, filePath: file.name }
    }
  },

  async downloadExcelTemplate() {
    const wb = buildTemplateWorkbook()
    downloadBlob(workbookToBlob(wb), '대체채용_입력양식.xlsx')
    return '대체채용_입력양식.xlsx'
  },

  async writeClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    }
  },

  async saveText(defaultName: string, content: string) {
    const name = safeFilename(defaultName, 'txt')
    downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), name)
    return name
  },

  async saveMany(files: SaveFile[]): Promise<SaveManyResult> {
    if (files.length === 0) return null
    const saved = await saveFileSequential(files)
    return { dir: '브라우저 다운로드 폴더', files: saved }
  },

  async saveWorkbook(spec: WorkbookSpec) {
    const wb = buildWorkbookFromSpec(spec)
    const name = safeFilename(spec.filename, 'xlsx')
    downloadBlob(workbookToBlob(wb), name)
    return name
  },

  async listRuns(): Promise<Run[]> {
    return getJSON<Run[]>(KEY_RUNS, [])
  },

  async appendRun(input: NewRun): Promise<Run> {
    const run: Run = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startedAt: new Date().toISOString()
    }
    const runs = [run, ...getJSON<Run[]>(KEY_RUNS, [])].slice(0, RUN_HISTORY_LIMIT)
    setJSON(KEY_RUNS, runs)
    return run
  },

  async clearRuns() {
    setJSON(KEY_RUNS, [])
    return []
  },

  async getRecruitmentDefaults() {
    return getJSON<Record<string, unknown>>(KEY_DEFAULTS, {})
  },

  async saveRecruitmentDefaults(data: Record<string, unknown>) {
    setJSON(KEY_DEFAULTS, data)
    return data
  },

  async getSession(): Promise<Session | null> {
    const raw = getJSON<Session | null>(KEY_SESSION, null)
    if (!raw || typeof raw.id !== 'string' || !isAllowedId(raw.id)) return null
    return raw
  },

  async saveSession(session: Session): Promise<Session> {
    setJSON(KEY_SESSION, session)
    return session
  },

  async clearSession(): Promise<void> {
    localStorage.removeItem(KEY_SESSION)
  }
}
