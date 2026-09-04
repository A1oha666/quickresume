export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400">
      © {new Date().getFullYear()} QuickResume · 本地优先，数据保存在你的浏览器
    </footer>
  )
}
