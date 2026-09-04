import type { ProjectContent } from '../../types'
import { useModuleContentState } from '../../hooks/useModuleContentState'
import { normalizeProjectContent } from '../../utils/moduleContent'
import { AutoResizeTextarea } from '../ui/AutoResizeTextarea'
import { ModuleSaveBar } from './ModuleSaveBar'

interface Props {
  resumeId: number
  moduleId: number
  initialContent: Record<string, unknown>
}

export function ProjectForm({ resumeId, moduleId, initialContent }: Props) {
  const [content, setContent, { saveNow, saveState, errorMessage, hasUnsavedChanges }] = useModuleContentState<ProjectContent>({
    resumeId,
    moduleId,
    initialContent,
    normalize: normalizeProjectContent,
  })

  const update = (field: keyof ProjectContent, value: string | string[]) => {
    setContent((prev) => ({ ...prev, [field]: value }))
  }

  const addResponsibility = () => update('achievements', [...content.achievements, ''])

  const updateResponsibility = (index: number, value: string) => {
    const next = [...content.achievements]
    next[index] = value
    update('achievements', next)
  }

  const removeResponsibility = (index: number) => {
    update('achievements', content.achievements.filter((_, idx) => idx !== index))
  }

  return (
    <div className="space-y-4">
      <ModuleSaveBar
        saveState={saveState}
        errorMessage={errorMessage}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveNow}
      />

      <div className="editor-responsive-grid">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">项目名称</label>
          <input
            type="text"
            value={content.projectName}
            onChange={(e) => update('projectName', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">担任角色</label>
          <input
            type="text"
            value={content.role}
            onChange={(e) => update('role', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">开始时间</label>
          <input
            type="month"
            value={content.startDate}
            onChange={(e) => update('startDate', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">结束时间</label>
          <input
            type="month"
            value={content.endDate}
            onChange={(e) => update('endDate', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">技术栈</label>
        <AutoResizeTextarea
          value={content.techStack}
          onChange={(e) => update('techStack', e.target.value)}
          minRows={2}
          placeholder="React, TypeScript, Node.js..."
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">项目描述</label>
        <AutoResizeTextarea
          value={content.description}
          onChange={(e) => update('description', e.target.value)}
          minRows={4}
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">核心职责</label>
          <button type="button" onClick={addResponsibility} className="text-sm text-primary-600 hover:text-primary-700">
            + 添加
          </button>
        </div>
        {content.achievements.map((item, index) => (
          <div key={index} className={index === 0 ? '' : 'mt-3'}>
            <div className="mb-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => removeResponsibility(index)}
                className="text-xs text-gray-300 hover:text-red-500"
              >
                删除
              </button>
            </div>
            <AutoResizeTextarea
              value={item}
              onChange={(e) => updateResponsibility(index, e.target.value)}
              minRows={4}
              placeholder={`职责 ${index + 1}`}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
