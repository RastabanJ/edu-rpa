import Handlebars from 'handlebars'
import type { ParsedRow, Template } from '../types'

const compileCache = new Map<string, HandlebarsTemplateDelegate>()

function compile(body: string): HandlebarsTemplateDelegate {
  let fn = compileCache.get(body)
  if (!fn) {
    fn = Handlebars.compile(body, { noEscape: true })
    compileCache.set(body, fn)
  }
  return fn
}

function rowMatches(row: ParsedRow, filter?: Record<string, string>): boolean {
  if (!filter) return true
  return Object.entries(filter).every(([key, value]) => {
    const cell = row[key]
    if (cell == null) return false
    return cell.trim() === value.trim()
  })
}

export type RenderResult = {
  template: Template
  text: string
  count: number
}

export function renderTemplate(template: Template, rows: ParsedRow[]): RenderResult {
  const fn = compile(template.body)
  const filtered = rows.filter((r) => rowMatches(r, template.filter))

  if (template.mode === 'aggregate') {
    const passList = rows.filter((r) => r['result']?.trim() === '합격')
    const failList = rows.filter((r) => r['result']?.trim() === '불합격')
    const ctx = {
      total: rows.length,
      passCount: passList.length,
      failCount: failList.length,
      passList,
      failList,
      rows
    }
    return { template, text: fn(ctx), count: rows.length }
  }

  const separator = template.separator ?? '\n\n────────\n\n'
  const text = filtered.map((row) => fn(row)).join(separator)
  return { template, text, count: filtered.length }
}

export function renderTemplates(templates: Template[], rows: ParsedRow[]): RenderResult[] {
  return templates.map((t) => renderTemplate(t, rows))
}
