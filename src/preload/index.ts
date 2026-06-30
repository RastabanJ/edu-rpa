import { contextBridge, ipcRenderer } from 'electron'

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

export type Session = {
  id: string
  loggedInAt: string
}

const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),

  openExcel: (): Promise<
    | { ok: true; sheet: ParsedSheet }
    | { ok: false; error: string; filePath: string }
    | null
  > => ipcRenderer.invoke('excel:open'),
  downloadExcelTemplate: (): Promise<string | null> =>
    ipcRenderer.invoke('excel:downloadTemplate'),

  listTemplates: (): Promise<Template[]> => ipcRenderer.invoke('templates:list'),
  saveTemplate: (tpl: Template): Promise<Template[]> => ipcRenderer.invoke('templates:save', tpl),
  deleteTemplate: (id: string): Promise<Template[]> => ipcRenderer.invoke('templates:delete', id),
  resetTemplates: (): Promise<Template[]> => ipcRenderer.invoke('templates:reset'),

  writeClipboard: (text: string): Promise<boolean> => ipcRenderer.invoke('clipboard:write', text),

  saveText: (defaultName: string, content: string): Promise<string | null> =>
    ipcRenderer.invoke('file:saveText', { defaultName, content }),

  saveMany: (
    files: { name: string; content: string }[]
  ): Promise<{ dir: string; files: string[] } | null> => ipcRenderer.invoke('file:saveMany', files),

  saveWorkbook: (spec: {
    filename: string
    sheets: { name: string; rows: (string | number)[][] }[]
  }): Promise<string | null> => ipcRenderer.invoke('excel:saveWorkbook', spec),

  listRuns: (): Promise<Run[]> => ipcRenderer.invoke('runs:list'),
  appendRun: (input: NewRun): Promise<Run> => ipcRenderer.invoke('runs:append', input),
  clearRuns: (): Promise<Run[]> => ipcRenderer.invoke('runs:clear'),

  getRecruitmentDefaults: (): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('recruitment:getDefaults'),
  saveRecruitmentDefaults: (data: Record<string, unknown>): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('recruitment:saveDefaults', data),

  getSession: (): Promise<Session | null> => ipcRenderer.invoke('session:get'),
  saveSession: (session: Session): Promise<Session> =>
    ipcRenderer.invoke('session:save', session),
  clearSession: (): Promise<void> => ipcRenderer.invoke('session:clear')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
