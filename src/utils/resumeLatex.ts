/**
 * 导出 LaTeX：把当前简历模块渲染成可编译的 .tex 文件并下载。
 * 使用 ctexart 文档类支持中文，模块渲染与 Word / Markdown 导出保持同构。
 */

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

const SECTION_TITLES: Record<string, string> = {
  education: '教育背景',
  internship: '实习经历',
  work_experience: '工作经历',
  project: '项目经历',
  skill: '专业技能',
  paper: '论文发表',
  research: '科研经历',
  award: '获奖情况',
  job_intention: '求职意向',
}

// LaTeX 特殊字符转义（反斜杠必须最先处理）
function esc(value: string): string {
  return value
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
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

// 条目头：左侧粗体标题、右侧日期（\hfill 右对齐）
function entryHead(left: string, right: string): string {
  const l = clean(left)
  const r = clean(right)
  if (l && r) return `\\noindent\\textbf{${esc(l)}}\\hfill ${esc(r)}\\par`
  if (l) return `\\noindent\\textbf{${esc(l)}}\\par`
  return r ? `\\noindent ${esc(r)}\\par` : ''
}

function plainLine(text: string): string {
  const t = clean(text)
  return t ? `\\noindent ${esc(t)}\\par` : ''
}

function bulletList(items: string[]): string {
  const list = items
    .map((item) => clean(item))
    .filter(Boolean)
    .map((item) => `  \\item ${esc(item)}`)
  if (list.length === 0) return ''
  return `\\begin{itemize}[nosep,leftmargin=1.5em]\n${list.join('\n')}\n\\end{itemize}`
}

function renderEducation(module: ResumeModule): string[] {
  const c = normalizeEducationContent(module.content)
  const out: string[] = []
  const head = entryHead(
    [c.school, c.department, c.major].filter(Boolean).join('  |  '),
    formatDateRange(c.startDate, c.endDate),
  )
  if (head) out.push(head)
  const sub = [
    c.degree,
    [c.is985 ? '985' : '', c.is211 ? '211' : '', c.isDoubleFirst ? '双一流' : ''].filter(Boolean).join(' / '),
  ].filter(Boolean).join('  |  ')
  if (sub) out.push(plainLine(sub))
  return out
}

function renderInternship(module: ResumeModule): string[] {
  const c = normalizeInternshipContent(module.content)
  const out: string[] = []
  const head = entryHead(
    [c.company, c.position].filter(Boolean).join(' · '),
    formatDateRange(c.startDate, c.endDate),
  )
  if (head) out.push(head)
  if (c.projectName) out.push(plainLine(c.projectName))
  if (c.techStack) out.push(plainLine(`技术栈：${c.techStack}`))
  if (c.projectDescription) out.push(plainLine(c.projectDescription))
  const list = bulletList(c.responsibilities)
  if (list) out.push(list)
  return out
}

function renderProject(module: ResumeModule): string[] {
  const c = normalizeProjectContent(module.content)
  const out: string[] = []
  const head = entryHead(
    [c.projectName, c.role].filter(Boolean).join(' · '),
    formatDateRange(c.startDate, c.endDate),
  )
  if (head) out.push(head)
  if (c.techStack) out.push(plainLine(`技术栈：${c.techStack}`))
  if (c.description) out.push(plainLine(c.description))
  const list = bulletList(c.achievements)
  if (list) out.push(list)
  return out
}

function renderSkill(module: ResumeModule): string[] {
  const c = normalizeSkillContent(module.content)
  const out: string[] = []
  for (const category of c.categories) {
    const name = clean(category.name)
    const items = category.items.filter((item) => clean(item).length > 0)
    if (!name && items.length === 0) continue
    if (name && items.length > 0) {
      out.push(plainLine(`${name}：${items.join('、')}`))
    } else if (name) {
      out.push(plainLine(name))
    } else {
      out.push(plainLine(items.join('、')))
    }
  }
  return out
}

function renderPaper(module: ResumeModule): string[] {
  const c = normalizePaperContent(module.content)
  const out: string[] = []
  const head = entryHead(
    [c.journalType, c.journalName].filter(Boolean).join('  |  '),
    c.publishTime,
  )
  if (head) out.push(head)
  if (c.content) out.push(plainLine(c.content))
  return out
}

function renderResearch(module: ResumeModule): string[] {
  const c = normalizeResearchContent(module.content)
  const out: string[] = []
  if (c.projectName) out.push(entryHead(c.projectName, c.projectCycle))
  if (c.background) out.push(plainLine(`研究背景：${c.background}`))
  if (c.workContent) out.push(plainLine(`工作内容：${c.workContent}`))
  if (c.achievements) out.push(plainLine(`研究成果：${c.achievements}`))
  return out
}

function renderAward(module: ResumeModule): string[] {
  const c = normalizeAwardContent(module.content)
  const head = entryHead(c.awardName, c.awardTime)
  return head ? [head] : []
}

function renderJobIntention(module: ResumeModule): string[] {
  const c = normalizeJobIntentionContent(module.content)
  const line = [c.targetPosition, c.targetCity, c.salaryRange, c.expectedEntryDate]
    .filter(Boolean)
    .join('  |  ')
  return line ? [plainLine(line)] : []
}

function renderEntry(module: ResumeModule): string[] {
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

export function buildResumeLatexText(modules: ResumeModule[]): string {
  const sorted = sortResumeModulesForDisplay(modules)
  const basicInfoModule = sorted.find((module) => module.moduleType === 'basic_info')
  const basic = basicInfoModule ? normalizeBasicInfoContent(basicInfoModule.content) : null

  const parts: string[] = [
    '% 简历 LaTeX 源文件（由 QuickResume 生成）',
    '% 编译方式：xelatex resume.tex（ctexart 文档类需要 XeLaTeX）',
    '\\documentclass[11pt,a4paper]{ctexart}',
    '\\usepackage[margin=1.8cm]{geometry}',
    '\\usepackage{enumitem}',
    '\\usepackage{titlesec}',
    '\\usepackage[hidelinks]{hyperref}',
    '',
    '\\titleformat{\\section}{\\large\\bfseries}{}{0pt}{}',
    '\\titlespacing*{\\section}{0pt}{0.9em}{0.4em}',
    '\\setlength{\\parindent}{0pt}',
    '\\setlength{\\parskip}{0.25em}',
    '\\pagestyle{empty}',
    '',
    '\\begin{document}',
    '',
  ]

  // ===== 头部：姓名 + 求职意向 + 联系方式 =====
  const headerLines: string[] = []
  if (basic?.name) {
    headerLines.push(`  {\\LARGE\\bfseries ${esc(basic.name)}}`)
  }
  const intentionLine = [basic?.jobIntention, basic?.targetCity, basic?.salaryRange, basic?.expectedEntryDate]
    .filter(Boolean)
    .join('  |  ')
  if (intentionLine) {
    headerLines.push(`  ${esc(intentionLine)}`)
  }
  const contactParts = [
    basic?.phone,
    basic?.email,
    basic?.wechat ? `微信：${basic.wechat}` : '',
    basic?.github ? `GitHub：${basic.github}` : '',
    basic?.blog ? `博客：${basic.blog}` : '',
    basic?.leetcode ? `LeetCode：${basic.leetcode}` : '',
  ].filter(Boolean)
  if (contactParts.length > 0) {
    headerLines.push(`  ${esc(contactParts.join('  |  '))}`)
  }
  if (headerLines.length > 0) {
    parts.push('\\begin{center}')
    parts.push(...headerLines)
    parts.push('\\end{center}')
    parts.push('')
  }

  // ===== 个人总结 =====
  if (basic?.summary) {
    parts.push('\\section*{个人总结}')
    parts.push(esc(basic.summary))
    parts.push('')
  }

  // ===== 各模块（按显示顺序分组渲染节标题）=====
  let currentType: string | null = null
  for (const module of sorted) {
    if (module.moduleType === 'basic_info') continue
    if (module.moduleType !== currentType) {
      currentType = module.moduleType
      const title = SECTION_TITLES[module.moduleType] ?? module.moduleType
      parts.push(`\\section*{${esc(title)}}`)
    }
    const entry = renderEntry(module)
    if (entry.length > 0) {
      parts.push(...entry)
      parts.push('\\medskip')
    }
  }

  parts.push('', '\\end{document}')
  return parts.join('\n')
}

export function downloadResumeLatex(
  modules: ResumeModule[],
  _resumeId: number,
  options: { documentTitle?: string } = {},
): void {
  if (modules.length === 0) {
    throw new Error('没有可导出的简历内容')
  }

  const text = buildResumeLatexText(modules)
  const safeTitle = (options.documentTitle || '简历').replace(/[\\/:*?"<>|]/g, '_')
  const blob = new Blob([text], { type: 'application/x-tex;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeTitle}.tex`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
