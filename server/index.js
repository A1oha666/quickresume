/**
 * QuickResume 单服务（前端静态托管 + 简历同步 + 健康检查）
 *
 * 只做三件事：
 *  1. 托管前端静态页面（dist/）
 *  2. 简历保存即同步：POST/GET /api/resume/sync → 写 resume-backup.json + 简历-最新.md
 *  3. 健康检查 /health
 *
 * 设计要点：
 *  - 本地模式，无账号、无数据库、无 AI、无第三方云。
 *  - 文件写入只落到约定的数据路径（resume-data/resume-backup.json 与 简历-最新.md），
 *    绝不接受请求中传入的任意路径。
 *  - 写入采用「临时文件 + rename」原子替换，避免写入中途进程退出导致文件损坏。
 *
 * 运行：node index.js（需 Node >= 18）
 * 依赖：仅 express
 *
 * 环境变量（均为可选，值仅为占位，不含任何真实地址/密钥）：
 *  PORT            监听端口，默认 3456
 *  DIST_DIR        前端构建产物目录，默认 <项目根>/dist
 *  RESUME_DATA_DIR 备份 JSON 目录，默认 <项目根>/resume-data
 *  RESUME_MD_FILE  Markdown 备份文件，默认 <项目根>/简历-最新.md
 */

const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
app.use(express.json({ limit: '2mb' }))

const PORT = process.env.PORT || 3456
const DIST_DIR = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(__dirname, '..', 'dist')
const DATA_DIR = process.env.RESUME_DATA_DIR ? path.resolve(process.env.RESUME_DATA_DIR) : path.join(__dirname, '..', 'resume-data')
const BACKUP_FILE = path.join(DATA_DIR, 'resume-backup.json')
const MD_FILE = process.env.RESUME_MD_FILE ? path.resolve(process.env.RESUME_MD_FILE) : path.join(__dirname, '..', '简历-最新.md')
const hasDist = () => fs.existsSync(path.join(DIST_DIR, 'index.html'))

// ===== 工具 =====

function apiOk(data) {
  return { code: 200, message: 'success', data }
}

function apiError(message) {
  return { code: 500, message, data: null }
}

function moduleTypeLabel(type) {
  const map = {
    education: '教育背景',
    internship: '实习经历',
    project: '项目经历',
    work: '工作经历',
    skill: '专业技能',
    paper: '论文发表',
    research: '科研经历',
    award: '获奖情况',
    basic: '基本信息',
    basic_info: '基本信息',
    job_intention: '求职意向',
    work_experience: '工作经历',
  }
  return map[type] || type
}

// ===== 简历 → Markdown 渲染 =====

const MD_TITLE_KEYS = ['name', 'school', 'company', 'institution', 'title', 'position', 'degree', 'startDate', 'time']

function mdPlainValue(v) {
  if (v == null) return ''
  if (Array.isArray(v)) return v.map(mdPlainValue).filter(Boolean).join('、')
  if (typeof v === 'object') {
    return Object.entries(v)
      .filter(([, sv]) => sv != null && sv !== '')
      .map(([k, sv]) => `${k}: ${mdPlainValue(sv)}`)
      .join('；')
  }
  return String(v)
}

function moduleToMd(module) {
  const c = module.content || {}
  const lines = []
  for (const [k, v] of Object.entries(c)) {
    if (v == null || v === '') continue
    if (Array.isArray(v)) {
      if (v.length === 0) continue
      for (const item of v) {
        if (item && typeof item === 'object') {
          const entries = Object.entries(item).filter(([, sv]) => sv != null && sv !== '')
          if (entries.length === 0) continue
          const titleKey = MD_TITLE_KEYS.find((tk) => entries.some(([ek]) => ek === tk))
          const titleEntry = titleKey ? entries.find(([ek]) => ek === titleKey) : null
          const rest = entries
            .filter(([ek]) => ek !== titleKey)
            .map(([ek, sv]) => `${ek}: ${mdPlainValue(sv)}`)
            .join('；')
          lines.push(titleEntry ? `- ${mdPlainValue(titleEntry[1])}${rest ? `（${rest}）` : ''}` : `- ${rest}`)
        } else if (item !== '') {
          lines.push(`- ${mdPlainValue(item)}`)
        }
      }
    } else if (v && typeof v === 'object') {
      const rest = Object.entries(v)
        .filter(([, sv]) => sv != null && sv !== '')
        .map(([ek, sv]) => `${ek}: ${mdPlainValue(sv)}`)
        .join('；')
      if (rest) lines.push(`- ${rest}`)
    } else {
      lines.push(`- ${k}: ${mdPlainValue(v)}`)
    }
  }
  return lines.join('\n')
}

function buildResumeMarkdown(db) {
  const parts = [
    '# 简历-最新（QuickResume 自动同步）',
    '',
    `> 更新时间：${new Date().toISOString()}`,
    '> 由 QuickResume 编辑器保存时自动生成；这是"简历资料库"的最新版本。',
    '',
  ]
  for (const r of db.resumes) {
    parts.push(`## ${r.title || `简历 ${r.id}`}（ID: ${r.id}）`, '')
    const modules = (r.modules || []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
    for (const m of modules) {
      const body = moduleToMd(m)
      parts.push(`### ${moduleTypeLabel(m.moduleType)}`, '')
      parts.push(body ? body : '_（空）_', '')
    }
  }
  return parts.join('\n')
}

// ===== 原子写入（临时文件 + rename）=====

function atomicWrite(targetPath, content) {
  const dir = path.dirname(targetPath)
  fs.mkdirSync(dir, { recursive: true })
  const tmpPath = path.join(dir, `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.tmp`)
  try {
    fs.writeFileSync(tmpPath, content, 'utf-8')
    fs.renameSync(tmpPath, targetPath)
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
    } catch { /* ignore cleanup failure */ }
    throw err
  }
}

// ===== 简历文件同步（编辑保存自动备份 + 一键恢复）=====

app.post('/api/resume/sync', (req, res) => {
  try {
    const body = req.body
    const db = body && body.db ? body.db : body
    if (!db || typeof db !== 'object' || !Array.isArray(db.resumes)) {
      return res.json(apiError('数据格式不正确：需要完整的简历数据库'))
    }
    atomicWrite(BACKUP_FILE, JSON.stringify(db, null, 2))
    atomicWrite(MD_FILE, buildResumeMarkdown(db))
    res.json(apiOk({
      backupFile: BACKUP_FILE,
      mdFile: MD_FILE,
      updatedAt: new Date().toISOString(),
    }))
  } catch (e) {
    console.error('[QuickResume] resume-sync error:', e.message)
    res.json(apiError(e.message))
  }
})

app.get('/api/resume/sync', (_req, res) => {
  try {
    if (!fs.existsSync(BACKUP_FILE)) return res.json(apiOk(null))
    const db = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'))
    res.json(apiOk(db))
  } catch (e) {
    res.json(apiError(e.message))
  }
})

// ===== 健康检查 =====

app.get('/health', (_req, res) => {
  res.json(apiOk({ status: 'ok' }))
})

// ===== 前端静态托管（单服务模式）=====

if (hasDist()) {
  app.use(express.static(DIST_DIR))
}

app.get('/', (_req, res) => {
  if (hasDist()) return res.sendFile(path.join(DIST_DIR, 'index.html'))
  res.json(apiOk({ message: 'QuickResume 服务已启动，但缺少前端构建产物（dist/），请确认部署包完整' }))
})

// ===== SPA fallback =====

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.json(apiOk(null))
    return
  }
  if (hasDist()) {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
    return
  }
  res.json(apiOk(null))
})

app.listen(PORT, () => {
  console.log(`[QuickResume] 启动成功，端口: ${PORT}`)
  console.log(`[QuickResume] 简历编辑器: http://localhost:${PORT}`)
  console.log(`[QuickResume] 健康检查:   http://localhost:${PORT}/health`)
  console.log(`[QuickResume] 简历同步到: ${MD_FILE}`)
})
