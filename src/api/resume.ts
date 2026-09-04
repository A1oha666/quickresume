import { localDb } from '../utils/localDb'

export interface ResumeListItem {
  id: number
  title: string
  templateId: string
  createdAt: string
  updatedAt: string
}

export interface ResumeModule {
  id: number
  resumeId: number
  moduleType: string
  content: Record<string, unknown>
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ResumeImportPayload {
  title: string
  templateId?: string
  modules: Array<{
    moduleType: string
    content: Record<string, unknown>
    sortOrder?: number
  }>
}

export const resumeApi = {
  // ===== 本地模式：CRUD 操作使用 localStorage =====
  list: async () => {
    const data = localDb.list()
    return { data: { code: 200, message: 'success', data } }
  },

  create: async (data: { title: string; templateId?: string }) => {
    const result = localDb.create(data.title, data.templateId)
    return { data: { code: 200, message: 'success', data: result } }
  },

  importResume: async (data: ResumeImportPayload) => {
    const result = localDb.importResume(data.title, data.templateId, data.modules.map((m, i) => ({
      moduleType: m.moduleType,
      content: m.content,
      sortOrder: m.sortOrder ?? i,
    })))
    return { data: { code: 200, message: 'success', data: result } }
  },

  update: async (id: number, data: { title: string }) => {
    const result = localDb.update(id, data.title)
    return { data: { code: 200, message: 'success', data: result } }
  },

  delete: async (id: number) => {
    localDb.delete(id)
    return { data: { code: 200, message: 'success', data: null } }
  },

  getModules: async (resumeId: number) => {
    const data = localDb.getModules(resumeId)
    return { data: { code: 200, message: 'success', data } }
  },

  addModule: async (resumeId: number, data: { moduleType: string; content: Record<string, unknown>; sortOrder?: number }) => {
    const result = localDb.addModule(resumeId, data.moduleType, data.content, data.sortOrder)
    return { data: { code: 200, message: 'success', data: result } }
  },

  updateModule: async (resumeId: number, moduleId: number, content: Record<string, unknown>) => {
    const result = localDb.updateModule(resumeId, moduleId, content)
    return { data: { code: 200, message: 'success', data: result } }
  },

  deleteModule: async (resumeId: number, moduleId: number) => {
    localDb.deleteModule(resumeId, moduleId)
    return { data: { code: 200, message: 'success', data: null } }
  },
}

export default resumeApi
