export type TemplateFilter = Record<string, string>

export type Template = {
  id: string
  name: string
  category: 'official' | 'sms' | 'other'
  mode: 'each' | 'aggregate'
  filter?: TemplateFilter
  separator?: string
  body: string
}

export const DEFAULT_TEMPLATES: Template[] = []
