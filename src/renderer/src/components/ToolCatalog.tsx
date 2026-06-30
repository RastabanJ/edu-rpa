import type { ToolModule } from '../tools/types'

export function ToolCatalog({
  tools,
  onSelect
}: {
  tools: ToolModule[]
  onSelect: (id: string) => void
}): JSX.Element {
  return (
    <section className="catalog">
      <h2 className="catalog-title">도구 선택</h2>
      <p className="muted">사용할 자동화 도구를 골라 실행하세요.</p>
      <div className="tool-grid">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`tool-card${t.available ? '' : ' disabled'}`}
            onClick={() => t.available && onSelect(t.id)}
            disabled={!t.available}
            title={t.available ? '' : '준비 중'}
          >
            <div className="tool-icon">{t.icon}</div>
            <div className="tool-meta">
              <h3>{t.name}</h3>
              <p>{t.description}</p>
            </div>
            {!t.available && <span className="badge">준비중</span>}
          </button>
        ))}
      </div>
    </section>
  )
}
