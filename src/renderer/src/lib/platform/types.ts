import type { Session } from '../auth'
import type { NewRun, ParsedSheet, Run } from '../../types'

export type OpenExcelResult =
  | { ok: true; sheet: ParsedSheet }
  | { ok: false; error: string; filePath: string }
  | null

export type SaveFile = { name: string; content: string }

export type SaveManyResult = { dir: string; files: string[] } | null

export type WorkbookSpec = {
  filename: string
  sheets: { name: string; rows: (string | number)[][] }[]
}

export type PlatformAdapter = {
  getVersion(): Promise<string>
  openExcel(): Promise<OpenExcelResult>
  downloadExcelTemplate(): Promise<string | null>
  writeClipboard(text: string): Promise<boolean>
  saveText(defaultName: string, content: string): Promise<string | null>
  saveMany(files: SaveFile[]): Promise<SaveManyResult>
  saveWorkbook(spec: WorkbookSpec): Promise<string | null>
  listRuns(): Promise<Run[]>
  appendRun(input: NewRun): Promise<Run>
  clearRuns(): Promise<Run[]>
  getRecruitmentDefaults(): Promise<Record<string, unknown>>
  saveRecruitmentDefaults(data: Record<string, unknown>): Promise<Record<string, unknown>>
  getSession(): Promise<Session | null>
  saveSession(session: Session): Promise<Session>
  clearSession(): Promise<void>
}
