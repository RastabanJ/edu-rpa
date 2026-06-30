import type { ComponentType } from 'react'
import type { NewRun } from '../types'

export type ToolContext = {
  recordRun: (run: NewRun) => Promise<void>
}

export type ToolModule = {
  id: string
  name: string
  description: string
  icon: string
  available: boolean
  Component: ComponentType<{ ctx: ToolContext }>
}
