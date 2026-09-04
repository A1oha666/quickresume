/**
 * 导出 Markdown：把当前简历模块渲染成可读的 .md 文本并下载。
 * 与 server-ai 的 buildResumeMarkdown 保持同构，保证「导出」与「同步到文件」内容一致。
 */

import type { ResumeModule } from '../api/resume'

const MODULE_LABELS: Record<string, string> = {
  basic_info: '基本信息',
  job_intention: '求职意向',
  education: '教育背景',
  internship: '实习经历',
  project: '项目经历',
  work_experience: '工作经历',
  skill: '专业技能',
  paper: '论文发表',
  research: '科研经历',
  award: '获奖情况',
}

const TITLE_KEYS = ['name', 'school', 'company', 'institution', 'title', 'position', 'degree', 'startDate', 'time']

function plainValue(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(plainValue).filter(Boolean).join('、')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, sv]) => sv != null && sv !== '')
      .map(([k, sv]) => `${k}: ${plainValue(sv)}`)
      .join('；')
  }
  return String(value)
}

function moduleToMd(module: ResumeModule): string {
  const content = module.content || {}
  const lines: string[] = []
  for (const [key, value] of Object.entries(content)) {
    if (value == null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      for (const item of value) {
        if (item && typeof item === 'object') {
          const entries = Object.entries(item as Record<string, unknown>).filter(([, sv]) => sv != null && sv !== '')
          if (entries.length === 0) continue
          const titleKey = TITLE_KEYS.find((tk) => entries.some(([ek]) => ek === tk))
          const titleEntry = titleKey ? entries.find(([ek]) => ek === titleKey) : null
          const rest = entries
            .filter(([ek]) => ek !== titleKey)
            .map(([ek, sv]) => `${ek}: ${plainValue(sv)}`)
            .join('；')
          lines.push(titleEntry ? `- ${plainValue(titleEntry[1])}${rest ? `（${rest}）` : ''}` : `- ${rest}`)
        } else if (item !== '') {
          lines.push(`- ${plainValue(item)}`)
        }
      }
    } else if (value && typeof value === 'object') {
      const rest = Object.entries(value as Record<string, unknown>)
        .filter(([, sv]) => sv != null && sv !== '')
        .map(([ek, sv]) => `${ek}: ${plainValue(sv)}`)
        .join('；')
      if (rest) lines.push(`- ${rest}`)
    } else {
      lines.push(`- ${key}: ${plainValue(value)}`)
    }
  }
  return lines.join('\n')
}

export function buildResumeMarkdownText(
  modules: ResumeModule[],
  options: { documentTitle?: string } = {},
): string {
  const parts: string[] = [
    `# ${options.documentTitle || '我的简历'}`,
    '',
    `> 导出时间：${new Date().toISOString()}`,
    '',
  ]
  const sorted = [...modules].sort((a, b) => a.sortOrder - b.sortOrder)
  for (const module of sorted) {
    const body = moduleToMd(module)
    parts.push(`## ${MODULE_LABELS[module.moduleType] || module.moduleType}`, '')
    parts.push(body ? body : '_（空）_', '')
  }
  return parts.join('\n')
}

export function downloadResumeMd(
  modules: ResumeModule[],
  _resumeId: number,
  options: { documentTitle?: string } = {},
): void {
  const text = buildResumeMarkdownText(modules, options)
  const safeTitle = (options.documentTitle || '简历').replace(/[\\/:*?"<>|]/g, '_')
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeTitle}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
