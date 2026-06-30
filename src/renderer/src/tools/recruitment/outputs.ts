import Handlebars from 'handlebars'
import type { ReplacementInputs } from './inputs'
import { buildContext, type RenderContext } from './compute'

export type OutputCategory = 'draft' | 'sms' | 'row' | 'table' | 'contract'

export type WorkbookSpec = {
  filename: string
  sheets: { name: string; rows: (string | number)[][] }[]
}

export type OutputTemplate = {
  id: string
  name: string
  category: OutputCategory
  title?: string
  body: string
  excelBuilder?: (ctx: RenderContext) => WorkbookSpec
}

export type RenderedOutput = {
  id: string
  name: string
  category: OutputCategory
  title?: string
  text: string
  excel?: WorkbookSpec
}

export const OUTPUT_TEMPLATES: OutputTemplate[] = [
  {
    id: 'draft-criminal',
    name: '기안 ① 성범죄·아동학대 전력조회 결과 보고',
    category: 'draft',
    title: '성범죄 및 아동학대관련범죄 전력조회 결과({{f.subNameMasked}})',
    body: `1. 관련: {{approvalRef}}
2. {{f.contractStart}}~{{f.contractEnd}} {{origJob}} {{origName}}의 {{leaveReason}}에 따른 대체직 채용자의 성범죄 및 아동학대관련 범죄조회 결과 "해당없음"을 붙임과 같이 보고하고자 합니다.

붙임  성범죄 경력 및 아동학대관련범죄 전력조회 회신서 1부.  끝.`
  },
  {
    id: 'draft-contract',
    name: '기안 ② 근로계약 체결 보고',
    category: 'draft',
    title: '[근로계약] {{origJob}} 대체인력 일용근로계약 체결 보고',
    body: `1. 관련: {{approvalRef}}
2. {{origJob}} {{origName}}의 {{leaveReason}}에 따라 대체인력을 아래와 같이 채용하여 보고하고자 합니다.
  가. 근로자명: {{subName}}({{f.subRRNMasked}})
  나. 계약기간: {{f.contractRange}}
  다. 근무시간: {{f.workTimeRange}}
  라. 수당내역: {{f.laborSummary}}

붙임  근로계약서 1부.  끝.`
  },
  {
    id: 'draft-hire-report',
    name: '기안 ③ 교육지원청 채용보고',
    category: 'draft',
    title: '[채용보고]교육공무직원({{origJob}}) {{leaveReason}} 사용으로 인한 대체직 채용',
    body: `1. 관련
  가. 경기도교육청 교육공무직원 운영 규정 제10조
  나. {{laborAffairsRef}}
2. 우리 기관에서 근무 중인 {{origJob}}의 {{leaveReason}} 사용으로 인해 대체인력을 채용하였기에
   아래와 같이 보고합니다.

   - 원근로자: {{origJob}} {{origName}}({{f.origBirth}}) / 무기계약 전환일 {{f.origPermDate}}
   - 대체근로자: {{subName}} / {{subGender}} / {{f.subBirth}} / {{subAge}}
   - 계약기간: {{f.contractRange}}
   - 수당내역: {{f.laborSummary}}

붙임  휴가 사용 보고 및 대체직 채용 1부.  끝.`
  },
  {
    id: 'draft-hire-report-attachment',
    name: '기안 ③ 첨부 표 (휴가 사용 보고 + 대체직 채용)',
    category: 'draft',
    body: `□ 휴가 사용 보고

직종명\t성명(생년월일)\t무기계약 전환일\t휴가 보고 사항
{{origJob}}\t{{f.origNameWithBirth}}\t{{f.origPermDate}}\t{{f.leaveLawClause}}{{#if leaveDetailNote}}
\t\t\t[{{leaveDetailNote}}]{{/if}}

□ 대체직 채용

직종명\t충원인원\t채용(예정)일 및 채용자\t근무기간(연장)\t장애인고용 희망여부\t비고
{{subJob}}\t1\t{{f.contractStart}}~{{f.contractEnd}}\t연장없음\t×\t근로계약 서류 본교 보관
\t\t{{f.subNameWithBirth}}

끝.`,
    excelBuilder: (ctx) => ({
      filename: '기안첨부_휴가보고및대체직채용',
      sheets: [
        {
          name: '휴가 사용 보고',
          rows: [
            ['직종명', '성명(생년월일)', '무기계약 전환일', '휴가 보고 사항'],
            [
              ctx.origJob,
              ctx.f.origNameWithBirth,
              ctx.f.origPermDate,
              ctx.leaveDetailNote
                ? `${ctx.f.leaveLawClause}\n[${ctx.leaveDetailNote}]`
                : ctx.f.leaveLawClause
            ]
          ]
        },
        {
          name: '대체직 채용',
          rows: [
            ['직종명', '충원인원', '채용(예정)일 및 채용자', '근무기간(연장)', '장애인고용 희망여부', '비고'],
            [
              ctx.subJob,
              1,
              `${ctx.f.contractStart}~${ctx.f.contractEnd}\n${ctx.f.subNameWithBirth}`,
              '연장없음',
              '×',
              '근로계약 서류 본교 보관'
            ]
          ]
        }
      ]
    })
  },
  {
    id: 'sms-payslip',
    name: '임금명세서 SMS (문자)',
    category: 'sms',
    body: `안녕하세요. {{schoolName}} {{officeName}}입니다.
급여 지급되어 임금명세서 보내드리니 확인부탁드립니다.

[임금명세서]
근로자명: {{subName}}
직종: {{subJob}}
근로일: {{f.contractRange}}
지급일: {{f.payDate}}

▷ 임금: {{f.grossSalary}}(={{f.hourlyWage}}*{{hours}}시간)
▷ 공제액(고용보험): {{f.deduction}}(=임금*{{f.unemploymentRate}})
▶ 실지급액: {{f.netPay}}

감사합니다.`
  },
  {
    id: 'register-row',
    name: '발령대장 1행 (탭 구분 — 엑셀 복붙용)',
    category: 'row',
    body: `일자\t소속\t직급 및 직위\t성명\t발령사항\t발령권자\t발령 근거\t기재자\t확인자\t비고
{{f.hireDate}}\t{{schoolName}}\t{{subJob}}\t{{subName}}\t채용\t{{principalName}}\t{{appointmentBasis}}\t\t(날인)\t({{f.contractRange}})`,
    excelBuilder: (ctx) => ({
      filename: '발령대장',
      sheets: [
        {
          name: '발령대장',
          rows: [
            ['일자', '소속', '직급 및 직위', '성명', '발령사항', '발령권자', '발령 근거', '기재자', '확인자', '비고'],
            [
              ctx.f.hireDate,
              ctx.schoolName,
              ctx.subJob,
              ctx.subName,
              '채용',
              ctx.principalName,
              ctx.appointmentBasis,
              '',
              '(날인)',
              `(${ctx.f.contractRange})`
            ]
          ]
        }
      ]
    })
  },
  {
    id: 'report-row',
    name: '근로내용확인신고서 1행 (탭 구분)',
    category: 'row',
    body: `성명\t주민등록번호\t근무기간\t근무일수(평일)\t지급금액\t일평균 근로시간\t신고월\t신고여부
{{subName}}\t{{subRRN}}\t{{f.contractStart}}~{{f.contractEnd}}\t{{days}}\t{{grossSalary}}\t{{hours}}\t{{filingMonth}}\tO`,
    excelBuilder: (ctx) => ({
      filename: '근로내용확인신고서',
      sheets: [
        {
          name: '신고서',
          rows: [
            ['성명', '주민등록번호', '근무기간', '근무일수(평일)', '지급금액', '일평균 근로시간', '신고월', '신고여부'],
            [
              ctx.subName,
              ctx.subRRN,
              `${ctx.f.contractStart}~${ctx.f.contractEnd}`,
              parseInt(ctx.days, 10) || 0,
              ctx.grossSalary,
              parseFloat(ctx.hours) || 0,
              ctx.filingMonth,
              'O'
            ]
          ]
        }
      ]
    })
  },
  {
    id: 'support-row',
    name: '대체인력비 지원신청 1행',
    category: 'row',
    body: `[대체인력비 지원신청]
학교명: {{schoolName}}
사유: {{leaveReason}}
지원 대상(원근로자):
  - 직종: {{origJob}}
  - 성명: {{origName}}
  - 기간: {{f.contractStart}}~{{f.contractEnd}}
대체인건비 신청내역:
  - 원근로자 유급일수: {{days}}일 / 소계: {{f.grossSalary}}
  - 대체인력 유급일수: 0일 / 소계: {{f.grossSalary}}
신청액(원, 기관부담금): {{f.employerContribution}}
대체인력 채용현황:
  - 성명: {{subName}}
  - 생년월일: {{f.subBirth}}
  - 성별: {{subGender}}
  - 비고: {{leaveReason}} {{days}}일`,
    excelBuilder: (ctx) => ({
      filename: '대체인력비_지원신청',
      sheets: [
        {
          name: '지원신청',
          rows: [
            [
              '학교명',
              '사유',
              '원근로자 직종',
              '원근로자 성명',
              '원근로자 기간',
              '원근로자 유급일수',
              '원근로자 소계(원)',
              '대체인력 유급일',
              '대체인력 소계(원)',
              '신청액(원, 기관부담금)',
              '대체인력 성명',
              '대체인력 생년월일',
              '대체인력 성별',
              '비고'
            ],
            [
              ctx.schoolName,
              ctx.leaveReason,
              ctx.origJob,
              ctx.origName,
              `${ctx.f.contractStart}~${ctx.f.contractEnd}`,
              parseInt(ctx.days, 10) || 0,
              ctx.grossSalary,
              0,
              ctx.grossSalary,
              ctx.employerContribution,
              ctx.subName,
              ctx.f.subBirth,
              ctx.subGender,
              `${ctx.leaveReason} ${ctx.days}일`
            ]
          ]
        }
      ]
    })
  },
  {
    id: 'contract-body',
    name: '근로계약서 본문',
    category: 'contract',
    body: `근로계약서

{{principalName}}(이하 "사용자"라 함)과 교육공무직원 {{subJob}} {{subName}}
(이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.

1. 근로자의 인적사항
   - 성명     : {{subName}}
   - 성별     : {{subGender}}
   - 연령     : {{subAge}}
   - 생년월일 : {{f.subBirth}}
   - 현 주소  : {{subAddress}}
   - 연락처   : {{subPhone}}
   - 채용일   : {{f.hireDate}}
   - 직종     : {{subJob}}
   - 계약형태 : 기간제

2. 계약기간 : {{f.contractRange}}
   ※ 단, 계약기간 종료 이전에 원근로자의 휴가 사유가 소멸하면 당해 계약을 해지할 수 있음

3. 근무 장소 및 근무내용
   ㅇ 근무장소 : {{schoolName}} 급식실(운영부서장이 정하는 장소)
   ㅇ 근무내용 : {{origJob}} {{origName}}의 업무 대체

4. 근무일 및 근로시간
   ㅇ 근무일 및 근로시간 : 일{{hours}}시간
     (휴게시간 : 근로기준법 54조에 따라 부여한다.)

5. 임금
   ㅇ 구성항목 및 계산방법
     - 일급 {{f.grossSalary}}
   ㅇ 지급방법 : 계약 종료 후 3일 이내 근로자의 계좌로 입금한다.
     (계좌번호 : {{subAccount}})

6. 휴일 및 휴가 등
   ㅇ 주휴일은 매주 일요일로 하고, 근로자의 날(5월1일)은 유급휴일로 한다.
   ㅇ 그 외 휴일 및 휴가 등은 『경기도교육청 교육공무직원 취업규칙』에 의한다.

7. 해고 및 징계
   ㅇ 해고 및 징계에 관한 사항은 『경기도교육청 교육공무직원 취업규칙』에 의한다.

8. 연차보상 및 퇴직금
   ㅇ 연차보상 및 퇴직금에 관한 사항은 『경기도교육청 교육공무직원 취업규칙』에 의한다.

9. 기타
   ㅇ 기타 이 계약서에서 정하지 아니한 사항은 『근로기준법』, 『기간제 및 단시간 근로자보호 등에 관한 법률』, 『남녀고용평등과 일가정 양립 지원에 관한 법률』 등 노동법 관련 법률에 정하는 바에 따른다.

위 계약내용에 대하여 2통을 작성하여 사용자와 근로자가 각각 1통 보관한다.

                                        {{f.contractWriteDate}}

                  사용자 :  {{principalName}}                (인)

                  근로자 :  성   명   {{subName}}            (인)
                            생년월일  {{f.subBirth}}
                            주   소   {{subAddress}}`
  },
  {
    id: 'salary-table',
    name: '임금 계산표 (검토용)',
    category: 'table',
    body: `[임금 계산표]
────────────────────────────────
시급(원)        : {{f.hourlyWage}}
근무시간        : {{hours}}시간
근무일수        : {{days}}일
임금 총액       : {{f.grossSalary}}
────────────────────────────────
공제액(고용보험): {{f.deduction}}  (요율 {{f.unemploymentRate}})
실수령액        : {{f.netPay}}
────────────────────────────────
기관부담금      : {{f.employerContribution}}  (요율 {{f.employerRate}})
지급일          : {{f.payDate}}`
  }
]

const compileCache = new Map<string, HandlebarsTemplateDelegate>()

function compile(body: string): HandlebarsTemplateDelegate {
  let fn = compileCache.get(body)
  if (!fn) {
    fn = Handlebars.compile(body, { noEscape: true })
    compileCache.set(body, fn)
  }
  return fn
}

export function renderOutputs(inputs: ReplacementInputs): RenderedOutput[] {
  const ctx = buildContext(inputs)
  return OUTPUT_TEMPLATES.map((t) => {
    const titleFn = t.title ? compile(t.title) : null
    const bodyFn = compile(t.body)
    const titleText = titleFn ? titleFn(ctx) : undefined
    const bodyText = bodyFn(ctx)
    const text = titleText ? `[제목] ${titleText}\n\n${bodyText}` : bodyText
    const excel = t.excelBuilder ? t.excelBuilder(ctx) : undefined
    return { id: t.id, name: t.name, category: t.category, title: titleText, text, excel }
  })
}
