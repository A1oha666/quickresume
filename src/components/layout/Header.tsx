import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AUTHENTICATED_HOME_PATH, RESUME_CREATE_PATH, buildResumeEditorPath } from '../../config/site'
import { useResumeStore } from '../../store/resumeStore'
import {
  detectResumeImportType,
  getResumeImporter,
  type ImportedResumeData,
  type ResumeImportType,
} from '../../utils/importers'
import { buildResumeImportPreview } from '../../utils/importers/preview'
import {
  RESUME_TITLE_MAX_LENGTH,
  getResumeImportTitle,
  getResumeTitleError,
} from '../../utils/resumeCreation'
import { LogoMark } from '../branding/LogoMark'

const IMPORT_ACCEPT = '.md,.markdown,.txt,.doc,.docx,.pdf'

const UNSUPPORTED_FILE_MESSAGE = '仅支持 Markdown、TXT、DOCX 或文本型 PDF 简历文件'

interface HeaderProps {
  enableResumeDrop?: boolean
}

interface PendingResumeImport {
  fileName: string
  type: ResumeImportType
  payload: ImportedResumeData
}

function isFileDragEvent(event: DragEvent): boolean {
  const types = event.dataTransfer?.types
  return Array.from(types ?? []).includes('Files')
}

export function Header({ enableResumeDrop = false }: HeaderProps) {
  const navigate = useNavigate()
  const { importResume } = useResumeStore()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [pendingImport, setPendingImport] = useState<PendingResumeImport | null>(null)
  const [draggingImportFile, setDraggingImportFile] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    const importType = detectResumeImportType(file)
    if (!importType) {
      setImportError(UNSUPPORTED_FILE_MESSAGE)
      return
    }

    const importer = getResumeImporter(importType)
    if (!importer?.enabled || !importer.parse) {
      setImportError('当前导入方式暂不可用')
      return
    }

    setImportError('')
    setImporting(true)
    try {
      const payload = await importer.parse(file)
      setPendingImport({
        fileName: file.name,
        type: importType,
        payload: {
          ...payload,
          title: getResumeImportTitle(payload.title, file.name),
        },
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '导入失败，请稍后再试'
      setImportError(message)
    } finally {
      setImporting(false)
    }
  }, [])

  const confirmImport = useCallback(async () => {
    if (!pendingImport || importing) {
      return
    }

    const titleError = getResumeTitleError(pendingImport.payload.title)
    if (titleError) {
      setImportError(titleError)
      titleInputRef.current?.focus()
      return
    }

    setImportError('')
    setImporting(true)

    try {
      const resume = await importResume(pendingImport.payload)
      setPendingImport(null)
      navigate(buildResumeEditorPath(resume.id))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '导入失败，请稍后再试'
      setImportError(message)
    } finally {
      setImporting(false)
    }
  }, [importResume, importing, navigate, pendingImport])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    setImportError('')
    void handleFile(file)
  }

  // 导入确认对话框打开时：锁定页面滚动、聚焦名称输入、Esc 关闭
  useEffect(() => {
    if (!pendingImport) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    titleInputRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !importing) {
        event.preventDefault()
        setPendingImport(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [importing, pendingImport])

  // 拖拽导入（仅启用页面生效）：松开即按文件类型自动导入
  useEffect(() => {
    if (!enableResumeDrop) {
      return
    }

    let dragDepth = 0
    const canDrop = () => !importing && !pendingImport

    const handleDragEnter = (event: DragEvent) => {
      if (!isFileDragEvent(event)) return
      event.preventDefault()
      if (!canDrop()) return
      dragDepth += 1
      setDraggingImportFile(true)
    }

    const handleDragOver = (event: DragEvent) => {
      if (!isFileDragEvent(event)) return
      event.preventDefault()
      if (!canDrop()) return
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDragLeave = (event: DragEvent) => {
      if (!isFileDragEvent(event)) return
      event.preventDefault()
      if (!canDrop()) return
      dragDepth = Math.max(0, dragDepth - 1)
      if (dragDepth === 0) {
        setDraggingImportFile(false)
      }
    }

    const handleDrop = (event: DragEvent) => {
      if (!isFileDragEvent(event)) return
      event.preventDefault()
      if (!canDrop()) return
      dragDepth = 0
      setDraggingImportFile(false)

      const file = event.dataTransfer?.files?.[0]
      if (file) {
        setImportError('')
        void handleFile(file)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [enableResumeDrop, handleFile, importing, pendingImport])

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="QuickResume 首页">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-bold text-gray-900">QuickResume</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to={AUTHENTICATED_HOME_PATH}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              我的简历
            </Link>

            <input
              ref={fileInputRef}
              type="file"
              accept={IMPORT_ACCEPT}
              aria-label="导入简历文件"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importing ? '导入中…' : '导入'}
            </button>

            <Link
              to={RESUME_CREATE_PATH}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              新建简历
            </Link>
          </div>
        </div>

        {importError && !pendingImport ? (
          <div role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {importError}
          </div>
        ) : null}
      </header>

      {enableResumeDrop && draggingImportFile ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
          <div className="rounded-2xl border-2 border-dashed border-sky-300 bg-white px-10 py-8 text-center shadow-xl">
            <p className="text-lg font-semibold text-slate-900">松开即可导入简历</p>
            <p className="mt-1 text-sm text-slate-500">支持 Markdown、TXT、DOCX、文本型 PDF</p>
          </div>
        </div>
      ) : null}

      {pendingImport ? (() => {
        const preview = buildResumeImportPreview(pendingImport.payload)
        const contactItems = [
          preview.name && `姓名：${preview.name}`,
          preview.phone && `手机：${preview.phone}`,
          preview.email && `邮箱：${preview.email}`,
        ].filter(Boolean)

        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="resume-import-dialog-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h2 id="resume-import-dialog-title" className="text-lg font-semibold text-gray-900">
                导入简历
              </h2>
              <p className="mt-1 break-all text-sm text-gray-500">{pendingImport.fileName}</p>
              {contactItems.length > 0 ? (
                <p className="mt-0.5 text-sm text-gray-500">{contactItems.join(' · ')}</p>
              ) : null}

              <label
                htmlFor="resume-import-title"
                className="mb-2 mt-5 block text-sm font-medium text-gray-700"
              >
                简历名称
              </label>
              <input
                ref={titleInputRef}
                id="resume-import-title"
                name="resumeImportTitle"
                type="text"
                value={pendingImport.payload.title}
                onChange={(event) => {
                  const title = event.target.value
                  setPendingImport((current) => current ? {
                    ...current,
                    payload: {
                      ...current.payload,
                      title,
                    },
                  } : current)
                  if (importError) {
                    setImportError('')
                  }
                }}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing || event.keyCode === 229) {
                    return
                  }
                  if (event.key === 'Enter' && !importing) {
                    event.preventDefault()
                    void confirmImport()
                  }
                }}
                maxLength={RESUME_TITLE_MAX_LENGTH}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />

              {importError ? (
                <p role="alert" className="mt-2 text-sm text-red-600">{importError}</p>
              ) : null}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingImport(null)}
                  disabled={importing}
                  className="rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void confirmImport()}
                  disabled={importing || !!getResumeTitleError(pendingImport.payload.title)}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing ? '创建中…' : '确认创建'}
                </button>
              </div>
            </div>
          </div>
        )
      })() : null}
    </>
  )
}
