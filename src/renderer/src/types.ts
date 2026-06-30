export type ParsedRow = Record<string, string>

export type ParsedSheet = {
  filePath: string
  fileName: string
  sheetName: string
  columns: string[]
  rows: ParsedRow[]
}

export type Template = {
  id: string
  name: string
  category: 'official' | 'sms' | 'other'
  mode: 'each' | 'aggregate'
  filter?: Record<string, string>
  separator?: string
  body: string
}

export type Run = {
  id: string
  toolId: string
  toolName: string
  startedAt: string
  inputSummary: string
  outputSummary: string
}

export type NewRun = Omit<Run, 'id' | 'startedAt'>
