import Store from 'electron-store'
import { DEFAULT_TEMPLATES, type Template } from './templates'

export type Run = {
  id: string
  toolId: string
  toolName: string
  startedAt: string
  inputSummary: string
  outputSummary: string
}

type Schema = {
  templates: Template[]
  runs: Run[]
  recruitmentDefaults: Record<string, unknown>
}

const RUN_HISTORY_LIMIT = 200

const store = new Store<Schema>({
  name: 'rpa-app-data',
  defaults: {
    templates: DEFAULT_TEMPLATES,
    runs: [],
    recruitmentDefaults: {}
  }
})

export function getRecruitmentDefaults(): Record<string, unknown> {
  return store.get('recruitmentDefaults')
}

export function saveRecruitmentDefaults(data: Record<string, unknown>): Record<string, unknown> {
  store.set('recruitmentDefaults', data)
  return data
}

export function listTemplates(): Template[] {
  return store.get('templates')
}

export function upsertTemplate(tpl: Template): Template[] {
  const list = store.get('templates')
  const idx = list.findIndex((t) => t.id === tpl.id)
  if (idx >= 0) list[idx] = tpl
  else list.push(tpl)
  store.set('templates', list)
  return list
}

export function deleteTemplate(id: string): Template[] {
  const list = store.get('templates').filter((t) => t.id !== id)
  store.set('templates', list)
  return list
}

export function resetTemplates(): Template[] {
  store.set('templates', DEFAULT_TEMPLATES)
  return DEFAULT_TEMPLATES
}

export function listRuns(): Run[] {
  return store.get('runs')
}

export function appendRun(input: Omit<Run, 'id' | 'startedAt'>): Run {
  const run: Run = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date().toISOString()
  }
  const runs = [run, ...store.get('runs')].slice(0, RUN_HISTORY_LIMIT)
  store.set('runs', runs)
  return run
}

export function clearRuns(): Run[] {
  store.set('runs', [])
  return []
}
