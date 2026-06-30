import type { ToolModule } from '../types'
import { RecruitmentTool } from './RecruitmentTool'

export const recruitmentTool: ToolModule = {
  id: 'recruitment-docs',
  name: '대체 채용 자동화',
  description: '대체채용 한 건의 정보를 입력하면 기안·임금명세서·발령대장·신고서 등 행정 산출물을 한 번에 생성합니다.',
  icon: '📄',
  available: true,
  Component: RecruitmentTool
}
