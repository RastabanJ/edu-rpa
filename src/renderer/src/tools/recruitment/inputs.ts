export type ReplacementInputs = {
  // 기관
  schoolName: string
  principalName: string
  officeName: string

  // 원근로자 (휴가자)
  origJob: string
  origName: string
  origBirth: string
  origPermDate: string

  // 대체근로자
  subName: string
  subGender: string
  subBirth: string
  subAge: string
  subRRN: string
  subAddress: string
  subPhone: string
  subAccount: string
  subJob: string

  // 휴가/계약
  leaveReason: string
  contractStart: string
  contractEnd: string
  days: string
  workStart: string
  workEnd: string
  hours: string
  hourlyWage: string
  hireDate: string
  contractWriteDate: string
  employmentInsuranceDeduction: boolean

  // 관련문서
  approvalRef: string
  laborAffairsRef: string
  appointmentBasis: string
  leaveDetailNote: string

  // 회계
  payDate: string
  unemploymentRate: string
  employerRate: string
}

export type FieldDef = {
  key: keyof ReplacementInputs
  label: string
  excelLabel?: string
  type: 'text' | 'number' | 'date' | 'time' | 'select' | 'checkbox' | 'textarea'
  placeholder?: string
  options?: string[]
  required?: boolean
  width?: 1 | 2 | 3
  hint?: string
}

export type GroupDef = {
  key: string
  title: string
  fields: FieldDef[]
}

export const INPUT_GROUPS: GroupDef[] = [
  {
    key: 'org',
    title: '기관 정보',
    fields: [
      { key: 'schoolName', label: '학교명', type: 'text', placeholder: '배곧초록유치원', required: true, width: 1 },
      { key: 'principalName', label: '원장(사용자/발령권자)', type: 'text', placeholder: '배곧초록유치원장', required: true, width: 1 },
      { key: 'officeName', label: '행정실명', type: 'text', placeholder: '행정실', width: 1 }
    ]
  },
  {
    key: 'orig',
    title: '원근로자 (휴가자)',
    fields: [
      { key: 'origJob', label: '직종', excelLabel: '원근로자 직종', type: 'text', placeholder: '조리실무사', required: true, width: 1 },
      { key: 'origName', label: '성명', excelLabel: '원근로자 성명', type: 'text', placeholder: 'OOO', required: true, width: 1 },
      { key: 'origBirth', label: '생년월일', excelLabel: '원근로자 생년월일', type: 'date', width: 1 },
      { key: 'origPermDate', label: '무기계약 전환일', type: 'date', width: 1 }
    ]
  },
  {
    key: 'sub',
    title: '대체근로자',
    fields: [
      { key: 'subName', label: '성명', type: 'text', placeholder: '홍길동', required: true, width: 1 },
      { key: 'subGender', label: '성별', type: 'select', options: ['남', '여'], required: true, width: 1 },
      { key: 'subBirth', label: '생년월일', type: 'date', required: true, width: 1 },
      { key: 'subAge', label: '연령(만나이)', type: 'text', placeholder: '만50세', width: 1 },
      { key: 'subRRN', label: '주민등록번호', type: 'text', placeholder: '000101-2******', width: 2, hint: '뒷자리는 *로 마스킹됩니다' },
      { key: 'subAddress', label: '현 주소', type: 'text', placeholder: '경기도 시흥시 OO로', width: 3 },
      { key: 'subPhone', label: '연락처', type: 'text', placeholder: '010-1234-5678', width: 1 },
      { key: 'subAccount', label: '계좌번호', type: 'text', placeholder: 'OO은행 1234-5678-12349', width: 2 },
      { key: 'subJob', label: '직종(대체)', type: 'text', placeholder: '조리실무사 대체', required: true, width: 1 }
    ]
  },
  {
    key: 'contract',
    title: '휴가 · 계약',
    fields: [
      { key: 'leaveReason', label: '휴가사유', type: 'select', options: ['학습휴가', '연차', '병가', '특별휴가', '가족돌봄휴가'], required: true, width: 1 },
      { key: 'contractStart', label: '계약 시작일', type: 'date', required: true, width: 1 },
      { key: 'contractEnd', label: '계약 종료일', type: 'date', required: true, width: 1 },
      { key: 'days', label: '근무 일수', type: 'number', placeholder: '1', required: true, width: 1 },
      { key: 'workStart', label: '근무 시작 시각', type: 'time', placeholder: '08:00', width: 1 },
      { key: 'workEnd', label: '근무 종료 시각', type: 'time', placeholder: '17:00', width: 1 },
      { key: 'hours', label: '하루 근무시간', type: 'number', placeholder: '8', required: true, width: 1, hint: '휴게시간 제외' },
      { key: 'hourlyWage', label: '시급(원)', type: 'number', placeholder: '12860', required: true, width: 1 },
      { key: 'hireDate', label: '채용일', type: 'date', required: true, width: 1 },
      { key: 'contractWriteDate', label: '계약서 작성일', type: 'date', width: 1 },
      { key: 'employmentInsuranceDeduction', label: '고용보험 공제 (만 65세 미만)', type: 'checkbox', width: 2 }
    ]
  },
  {
    key: 'doc',
    title: '관련 문서',
    fields: [
      { key: 'approvalRef', label: '품의 관련대호', type: 'text', placeholder: '배곧초록유치원-1995(2026. 3. 18.)', width: 3 },
      { key: 'laborAffairsRef', label: '노사협력과 관련대호', type: 'text', placeholder: '경기도교육청 노사협력과-8156(2025. 11. 4.)', width: 3 },
      { key: 'appointmentBasis', label: '발령 근거', type: 'text', placeholder: '배곧초록유치원-0000(2026.6.22.)', width: 3 },
      {
        key: 'leaveDetailNote',
        label: '휴가 상세 보고사항',
        type: 'textarea',
        placeholder: '예: 2026학년도 재량휴업일 2일, 기존 0일 사용, 금번 1일 사용',
        width: 3,
        hint: '기안 ③ 첨부 표의 휴가 보고 사항 [...] 칸에 들어갑니다'
      }
    ]
  },
  {
    key: 'finance',
    title: '회계',
    fields: [
      { key: 'payDate', label: '지급일', type: 'date', required: true, width: 1 },
      { key: 'unemploymentRate', label: '고용보험 실업급여요율', type: 'number', placeholder: '0.009', width: 1, hint: '2026년 기준 0.9% = 0.009' },
      { key: 'employerRate', label: '기관부담금 요율', type: 'number', placeholder: '0.0085', width: 1, hint: '간이 계산용 — 추후 보강' }
    ]
  }
]

export const DEFAULT_INPUTS: ReplacementInputs = {
  schoolName: '',
  principalName: '',
  officeName: '행정실',

  origJob: '',
  origName: '',
  origBirth: '',
  origPermDate: '',

  subName: '',
  subGender: '',
  subBirth: '',
  subAge: '',
  subRRN: '',
  subAddress: '',
  subPhone: '',
  subAccount: '',
  subJob: '',

  leaveReason: '',
  contractStart: '',
  contractEnd: '',
  days: '',
  workStart: '08:00',
  workEnd: '17:00',
  hours: '8',
  hourlyWage: '',
  hireDate: '',
  contractWriteDate: '',
  employmentInsuranceDeduction: true,

  approvalRef: '',
  laborAffairsRef: '',
  appointmentBasis: '',
  leaveDetailNote: '',

  payDate: '',
  unemploymentRate: '0.009',
  employerRate: '0.0085'
}

export function getAllFields(): FieldDef[] {
  return INPUT_GROUPS.flatMap((g) => g.fields)
}

export function findMissingRequired(inputs: ReplacementInputs): FieldDef[] {
  return getAllFields().filter((f) => {
    if (!f.required) return false
    const v = inputs[f.key]
    if (typeof v === 'boolean') return false
    return !v || !String(v).trim()
  })
}

export function excelLabelOf(field: FieldDef): string {
  return field.excelLabel ?? field.label
}

const FIELD_BY_EXCEL_LABEL: Record<string, keyof ReplacementInputs> = (() => {
  const out: Record<string, keyof ReplacementInputs> = {}
  for (const f of getAllFields()) out[excelLabelOf(f)] = f.key
  return out
})()

export const EXCEL_COLUMN_LABELS: string[] = getAllFields().map(excelLabelOf)

export function applyExcelRows(
  current: ReplacementInputs,
  pairs: { label: string; value: string }[]
): ReplacementInputs {
  const next: ReplacementInputs = { ...current }
  for (const { label, value } of pairs) {
    const key = FIELD_BY_EXCEL_LABEL[label.trim()]
    if (!key) continue
    const def = getAllFields().find((f) => f.key === key)
    if (!def) continue
    if (def.type === 'checkbox') {
      ;(next[key] as unknown as boolean) =
        value.trim().toUpperCase() === 'O' || value.trim() === '예' || value.trim().toLowerCase() === 'true'
    } else {
      ;(next[key] as unknown as string) = value
    }
  }
  return next
}
