import type { InternshipContent, ModuleType } from '../../types'
import { useModuleContentState } from '../../hooks/useModuleContentState'
import { normalizeInternshipContent } from '../../utils/moduleContent'
import { AutoResizeTextarea } from '../ui/AutoResizeTextarea'
import { ModuleSaveBar } from './ModuleSaveBar'

interface Props {
  resumeId: number
  moduleId: number
  initialContent: Record<string, unknown>
  moduleType: Extract<ModuleType, 'internship' | 'work_experience'>
  moduleLabel: string
  summaryPlaceholder: string
}

export function ExperienceModuleForm({
  resumeId,
  moduleId,
  initialContent,
  summaryPlaceholder,
}: Props) {
  const [content, setContent, { saveNow, saveState, errorMessage, hasUnsavedChanges }] = useModuleContentState<InternshipContent>({
    resumeId,
    moduleId,
    initialContent,
    normalize: normalizeInternshipContent,
  })

  const update = (field: keyof InternshipContent, value: string | string[]) => {
    setContent((prev) => ({ ...prev, [field]: value }))
  }

  const addResponsibility = () => {
    update('responsibilities', [...content.responsibilities, ''])
  }

  const updateResponsibility = (index: number, value: string) => {
    const next = [...content.responsibilities]
    next[index] = value
    update('responsibilities', next)
  }

  const removeResponsibility = (index: number) => {
    update('responsibilities', content.responsibilities.filter((_, i) => i !== index))
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
          <label className="mb-1 block text-sm font-medium text-gray-700">公司</label>
          <input
            type="text"
            value={content.company}
            onChange={(e) => update('company', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>
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
          <label className="mb-1 block text-sm font-medium text-gray-700">职位</label>
          <input
            type="text"
            value={content.position}
            onChange={(e) => update('position', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="editor-responsive-grid col-span-full">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">开始</label>
            <input
              type="month"
              value={content.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">结束</label>
            <input
              type="month"
              value={content.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">技术栈</label>
        <AutoResizeTextarea
          value={content.techStack}
          onChange={(e) => update('techStack', e.target.value)}
          minRows={2}
          placeholder="Java, Spring Boot, MySQL..."
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">项目简介</label>
        <textarea
          value={content.projectDescription}
          onChange={(e) => update('projectDescription', e.target.value)}
          rows={3}
          placeholder={summaryPlaceholder}
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">核心职责</label>
          <button type="button" onClick={addResponsibility} className="text-sm text-primary-600 hover:text-primary-700">
            + 添加
          </button>
        </div>
        {content.responsibilities.map((item, index) => (
          <div key={index} className={index === 0 ? '' : 'mt-3'}>
            <div className="mb-2 flex items-center justify-end">
              <button type="button" onClick={() => removeResponsibility(index)} className="text-xs text-gray-300 hover:text-red-500">
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
