import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 部署版（VITE_AI_ENABLED=false）专用：把 App.tsx 中纯 AI 功能页
 * （FieldOptimizePage / AdminPage）的懒加载替换为空组件，
 * 使它们既不生成 chunk、也无法访问。
 */
function stripAiPagesPlugin(): Plugin {
  return {
    name: 'strip-ai-pages',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('src/App.tsx')) return code
      return code
        .replace(
          "const FieldOptimizePage = lazy(() => import('./pages/FieldOptimizePage'))",
          'const FieldOptimizePage = () => null',
        )
        .replace(
          "const AdminPage = lazy(() => import('./pages/AdminPage'))",
          'const AdminPage = () => null',
        )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const runtimeEnv = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env ?? {}
  const backendPort = runtimeEnv.SERVER_PORT || env.SERVER_PORT || '8084'
  const apiProxyTarget = runtimeEnv.VITE_API_PROXY_TARGET || env.VITE_API_PROXY_TARGET || `http://localhost:${backendPort}`
  const port = Number.parseInt(runtimeEnv.VITE_PORT || env.VITE_PORT || '5173', 10)
  const openBrowser = (runtimeEnv.VITE_OPEN_BROWSER || 'true').toLowerCase() !== 'false'
  const aiEnabled = (runtimeEnv.VITE_AI_ENABLED ?? env.VITE_AI_ENABLED ?? 'true') !== 'false'

  return {
    plugins: [react(), ...(!aiEnabled ? [stripAiPagesPlugin()] : [])],
    server: {
      port: Number.isNaN(port) ? 5173 : port,
      open: openBrowser,
      proxy: {
        '/api/v2/apps/protocols/compatible-mode/v1/responses': {
          target: 'https://dashscope.aliyuncs.com',
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/services/aigc/text-generation/generation': {
          target: 'https://dashscope.aliyuncs.com',
          changeOrigin: true,
          secure: true,
        },
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
