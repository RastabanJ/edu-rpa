import type { ToolModule } from './types'
import { recruitmentTool } from './recruitment'

export const TOOLS: ToolModule[] = [
  recruitmentTool,
  {
    id: 'placeholder-future',
    name: '추가 예정 도구',
    description: '이곳에 새로운 자동화 도구들이 계속 추가됩니다.',
    icon: '✨',
    available: false,
    Component: () => null
  }
]
