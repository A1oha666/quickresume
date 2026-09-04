import axios from 'axios'

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export class ApiError extends Error {
  readonly code: number | null
  readonly status: number | null

  constructor(
    message: string,
    options: {
      code?: number | null
      status?: number | null
    } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code ?? null
    this.status = options.status ?? null
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Minimal axios client for the local-only QuickResume backend.
// No auth/token handling: the editor runs fully client-side (localStorage)
// and only talks to /api/resume/sync and /health.
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
})

export default client
