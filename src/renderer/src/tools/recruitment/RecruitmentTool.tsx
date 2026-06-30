import { Fragment, useEffect, useMemo, useState } from 'react'
import { platform } from '../../lib/platform'
import type { ToolContext } from '../types'
import {
  DEFAULT_INPUTS,
  INPUT_GROUPS,
  applyExcelRows,
  findMissingRequired,
  type ReplacementInputs
} from './inputs'
import { renderOutputs, type RenderedOutput } from './outputs'
import { compute, formatWon, formatRange } from './compute'
import { FieldGroup, OutputCard } from './FormFields'

const TOOL_ID = 'recruitment-docs'
const TOOL_NAME = '대체 채용 자동화'

type Step = 1 | 2

type ProcessSection = { title: string; startNum: number; items: string[] }

const PROCESS_SECTIONS: ProcessSection[] = [
  {
    title: '채용계약',
    startNum: 1,
    items: [
      '영양교사로부터 인적사항 전달받은 후 계약서 작성',
      '계약서 직인 날인/근로자 서명(또는 날인) 후 교부',
      '성범죄 경력 및 아동학대관련범죄 전력조회',
      '성범죄 경력 및 아동학대관련범죄 전력조회 결과 내부결재',
      '근로계약 체결 내부결재',
      '교육지원청에 대체직 채용결과 보고',
      '발령대장 기입'
    ]
  },
  {
    title: '인건비 지급',
    startNum: 8,
    items: [
      '인건비 및 고용보험료 공제금액 계산',
      '인건비 지급 원인행위 (주무관 - 실장님 - 원장님)',
      '인건비 지급 지출결의 (주무관 - 실장님) 및 지급명령',
      '지급명령 확정 후 고용보험료 세외 수납',
      '임금명세서 작성 및 교부',
      '임금명세서 교부대장 기입'
    ]
  },
  {
    title: '보험료 신고납부',
    startNum: 14,
    items: [
      '익월 근로복지공단에 근로내용확인신고서 제출 (+국세청 연계 신고)',
      '고용보험 고지서 확인 후 기관부담금 원인행위 (주무관 - 실장님 - 원장님)',
      '기관부담금 지출결의 (주무관 - 실장님)',
      '보험료 납부'
    ]
  }
]

export function RecruitmentTool({ ctx }: { ctx: ToolContext }): JSX.Element {
  const [step, setStep] = useState<Step>(1)
  const [inputs, setInputs] = useState<ReplacementInputs>(DEFAULT_INPUTS)
  const [outputs, setOutputs] = useState<RenderedOutput[]>([])
  const [invalid, setInvalid] = useState<Set<keyof ReplacementInputs>>(new Set())
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    platform.getRecruitmentDefaults().then((saved) => {
      if (saved && Object.keys(saved).length > 0) {
        setInputs((cur) => ({ ...cur, ...(saved as Partial<ReplacementInputs>) }))
      }
    })
  }, [])

  const computed = useMemo(() => compute(inputs), [inputs])

  function updateField(key: keyof ReplacementInputs, value: string | boolean): void {
    setInputs((cur) => ({ ...cur, [key]: value } as ReplacementInputs))
    if (invalid.has(key)) {
      const next = new Set(invalid)
      next.delete(key)
      setInvalid(next)
    }
  }

  async function handleDownloadTemplate(): Promise<void> {
    const path = await platform.downloadExcelTemplate()
    if (path) setStatus(`입력 양식 저장: ${path}`)
  }

  async function handleUploadExcel(): Promise<void> {
    const result = await platform.openExcel()
    if (!result) return
    if (!result.ok) {
      setStatus(`엑셀 읽기 실패: ${result.error}`)
      return
    }
    const { columns, rows } = result.sheet
    if (columns.length === 0 || rows.length === 0) {
      setStatus('양식에 데이터가 없습니다.')
      return
    }
    const dataRows = rows.filter((r) => {
      const values = columns.map((c) => (r[c] ?? '').trim())
      const hasContent = values.some((v) => v.length > 0)
      const isExample = values.some((v) => v.startsWith('(예시)'))
      return hasContent && !isExample
    })
    if (dataRows.length === 0) {
      setStatus('예시 행 아래에 실제 값을 입력해주세요.')
      return
    }
    const first = dataRows[0]
    const pairs = columns
      .map((c) => ({ label: c, value: (first[c] ?? '').trim() }))
      .filter((p) => p.value.length > 0)
    setInputs((cur) => applyExcelRows(cur, pairs))
    const more =
      dataRows.length > 1
        ? ` (양식에 ${dataRows.length}건 발견 — 첫 건만 폼에 반영. 일괄 처리는 추후 지원 예정)`
        : ''
    setStatus(`엑셀에서 ${pairs.length}개 항목을 폼에 반영했습니다.${more}`)
  }

  async function handleSaveDefaults(): Promise<void> {
    await platform.saveRecruitmentDefaults(inputs as unknown as Record<string, unknown>)
    setStatus('현재 입력값을 기본값으로 저장했습니다.')
  }

  function handleNext(): void {
    const missing = findMissingRequired(inputs)
    if (missing.length > 0) {
      setInvalid(new Set(missing.map((f) => f.key)))
      setStatus(`필수 항목 ${missing.length}개를 입력하세요: ${missing.map((f) => f.label).join(', ')}`)
      return
    }
    const rendered = renderOutputs(inputs)
    setOutputs(rendered)
    setStep(2)
    setStatus(`${rendered.length}개 산출물을 생성했습니다.`)

    const range = formatRange(inputs.contractStart, inputs.contractEnd, inputs.days)
    void ctx.recordRun({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      inputSummary: `${inputs.subName} 대체채용 ${range}`,
      outputSummary: `근로계약서·기안 4종·SMS·발령대장·신고서·지원신청·임금표 총 ${rendered.length}건, 임금 ${formatWon(computed.grossSalary)}`
    })
  }

  async function handleCopyOne(o: RenderedOutput): Promise<void> {
    await platform.writeClipboard(o.text)
    setStatus(`"${o.name}" 복사 완료`)
  }

  async function handleDownloadExcel(o: RenderedOutput): Promise<void> {
    if (!o.excel) return
    const path = await platform.saveWorkbook(o.excel)
    if (path) setStatus(`엑셀 저장 완료: ${path}`)
  }

  async function handleCopyAll(): Promise<void> {
    if (outputs.length === 0) return
    const text = outputs
      .map((o) => `▣ ${o.name}\n\n${o.text}`)
      .join('\n\n══════════════════════\n\n')
    await platform.writeClipboard(text)
    setStatus(`전체 ${outputs.length}건을 클립보드에 복사했습니다.`)
  }

  async function handleSaveAll(): Promise<void> {
    if (outputs.length === 0) return
    const files = outputs.map((o) => ({ name: o.name, content: o.text }))
    const ok = await platform.saveMany(files)
    if (ok) setStatus(`저장 완료: ${ok.dir} (${ok.files.length}개 파일)`)
  }

  return (
    <>
      <ProcessSidebar />
      <Stepper step={step} onStep={setStep} canGoStep2={outputs.length > 0} />

      {step === 1 && (
        <section className="card">
          <StepHeader
            step={1}
            title="마스터 입력"
            desc="대체채용 한 건에 대한 정보를 입력하세요. 모든 필수 항목을 채워야 다음으로 진행됩니다."
          />

          <div className="row template-row">
            <button onClick={handleDownloadTemplate}>입력 양식(.xlsx) 다운로드</button>
            <button onClick={handleUploadExcel}>양식 업로드로 폼 채우기</button>
            <button onClick={handleSaveDefaults}>현재값을 기본값으로 저장</button>
          </div>

          <div className="field-groups">
            {INPUT_GROUPS.map((g) => (
              <FieldGroup key={g.key} group={g} inputs={inputs} invalid={invalid} onChange={updateField} />
            ))}
          </div>

          <div className="summary">
            <span>
              임금 총액 <strong>{formatWon(computed.grossSalary)}</strong>
            </span>
            <span>
              공제(고용보험) <strong>{formatWon(computed.deduction)}</strong>
            </span>
            <span>
              실수령액 <strong className="pass">{formatWon(computed.netPay)}</strong>
            </span>
            <span>
              기관부담금 <strong>{formatWon(computed.employerContribution)}</strong>
            </span>
          </div>

          <div className="step-nav">
            <span />
            <button className="primary" onClick={handleNext}>
              산출물 생성 →
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card">
          <StepHeader
            step={2}
            title="산출물"
            desc={`총 ${outputs.length}건의 산출물이 생성되었습니다. 카드별로 복사하거나 한꺼번에 저장하세요.`}
          />

          <div className="row">
            <button className="primary" onClick={handleCopyAll}>
              전체 복사
            </button>
            <button onClick={handleSaveAll}>전체 저장 (.txt)</button>
          </div>

          <div className="outputs">
            {outputs.map((o) => (
              <OutputCard
                key={o.id}
                output={o}
                onCopy={() => handleCopyOne(o)}
                onDownloadExcel={o.excel ? () => handleDownloadExcel(o) : undefined}
              />
            ))}
          </div>

          <div className="step-nav">
            <button onClick={() => setStep(1)}>← 입력으로 돌아가기</button>
            <span />
          </div>
        </section>
      )}

      <div className="tool-status">{status}</div>
    </>
  )
}

function ProcessSidebar(): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <aside className={`process-sidebar${open ? ' open' : ''}`} aria-label="업무 프로세스">
      <button
        type="button"
        className="process-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title={open ? '프로세스 접기' : '프로세스 펼치기'}
      >
        <span className="process-toggle-arrow" aria-hidden>
          {open ? '◀' : '▶'}
        </span>
        <span className="process-toggle-label">업무 프로세스</span>
      </button>
      <div className="process-content" aria-hidden={!open}>
        <h3 className="process-heading">대체 채용 업무 프로세스</h3>
        {PROCESS_SECTIONS.map((sec) => (
          <section key={sec.title} className="process-section">
            <h4 className="process-section-title">[{sec.title}]</h4>
            <ol className="process-list" start={sec.startNum}>
              {sec.items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </aside>
  )
}

function Stepper({
  step,
  onStep,
  canGoStep2
}: {
  step: Step
  onStep: (s: Step) => void
  canGoStep2: boolean
}): JSX.Element {
  const items: { num: Step; label: string }[] = [
    { num: 1, label: '마스터 입력' },
    { num: 2, label: '산출물' }
  ]
  return (
    <nav className="stepper">
      {items.map((s, i) => {
        const active = step === s.num
        const done = step > s.num
        const locked = s.num === 2 && !canGoStep2
        return (
          <Fragment key={s.num}>
            <button
              className={`step-btn${active ? ' active' : ''}${done ? ' done' : ''}${
                locked ? ' locked' : ''
              }`}
              onClick={() => !locked && onStep(s.num)}
              disabled={locked}
              title={locked ? '입력을 완료하고 산출물을 생성하세요.' : ''}
            >
              <span className="step-num">{s.num}</span>
              <span className="step-label">{s.label}</span>
            </button>
            {i < items.length - 1 && <span className="step-sep" aria-hidden />}
          </Fragment>
        )
      })}
    </nav>
  )
}

function StepHeader({
  step,
  title,
  desc
}: {
  step: number
  title: string
  desc: string
}): JSX.Element {
  return (
    <div className="step-header">
      <h2>
        <span className="step-badge">{step}</span>
        {title}
      </h2>
      <p className="muted">{desc}</p>
    </div>
  )
}
