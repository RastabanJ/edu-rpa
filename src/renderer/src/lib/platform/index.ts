import { electronAdapter } from './electron'
import type { PlatformAdapter } from './types'
import { webAdapter } from './web'

const target = (import.meta.env.VITE_TARGET as string | undefined) ?? 'electron'

export const platform: PlatformAdapter = target === 'web' ? webAdapter : electronAdapter
export type {
  OpenExcelResult,
  PlatformAdapter,
  SaveFile,
  SaveManyResult,
  WorkbookSpec
} from './types'
