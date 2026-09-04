/**
 * 本地模式：使用 localStorage 存储简历数据，无需后端 API。
 */

const STORAGE_KEY = 'quickresume:local-db'

export interface LocalResume {
  id: number
  title: string
  templateId: string
  modules: LocalModule[]
  createdAt: string
  updatedAt: string
}

export interface LocalModule {
  id: number
  resumeId: number
  moduleType: string
  content: Record<string, unknown>
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface LocalDb {
  nextResumeId: number
  nextModuleId: number
  resumes: LocalResume[]
}

function now(): string {
  return new Date().toISOString()
}

function loadDb(): LocalDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as LocalDb
  } catch { /* ignore */ }
  return { nextResumeId: 1, nextModuleId: 1, resumes: [] }
}

function saveDb(db: LocalDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function mapResume(r: LocalResume) {
  return { id: r.id, title: r.title, templateId: r.templateId, createdAt: r.createdAt, updatedAt: r.updatedAt }
}

function mapModule(m: LocalModule) {
  return { id: m.id, resumeId: m.resumeId, moduleType: m.moduleType, content: m.content, sortOrder: m.sortOrder, createdAt: m.createdAt, updatedAt: m.updatedAt }
}

export const localDb = {
  /** 获取简历列表 */
  list() {
    const db = loadDb()
    return db.resumes.map(mapResume)
  },

  /** 创建简历 */
  create(title: string, templateId = 'campus-blue') {
    const db = loadDb()
    const resume: LocalResume = {
      id: db.nextResumeId++,
      title,
      templateId,
      modules: [],
      createdAt: now(),
      updatedAt: now(),
    }
    db.resumes.push(resume)
    saveDb(db)
    return mapResume(resume)
  },

  /** 导入简历 */
  importResume(title: string, templateId: string | undefined, modules: Array<{ moduleType: string; content: Record<string, unknown>; sortOrder: number }>) {
    const db = loadDb()
    const resume: LocalResume = {
      id: db.nextResumeId++,
      title,
      templateId: templateId || 'campus-blue',
      modules: modules.map((m) => ({
        id: db.nextModuleId++,
        resumeId: db.nextResumeId - 1, // will be fixed below
        moduleType: m.moduleType,
        content: m.content,
        sortOrder: m.sortOrder,
        createdAt: now(),
        updatedAt: now(),
      })),
      createdAt: now(),
      updatedAt: now(),
    }
    // Fix resumeId references
    const resumeId = resume.id
    resume.modules.forEach((m) => { m.resumeId = resumeId })
    db.resumes.push(resume)
    saveDb(db)
    return mapResume(resume)
  },

  /** 重命名 */
  update(id: number, title: string) {
    const db = loadDb()
    const r = db.resumes.find((x) => x.id === id)
    if (!r) throw new Error('简历不存在')
    r.title = title
    r.updatedAt = now()
    saveDb(db)
    return mapResume(r)
  },

  /** 删除 */
  delete(id: number) {
    const db = loadDb()
    db.resumes = db.resumes.filter((r) => r.id !== id)
    saveDb(db)
  },

  /** 获取模块 */
  getModules(resumeId: number) {
    const db = loadDb()
    const r = db.resumes.find((x) => x.id === resumeId)
    if (!r) return []
    return r.modules.sort((a, b) => a.sortOrder - b.sortOrder).map(mapModule)
  },

  /** 获取单个模块 */
  getModule(resumeId: number, moduleId: number) {
    const db = loadDb()
    const r = db.resumes.find((x) => x.id === resumeId)
    return r?.modules.find((m) => m.id === moduleId) ?? null
  },

  /** 添加模块 */
  addModule(resumeId: number, moduleType: string, content: Record<string, unknown>, sortOrder?: number) {
    const db = loadDb()
    const r = db.resumes.find((x) => x.id === resumeId)
    if (!r) throw new Error('简历不存在')
    const maxSort = r.modules.reduce((max, m) => Math.max(max, m.sortOrder), -1)
    const mod: LocalModule = {
      id: db.nextModuleId++,
      resumeId,
      moduleType,
      content,
      sortOrder: sortOrder ?? maxSort + 1,
      createdAt: now(),
      updatedAt: now(),
    }
    r.modules.push(mod)
    r.updatedAt = now()
    saveDb(db)
    return mapModule(mod)
  },

  /** 更新模块 */
  updateModule(resumeId: number, moduleId: number, content: Record<string, unknown>) {
    const db = loadDb()
    const r = db.resumes.find((x) => x.id === resumeId)
    if (!r) throw new Error('简历不存在')
    const m = r.modules.find((x) => x.id === moduleId)
    if (!m) throw new Error('模块不存在')
    m.content = content
    m.updatedAt = now()
    r.updatedAt = now()
    saveDb(db)
    return mapModule(m)
  },

  /** 删除模块 */
  deleteModule(resumeId: number, moduleId: number) {
    const db = loadDb()
    const r = db.resumes.find((x) => x.id === resumeId)
    if (!r) return
    r.modules = r.modules.filter((m) => m.id !== moduleId)
    r.updatedAt = now()
    saveDb(db)
  },
}
