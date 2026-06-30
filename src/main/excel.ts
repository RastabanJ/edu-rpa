import { readFile, utils, writeFile as xlsxWriteFile, type WorkBook } from 'xlsx'

export type ParsedRow = Record<string, string>

export type ParsedSheet = {
  filePath: string
  fileName: string
  sheetName: string
  columns: string[]
  rows: ParsedRow[]
}

export function parseExcel(filePath: string): ParsedSheet {
  const wb = readFile(filePath, { cellDates: false })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) throw new Error('엑셀에 시트가 없습니다.')

  const sheet = wb.Sheets[sheetName]
  const raw = utils.sheet_to_json<Record<string, unknown>>(sheet, {
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

  const fileName = filePath.split(/[\\/]/).pop() ?? filePath

  return {
    filePath,
    fileName,
    sheetName,
    columns: Array.from(columns),
    rows
  }
}

type FieldRow = { label: string; example: string; width?: number }

const TEMPLATE_FIELDS: FieldRow[] = [
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

export const EXAMPLE_PREFIX = '(예시)'

export function buildSampleWorkbook(): WorkBook {
  const header = TEMPLATE_FIELDS.map((f) => f.label)
  const exampleRow = TEMPLATE_FIELDS.map((f) => `${EXAMPLE_PREFIX} ${f.example}`)
  const emptyRow = TEMPLATE_FIELDS.map(() => '')

  const ws = utils.aoa_to_sheet([header, exampleRow, emptyRow, emptyRow, emptyRow])
  ws['!cols'] = TEMPLATE_FIELDS.map((f) => ({ wch: f.width ?? 14 }))
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, '입력양식')
  return wb
}

export function writeWorkbook(wb: WorkBook, filePath: string): void {
  xlsxWriteFile(wb, filePath)
}

export type WorkbookSpec = {
  filename: string
  sheets: { name: string; rows: (string | number)[][] }[]
}

export function buildWorkbookFromSpec(spec: WorkbookSpec): WorkBook {
  const wb = utils.book_new()
  for (const s of spec.sheets) {
    const ws = utils.aoa_to_sheet(s.rows)
    const cols = s.rows[0]?.length ?? 0
    if (cols > 0) {
      ws['!cols'] = Array.from({ length: cols }, (_, i) => {
        const max = Math.max(
          ...s.rows.map((r) => String(r[i] ?? '').split('\n').reduce((m, l) => Math.max(m, l.length), 0))
        )
        return { wch: Math.min(Math.max(max + 2, 10), 48) }
      })
    }
    utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
  }
  return wb
}
