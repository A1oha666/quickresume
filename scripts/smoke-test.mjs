// QuickResume 同步接口冒烟测试（跨平台，使用内置 fetch）
// 用法：先启动服务（npm start），再运行：node scripts/smoke-test.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = process.env.PORT || 3456
const BASE = `http://localhost:${PORT}`

const sampleDb = {
  nextResumeId: 2,
  nextModuleId: 2,
  resumes: [
    {
      id: 1,
      title: '冒烟测试简历',
      templateId: 'campus-blue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modules: [
        {
          id: 1,
          resumeId: 1,
          moduleType: 'basic_info',
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          content: {
            name: '张三',
            phone: '13800000000',
            email: 'zhangsan@example.com',
            summary: '负责 **核心模块** 开发',
          },
        },
        {
          id: 2,
          resumeId: 1,
          moduleType: 'project',
          sortOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          content: {
            projectName: '示例项目',
            role: '后端开发',
            description: '完成 **性能优化**',
            achievements: ['搭建服务', '压测达标'],
          },
        },
      ],
    },
  ],
}

async function main() {
  const health = await fetch(`${BASE}/health`)
  const healthJson = await health.json()
  console.log('[smoke] /health ->', health.status, JSON.stringify(healthJson))

  const postRes = await fetch(`${BASE}/api/resume/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ db: sampleDb }),
  })
  const postJson = await postRes.json()
  console.log('[smoke] POST /api/resume/sync ->', postRes.status, JSON.stringify(postJson))

  const getRes = await fetch(`${BASE}/api/resume/sync`)
  const getJson = await getRes.json()
  const resumes = getJson?.data?.resumes
  console.log('[smoke] GET  /api/resume/sync ->', getRes.status, 'resumes:', resumes?.length)

  const mdPath = path.join(process.cwd(), '简历-最新.md')
  const jsonPath = path.join(process.cwd(), 'resume-data', 'resume-backup.json')
  console.log('[smoke] resume-backup.json exists:', fs.existsSync(jsonPath))
  console.log('[smoke] 简历-最新.md exists:', fs.existsSync(mdPath))

  if (fs.existsSync(mdPath)) {
    const md = fs.readFileSync(mdPath, 'utf-8')
    console.log('[smoke] markdown 包含「核心模块」加粗标记 (**核心模块**):', md.includes('**核心模块**'))
  }
}

main().catch((err) => {
  console.error('[smoke] 测试失败:', err.message)
  process.exit(1)
})
