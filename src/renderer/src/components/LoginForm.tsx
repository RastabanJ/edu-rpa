import { useState, type FormEvent } from 'react'
import { isAllowedId, normalizeId, type AllowedId, type Session } from '../lib/auth'
import { platform } from '../lib/platform'

type Props = {
  onSuccess: (session: Session) => void
}

export function LoginForm({ onSuccess }: Props): JSX.Element {
  const [id, setId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (submitting) return
    const trimmed = id.trim()
    if (!trimmed) {
      setError('ID를 입력하세요.')
      return
    }
    if (!isAllowedId(trimmed)) {
      setError('허용되지 않은 ID입니다.')
      return
    }
    setSubmitting(true)
    setError(null)
    const session: Session = {
      id: normalizeId(trimmed) as AllowedId,
      loggedInAt: new Date().toISOString()
    }
    try {
      const saved = await platform.saveSession(session)
      onSuccess(saved)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`로그인 처리 중 오류: ${message}`)
      setSubmitting(false)
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">사내 자동화 도구</h1>
        <p className="login-sub muted">인가받은 사용자만 접근 할 수 있습니다.</p>
        <label className="login-field">
          <span>ID</span>
          <input
            type="text"
            autoFocus
            autoComplete="username"
            value={id}
            onChange={(event) => {
              setId(event.target.value)
              if (error) setError(null)
            }}
            placeholder="id를 입력해주세요"
            spellCheck={false}
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </main>
  )
}
