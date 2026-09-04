export const AUTHENTICATED_HOME_PATH = '/dashboard'

export const RESUME_CREATE_PATH = '/dashboard?create=1'

export function buildResumeEditorPath(resumeId: number | string) {
  return `/editor/${resumeId}?moduleType=basic_info`
}
