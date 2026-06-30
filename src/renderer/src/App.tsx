import { useMemo, useState } from 'react'
import { ToolCatalog } from './components/ToolCatalog'
import { HistoryPanel } from './components/HistoryPanel'
import { platform } from './lib/platform'
import { TOOLS } from './tools/registry'
import type { NewRun } from './types'
import type { ToolContext } from './tools/types'

export function App(): JSX.Element {
  const [activeToolId, setActiveToolId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const activeTool = useMemo(
    () => (activeToolId ? TOOLS.find((t) => t.id === activeToolId) ?? null : null),
    [activeToolId]
  )

  const ctx: ToolContext = useMemo(
    () => ({
      recordRun: async (run: NewRun) => {
        await platform.appendRun(run)
      }
    }),
    []
  )

  return (
    <main className="container">
      <header className="topbar">
        <div className="topbar-left">
          <h1>사내 자동화 도구</h1>
          <p className="muted">업무 자동화 도구 모음 — 도구를 선택해 실행하세요.</p>
        </div>
        <div className="topbar-right">
          <button onClick={() => setShowHistory(true)} title="실행 히스토리">
            🕘 히스토리
          </button>
        </div>
      </header>

      {activeTool ? (
        <>
          <div className="tool-bar">
            <button onClick={() => setActiveToolId(null)}>← 도구 목록</button>
            <h2 className="tool-title">
              <span className="tool-icon-inline">{activeTool.icon}</span>
              {activeTool.name}
            </h2>
          </div>
          <activeTool.Component ctx={ctx} />
        </>
      ) : (
        <ToolCatalog tools={TOOLS} onSelect={setActiveToolId} />
      )}

      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </main>
  )
}
