/**
 * 简历文件同步工具（本地模式）
 *
 * 核心思路：简历数据默认存在浏览器 localStorage（键 quickresume:local-db），
 * 一旦清缓存/换电脑就会丢。这里在「每次编辑保存」后，把完整数据 POST 给
 * server-ai（同源 /api/resume/sync），由它落盘两份文件：
 *   - resume-data/resume-backup.json  完整 JSON 备份（一键恢复用）
 *   - 简历-最新.md                    可读 Markdown（简历资料库最新版本）
 */

import client from '../api/client'

const LOCAL_DB_KEY = 'quickresume:local-db'

let syncTimer: ReturnType<typeof setTimeout> | null = null

/** 读取 localStorage 中完整的简历数据库 */
function readLocalDb(): unknown | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCAL_DB_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * 把当前简历数据同步到文件（防抖 1.2s，失败静默，不阻塞编辑）。
 * 返回 Promise<boolean>：是否同步成功。
 */
export function syncResumeToFile(): Promise<boolean> {
  const db = readLocalDb()
  if (!db) return Promise.resolve(false)
  if (syncTimer) clearTimeout(syncTimer)

  return new Promise((resolve) => {
    syncTimer = setTimeout(() => {
      syncTimer = null
      client
        .post('/resume/sync', { db })
        .then(() => resolve(true))
        .catch(() => resolve(false))
    }, 1200)
  })
}

/** 立即同步（手动按钮用，不等防抖） */
export function syncResumeToFileNow(): Promise<boolean> {
  const db = readLocalDb()
  if (!db) return Promise.resolve(false)
  return client
    .post('/resume/sync', { db })
    .then(() => true)
    .catch(() => false)
}

/**
 * 从文件备份恢复：读取服务端 resume-backup.json，整体覆盖 localStorage。
 * 返回是否找到备份。
 */
export async function restoreResumeFromFile(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const { data: res } = await client.get<{ code: number; data: unknown }>('/resume/sync')
  const db = res?.data
  if (!db || typeof db !== 'object') return false
  window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db))
  return true
}
