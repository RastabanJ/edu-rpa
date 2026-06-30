import { useEffect, useMemo, useState } from 'react'
import { LoginForm } from './components/LoginForm'
import { ToolCatalog } from './components/ToolCatalog'
import { HistoryPanel } from './components/HistoryPanel'
import type { Session } from './lib/auth'
import { platform } from './lib/platform'
import { TOOLS } from './tools/registry'
import type { NewRun } from './types'
import type { ToolContext } from './tools/types'

export function App(): JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [activeToolId, setActiveToolId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    let cancelled = false
    platform
      .getSession()
      .then((current) => {
        if (cancelled) return
        setSession(current)
      })
      .catch(() => {
        if (cancelled) return
        setSession(null)
      })
      .finally(() => {
        if (cancelled) return
        setSessionLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

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

  async function handleLogout(): Promise<void> {
    await platform.clearSession()
    setSession(null)
    setActiveToolId(null)
    setShowHistory(false)
  }

  if (sessionLoading) {
    return (
      <main className="container">
        <p className="muted">불러오는 중…</p>
      </main>
    )
  }

  if (!session) {
    return <LoginForm onSuccess={setSession} />
  }

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
          <button onClick={handleLogout} title="로그아웃">
            🚪 로그아웃 ({session.id})
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
