import { useEffect, useState } from 'react'
import { platform } from '../lib/platform'
import type { Run } from '../types'

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const pad = (n: number): string => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return iso
  }
}

export function HistoryPanel({ onClose }: { onClose: () => void }): JSX.Element {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  async function load(): Promise<void> {
    setLoading(true)
    const list = await platform.listRuns()
    setRuns(list)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleClear(): Promise<void> {
    if (!confirm('히스토리 전체를 삭제할까요?')) return
    await platform.clearRuns()
    setRuns([])
  }

  return (
    <div className="history-overlay" onClick={onClose}>
      <aside className="history-panel" onClick={(e) => e.stopPropagation()}>
        <header className="history-head">
          <h2>실행 히스토리</h2>
          <div className="row">
            <button onClick={load} disabled={loading}>새로고침</button>
            <button onClick={handleClear} disabled={runs.length === 0}>전체 삭제</button>
            <button className="primary" onClick={onClose}>닫기</button>
          </div>
        </header>
        {loading && <p className="muted">불러오는 중…</p>}
        {!loading && runs.length === 0 && <p className="muted">아직 실행 기록이 없습니다.</p>}
        <ul className="history-list">
          {runs.map((r) => (
            <li key={r.id} className="history-item">
              <div className="history-meta">
                <strong>{r.toolName}</strong>
                <span className="muted small">{formatTime(r.startedAt)}</span>
              </div>
              <div className="history-body">
                <div><span className="muted small">입력:</span> {r.inputSummary}</div>
                <div><span className="muted small">출력:</span> {r.outputSummary}</div>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
