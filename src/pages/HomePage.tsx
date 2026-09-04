import { Link } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { SiteFooter } from '../components/layout/SiteFooter'
import { RESUME_CREATE_PATH } from '../config/site'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
            QuickResume
          </h1>
          <p className="mt-5 text-base leading-8 text-gray-600 sm:text-lg">
            本地优先的简历编辑器。数据保存在你自己的浏览器，
            支持实时预览、Markdown / Word / PDF 导入，一键导出 PDF 与 Markdown。
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={RESUME_CREATE_PATH}
              className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              开始制作简历
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
            >
              我的简历
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
