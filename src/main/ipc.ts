import { BrowserWindow, clipboard, dialog, ipcMain } from 'electron'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  buildSampleWorkbook,
  buildWorkbookFromSpec,
  parseExcel,
  writeWorkbook,
  type WorkbookSpec
} from './excel'
import {
  appendRun,
  clearRuns,
  clearSession,
  deleteTemplate,
  getRecruitmentDefaults,
  getSession,
  listRuns,
  listTemplates,
  resetTemplates,
  saveRecruitmentDefaults,
  saveSession,
  upsertTemplate,
  type Run,
  type Session
} from './store'
import type { Template } from './templates'

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('excel:open', async () => {
    const win = getWindow()
    const result = await dialog.showOpenDialog(win ?? undefined!, {
      title: '엑셀 파일 선택',
      properties: ['openFile'],
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    try {
      return { ok: true as const, sheet: parseExcel(filePath) }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false as const, error: message, filePath }
    }
  })

  ipcMain.handle('excel:downloadTemplate', async () => {
    const win = getWindow()
    const result = await dialog.showSaveDialog(win ?? undefined!, {
      title: '엑셀 양식 저장',
      defaultPath: '대체채용_입력양식.xlsx',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return null
    writeWorkbook(buildSampleWorkbook(), result.filePath)
    return result.filePath
  })

  ipcMain.handle('templates:list', () => listTemplates())
  ipcMain.handle('templates:save', (_e, tpl: Template) => upsertTemplate(tpl))
  ipcMain.handle('templates:delete', (_e, id: string) => deleteTemplate(id))
  ipcMain.handle('templates:reset', () => resetTemplates())

  ipcMain.handle('recruitment:getDefaults', () => getRecruitmentDefaults())
  ipcMain.handle('recruitment:saveDefaults', (_e, data: Record<string, unknown>) =>
    saveRecruitmentDefaults(data)
  )

  ipcMain.handle('runs:list', () => listRuns())
  ipcMain.handle('runs:append', (_e, input: Omit<Run, 'id' | 'startedAt'>) => appendRun(input))
  ipcMain.handle('runs:clear', () => clearRuns())

  ipcMain.handle('session:get', () => getSession())
  ipcMain.handle('session:save', (_e, session: Session) => saveSession(session))
  ipcMain.handle('session:clear', () => clearSession())

  ipcMain.handle('clipboard:write', (_e, text: string) => {
    clipboard.writeText(text)
    return true
  })

  ipcMain.handle('file:saveText', async (_e, payload: { defaultName: string; content: string }) => {
    const win = getWindow()
    const result = await dialog.showSaveDialog(win ?? undefined!, {
      title: '파일 저장',
      defaultPath: payload.defaultName,
      filters: [{ name: 'Text', extensions: ['txt'] }]
    })
    if (result.canceled || !result.filePath) return null
    await writeFile(result.filePath, payload.content, 'utf8')
    return result.filePath
  })

  ipcMain.handle('excel:saveWorkbook', async (_e, spec: WorkbookSpec) => {
    const win = getWindow()
    const result = await dialog.showSaveDialog(win ?? undefined!, {
      title: '엑셀 저장',
      defaultPath: `${spec.filename}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return null
    writeWorkbook(buildWorkbookFromSpec(spec), result.filePath)
    return result.filePath
  })

  ipcMain.handle(
    'file:saveMany',
    async (_e, files: { name: string; content: string }[]) => {
      const win = getWindow()
      const result = await dialog.showOpenDialog(win ?? undefined!, {
        title: '저장 폴더 선택',
        properties: ['openDirectory', 'createDirectory']
      })
      if (result.canceled || result.filePaths.length === 0) return null
      const dir = result.filePaths[0]
      await mkdir(dir, { recursive: true })
      const saved: string[] = []
      for (const f of files) {
        const safeName = f.name.replace(/[\\/:*?"<>|]/g, '_')
        const path = join(dir, safeName.endsWith('.txt') ? safeName : `${safeName}.txt`)
        await writeFile(path, f.content, 'utf8')
        saved.push(path)
      }
      return { dir, files: saved }
    }
  )
}
