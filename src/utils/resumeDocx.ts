import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import type { ResumeModule } from '../api/resume'
import {
  normalizeAwardContent,
  normalizeBasicInfoContent,
  normalizeEducationContent,
  normalizeInternshipContent,
  normalizeJobIntentionContent,
  normalizePaperContent,
  normalizeProjectContent,
  normalizeResearchContent,
  normalizeSkillContent,
} from './moduleContent'
import { sortResumeModulesForDisplay } from './resumeDisplay'

type ParagraphChild = Paragraph

const SECTION_TITLES: Record<string, string> = {
  education: '教育背景',
  internship: '实习经历',
  work_experience: '工作经历',
  project: '项目经历',
  skill: '专业技能',
  paper: '论文发表',
  research: '科研经历',
  award: '获奖情况',
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function fmtDate(value: string): string {
  const text = clean(value)
  if (!text) return ''
  const [year, month] = text.split('-')
  if (!year) return text
  if (!month) return year
  return `${year}.${month}`
}

function formatDateRange(start: string, end: string): string {
  const begin = fmtDate(start)
  const finish = fmtDate(end)
  if (begin && finish) return `${begin} - ${finish}`
  if (begin) return `${begin} - 至今`
  return finish
}

function heading(text: string): ParagraphChild {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2 })
}

function boldLine(text: string, size = 24): ParagraphChild {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size })],
  })
}

function plain(text: string): ParagraphChild {
  return new Paragraph({ text })
}

function bullet(text: string): ParagraphChild {
  return new Paragraph({ text, bullet: { level: 0 } })
}

function pushLabeled(out: ParagraphChild[], label: string, value: string): void {
  const text = clean(value)
  if (!text) return
  out.push(
    new Paragraph({
      children: [new TextRun({ text: `${label}：`, bold: true }), new TextRun({ text })],
    })
  )
}

function renderEducation(module: ResumeModule): ParagraphChild[] {
  const c = normalizeEducationContent(module.content)
  const head = [c.school, c.department, c.major].filter(Boolean).join('   ')
  const sub = [c.degree, formatDateRange(c.startDate, c.endDate)].filter(Boolean).join('    ')
  const tags = [c.is985 ? '985' : '', c.is211 ? '211' : '', c.isDoubleFirst ? '双一流' : '']
    .filter(Boolean)
    .join(' / ')
  const out: ParagraphChild[] = []
  if (head) out.push(boldLine(head))
  if (sub) out.push(plain(sub))
  if (tags) out.push(plain(tags))
  return out
}

function renderInternship(module: ResumeModule): ParagraphChild[] {
  const c = normalizeInternshipContent(module.content)
  const out: ParagraphChild[] = []
  const head = [c.company, c.position].filter(Boolean).join('  ·  ')
  if (head) out.push(boldLine(head))
  const date = formatDateRange(c.startDate, c.endDate)
  if (date) out.push(plain(date))
  if (c.projectName) out.push(plain(c.projectName))
  if (c.techStack) pushLabeled(out, '技术栈', c.techStack)
  if (c.projectDescription) out.push(plain(c.projectDescription))
  for (const item of c.responsibilities) {
    if (clean(item)) out.push(bullet(item))
  }
  return out
}

function renderProject(module: ResumeModule): ParagraphChild[] {
  const c = normalizeProjectContent(module.content)
  const out: ParagraphChild[] = []
  const head = [c.projectName, c.role].filter(Boolean).join('  ·  ')
  if (head) out.push(boldLine(head))
  const date = formatDateRange(c.startDate, c.endDate)
  if (date) out.push(plain(date))
  if (c.techStack) pushLabeled(out, '技术栈', c.techStack)
  if (c.description) out.push(plain(c.description))
  for (const item of c.achievements) {
    if (clean(item)) out.push(bullet(item))
  }
  return out
}

function renderSkill(module: ResumeModule): ParagraphChild[] {
  const c = normalizeSkillContent(module.content)
  const out: ParagraphChild[] = []
  for (const category of c.categories) {
    const name = clean(category.name)
    const items = category.items.filter((item) => clean(item).length > 0)
    if (!name && items.length === 0) continue
    if (name) out.push(plain(name))
    if (items.length > 0) {
      out.push(plain(items.join('、')))
    }
  }
  return out
}

function renderPaper(module: ResumeModule): ParagraphChild[] {
  const c = normalizePaperContent(module.content)
  const out: ParagraphChild[] = []
  const head = [c.journalType, c.journalName].filter(Boolean).join('  ')
  if (head) out.push(boldLine(head))
  if (c.publishTime) pushLabeled(out, '发表时间', c.publishTime)
  if (c.content) out.push(plain(c.content))
  return out
}

function renderResearch(module: ResumeModule): ParagraphChild[] {
  const c = normalizeResearchContent(module.content)
  const out: ParagraphChild[] = []
  if (c.projectName) out.push(boldLine(c.projectName))
  if (c.projectCycle) pushLabeled(out, '项目周期', c.projectCycle)
  if (c.background) pushLabeled(out, '研究背景', c.background)
  if (c.workContent) pushLabeled(out, '工作内容', c.workContent)
  if (c.achievements) pushLabeled(out, '研究成果', c.achievements)
  return out
}

function renderAward(module: ResumeModule): ParagraphChild[] {
  const c = normalizeAwardContent(module.content)
  const line = [c.awardName, c.awardTime].filter(Boolean).join('    ')
  if (!line) return []
  return [plain(line)]
}

function renderJobIntention(module: ResumeModule): ParagraphChild[] {
  const c = normalizeJobIntentionContent(module.content)
  const out: ParagraphChild[] = []
  const line = [c.targetPosition, c.targetCity, c.salaryRange, c.expectedEntryDate]
    .filter(Boolean)
    .join('    ')
  if (line) out.push(plain(line))
  return out
}

function renderEntry(module: ResumeModule): ParagraphChild[] {
  switch (module.moduleType) {
    case 'education':
      return renderEducation(module)
    case 'internship':
    case 'work_experience':
      return renderInternship(module)
    case 'project':
      return renderProject(module)
    case 'skill':
      return renderSkill(module)
    case 'paper':
      return renderPaper(module)
    case 'research':
      return renderResearch(module)
    case 'award':
      return renderAward(module)
    case 'job_intention':
      return renderJobIntention(module)
    default:
      return []
  }
}

export async function downloadResumeDocx(
  modules: ResumeModule[],
  _resumeId: number,
  options?: { documentTitle?: string }
): Promise<void> {
  const sorted = sortResumeModulesForDisplay(modules)
  if (sorted.length === 0) {
    throw new Error('没有可导出的简历内容')
  }

  const basicInfoModule = sorted.find((module) => module.moduleType === 'basic_info')
  const basic = basicInfoModule ? normalizeBasicInfoContent(basicInfoModule.content) : null

  const children: ParagraphChild[] = []

  // ===== 头部：姓名 + 求职意向 + 联系方式 + 个人总结 =====
  if (basic?.name) {
    children.push(
      new Paragraph({
        text: basic.name,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    )
  }

  const intentionLine = [basic?.jobIntention, basic?.targetCity, basic?.salaryRange, basic?.expectedEntryDate]
    .filter(Boolean)
    .join('    ')
  if (intentionLine) {
    children.push(new Paragraph({ text: intentionLine, alignment: AlignmentType.CENTER }))
  }

  const contactParts = [
    basic?.phone,
    basic?.email,
    basic?.wechat ? `微信:${basic.wechat}` : '',
    basic?.github ? `GitHub:${basic.github}` : '',
    basic?.blog ? `博客:${basic.blog}` : '',
    basic?.leetcode ? `LeetCode:${basic.leetcode}` : '',
  ].filter(Boolean)
  if (contactParts.length > 0) {
    children.push(new Paragraph({ text: contactParts.join('    '), alignment: AlignmentType.CENTER }))
  }

  if (basic?.summary) {
    children.push(heading('个人总结'))
    children.push(plain(basic.summary))
  }

  // ===== 各模块 =====
  let currentType: string | null = null
  for (const module of sorted) {
    if (module.moduleType === 'basic_info') continue
    if (module.moduleType !== currentType) {
      currentType = module.moduleType
      const title = SECTION_TITLES[module.moduleType] ?? module.moduleType
      children.push(heading(title))
    }
    const entry = renderEntry(module)
    if (entry.length > 0) {
      children.push(...entry)
      // 条目之间留一点空隙
      children.push(new Paragraph({ text: '' }))
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const fileName = `${options?.documentTitle || basic?.name || '简历'}.docx`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
