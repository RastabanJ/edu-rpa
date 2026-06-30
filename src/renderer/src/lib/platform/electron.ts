import { isAllowedId, type Session } from '../auth'
import type { PlatformAdapter } from './types'

export const electronAdapter: PlatformAdapter = {
  getVersion: () => window.api.getVersion(),
  openExcel: () => window.api.openExcel(),
  downloadExcelTemplate: () => window.api.downloadExcelTemplate(),
  writeClipboard: (text) => window.api.writeClipboard(text),
  saveText: (defaultName, content) => window.api.saveText(defaultName, content),
  saveMany: (files) => window.api.saveMany(files),
  saveWorkbook: (spec) => window.api.saveWorkbook(spec),
  listRuns: () => window.api.listRuns(),
  appendRun: (input) => window.api.appendRun(input),
  clearRuns: () => window.api.clearRuns(),
  getRecruitmentDefaults: () => window.api.getRecruitmentDefaults(),
  saveRecruitmentDefaults: (data) => window.api.saveRecruitmentDefaults(data),
  getSession: async (): Promise<Session | null> => {
    const raw = await window.api.getSession()
    if (!raw || !isAllowedId(raw.id)) return null
    return { id: raw.id, loggedInAt: raw.loggedInAt }
  },
  saveSession: async (session) => {
    const saved = await window.api.saveSession(session)
    return isAllowedId(saved.id)
      ? { id: saved.id, loggedInAt: saved.loggedInAt }
      : session
  },
  clearSession: () => window.api.clearSession()
}
