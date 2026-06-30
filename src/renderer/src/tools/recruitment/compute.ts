import type { ReplacementInputs } from './inputs'

export type Computed = {
  grossSalary: number
  deduction: number
  netPay: number
  employerContribution: number
  filingMonth: string
  avgHoursPerDay: number
}

function num(s: string): number {
  const n = parseFloat(s)
  return isFinite(n) ? n : 0
}

const LEAVE_LAW_CLAUSES: Record<string, string> = {
  '연차': '『경기도교육청 교육공무직원 취업규칙』 제61조에 따른 연차',
  '병가': '『경기도교육청 교육공무직원 취업규칙』 제66조에 따른 병가',
  '학습휴가': '『경기도교육청 교육공무직원 취업규칙』 제72조 제6항에 따른 특별휴가(학습휴가)',
  '특별휴가': '『경기도교육청 교육공무직원 취업규칙』 제72조 제7항에 따른 특별휴가(장기재직휴가)',
  '가족돌봄휴가': '『경기도교육청 교육공무직원 취업규칙』 제69조 제5항 제1호에 따른 가족돌봄휴가(유급)'
}

function leaveLawClause(reason: string): string {
  return LEAVE_LAW_CLAUSES[reason] ?? `『경기도교육청 교육공무직원 취업규칙』에 따른 ${reason || '휴가'}`
}

function floor10(n: number): number {
  return Math.floor(n / 10) * 10
}

export function compute(inp: ReplacementInputs): Computed {
  const wage = num(inp.hourlyWage)
  const hours = num(inp.hours)
  const days = num(inp.days)
  const ueRate = num(inp.unemploymentRate)
  const erRate = num(inp.employerRate)

  const grossSalary = wage * hours * days
  const deduction = inp.employmentInsuranceDeduction
    ? floor10(grossSalary * ueRate)
    : 0
  const netPay = grossSalary - deduction
  const employerContribution = inp.employmentInsuranceDeduction
    ? Math.round(grossSalary * erRate)
    : 0
  const filingMonth = nextMonthLabel(inp.contractEnd)
  const avgHoursPerDay = hours

  return { grossSalary, deduction, netPay, employerContribution, filingMonth, avgHoursPerDay }
}

export function formatWon(n: number): string {
  if (!isFinite(n)) return '0원'
  return n.toLocaleString('ko-KR') + '원'
}

export function formatNum(n: number): string {
  if (!isFinite(n)) return '0'
  return n.toLocaleString('ko-KR')
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${m[1]}.${parseInt(m[2], 10)}.${parseInt(m[3], 10)}.`
}

export function formatDateLong(iso: string): string {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${m[1]}. ${parseInt(m[2], 10)}. ${parseInt(m[3], 10)}.`
}

export function formatRange(start: string, end: string, days: string): string {
  const s = formatDate(start)
  const e = formatDate(end)
  const d = days?.trim() || '?'
  if (!s && !e) return ''
  return `${s}~${e}(${d}일)`
}

export function nextMonthLabel(iso: string): string {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})-(\d{2})/)
  if (!m) return ''
  let y = parseInt(m[1], 10)
  let mo = parseInt(m[2], 10) + 1
  if (mo > 12) {
    y++
    mo = 1
  }
  return `${y}.${mo}.`
}

export function maskRRN(rrn: string): string {
  if (!rrn) return ''
  return rrn.replace(/^(\d{6}-\d)\d{6}/, '$1******')
}

export function maskName(name: string): string {
  if (!name) return ''
  if (name.length <= 2) return name
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

export function ratePercent(rate: string, fractionDigits = 1): string {
  const n = parseFloat(rate)
  if (!isFinite(n)) return ''
  return (n * 100).toFixed(fractionDigits) + '%'
}

export type RenderContext = ReplacementInputs &
  Computed & {
    // 포맷된 표시용 필드
    f: {
      contractStart: string
      contractEnd: string
      contractRange: string
      hireDate: string
      contractWriteDate: string
      payDate: string
      origBirth: string
      origPermDate: string
      subBirth: string
      approvalRefLong: string
      grossSalary: string
      deduction: string
      netPay: string
      employerContribution: string
      hourlyWage: string
      hours: string
      days: string
      unemploymentRate: string
      employerRate: string
      subNameMasked: string
      subRRNMasked: string
      workTimeRange: string
      laborSummary: string
      leaveLawClause: string
      origNameWithBirth: string
      subNameWithBirth: string
    }
  }

export function buildContext(inp: ReplacementInputs): RenderContext {
  const c = compute(inp)
  const hours = num(inp.hours)
  const days = num(inp.days)
  const wage = num(inp.hourlyWage)
  const laborSummary = `일급 ${formatWon(wage)}*${hours}시간*${days}일= ${formatWon(c.grossSalary)}`
  const workTimeRange =
    inp.workStart && inp.workEnd
      ? `${inp.workStart}~${inp.workEnd}(${inp.hours || '?'}시간, 휴게시간 포함)`
      : ''
  return {
    ...inp,
    ...c,
    f: {
      contractStart: formatDate(inp.contractStart),
      contractEnd: formatDate(inp.contractEnd),
      contractRange: formatRange(inp.contractStart, inp.contractEnd, inp.days),
      hireDate: formatDate(inp.hireDate),
      contractWriteDate: formatDateLong(inp.contractWriteDate),
      payDate: formatDate(inp.payDate),
      origBirth: formatDate(inp.origBirth),
      origPermDate: formatDate(inp.origPermDate),
      subBirth: formatDate(inp.subBirth),
      approvalRefLong: inp.approvalRef,
      grossSalary: formatWon(c.grossSalary),
      deduction: formatWon(c.deduction),
      netPay: formatWon(c.netPay),
      employerContribution: formatWon(c.employerContribution),
      hourlyWage: formatWon(wage),
      hours: inp.hours,
      days: inp.days,
      unemploymentRate: ratePercent(inp.unemploymentRate),
      employerRate: ratePercent(inp.employerRate),
      subNameMasked: maskName(inp.subName),
      subRRNMasked: maskRRN(inp.subRRN),
      workTimeRange,
      laborSummary,
      leaveLawClause: leaveLawClause(inp.leaveReason),
      origNameWithBirth: inp.origBirth
        ? `${inp.origName}(${formatDate(inp.origBirth)})`
        : inp.origName,
      subNameWithBirth: inp.subBirth
        ? `${inp.subName}(${inp.subGender || ''}, ${formatDate(inp.subBirth)})`
        : inp.subName
    }
  }
}
