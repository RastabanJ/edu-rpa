import type { ChangeEvent } from 'react'
import type { FieldDef, GroupDef, ReplacementInputs } from './inputs'
import type { RenderedOutput } from './outputs'

type FieldValue = string | boolean

export function FieldGroup({
  group,
  inputs,
  invalid,
  onChange
}: {
  group: GroupDef
  inputs: ReplacementInputs
  invalid: Set<keyof ReplacementInputs>
  onChange: (key: keyof ReplacementInputs, value: FieldValue) => void
}): JSX.Element {
  return (
    <section className="field-group">
      <h3 className="field-group-title">{group.title}</h3>
      <div className="field-grid">
        {group.fields.map((f) => (
          <FieldInput
            key={f.key}
            def={f}
            value={inputs[f.key]}
            invalid={invalid.has(f.key)}
            onChange={(v) => onChange(f.key, v)}
          />
        ))}
      </div>
    </section>
  )
}

function FieldInput({
  def,
  value,
  invalid,
  onChange
}: {
  def: FieldDef
  value: FieldValue
  invalid: boolean
  onChange: (v: FieldValue) => void
}): JSX.Element {
  const id = `field-${def.key}`
  const cls = `field-input${invalid ? ' invalid' : ''} span-${def.width ?? 1}`
  const handleStr = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    onChange(e.target.value)
  }
  const handleBool = (e: ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.checked)
  }

  if (def.type === 'checkbox') {
    return (
      <label className={`${cls} checkbox`} htmlFor={id}>
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={handleBool} />
        <span>
          {def.label}
          {def.required && <em className="req">*</em>}
        </span>
        {def.hint && <small className="muted">{def.hint}</small>}
      </label>
    )
  }

  if (def.type === 'select') {
    return (
      <label className={cls} htmlFor={id}>
        <span>
          {def.label}
          {def.required && <em className="req">*</em>}
        </span>
        <select id={id} value={String(value ?? '')} onChange={handleStr}>
          <option value="">선택</option>
          {def.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {def.hint && <small className="muted">{def.hint}</small>}
      </label>
    )
  }

  if (def.type === 'textarea') {
    return (
      <label className={cls} htmlFor={id}>
        <span>
          {def.label}
          {def.required && <em className="req">*</em>}
        </span>
        <textarea
          id={id}
          value={String(value ?? '')}
          onChange={handleStr}
          placeholder={def.placeholder}
          rows={3}
        />
        {def.hint && <small className="muted">{def.hint}</small>}
      </label>
    )
  }

  return (
    <label className={cls} htmlFor={id}>
      <span>
        {def.label}
        {def.required && <em className="req">*</em>}
      </span>
      <input
        id={id}
        type={def.type}
        value={String(value ?? '')}
        onChange={handleStr}
        placeholder={def.placeholder}
      />
      {def.hint && <small className="muted">{def.hint}</small>}
    </label>
  )
}

const CATEGORY_LABEL: Record<RenderedOutput['category'], string> = {
  draft: '기안',
  sms: 'SMS',
  row: '대장/신고',
  table: '검토용',
  contract: '계약서'
}

export function OutputCard({
  output,
  onCopy,
  onDownloadExcel
}: {
  output: RenderedOutput
  onCopy: () => void
  onDownloadExcel?: () => void
}): JSX.Element {
  return (
    <div className="output-card">
      <div className="output-head">
        <div>
          <span className={`output-cat cat-${output.category}`}>{CATEGORY_LABEL[output.category]}</span>
          <h3>{output.name}</h3>
        </div>
        <div className="output-actions">
          {output.excel && onDownloadExcel && (
            <button className="primary" onClick={onDownloadExcel} title="엑셀 파일로 다운로드">
              엑셀 다운로드
            </button>
          )}
          <button onClick={onCopy}>복사</button>
        </div>
      </div>
      <pre>{output.text}</pre>
    </div>
  )
}
