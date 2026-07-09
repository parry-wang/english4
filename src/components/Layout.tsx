import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  FileText,
  Headphones,
  PenTool,
  ClipboardList,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/vocabulary', label: '单词记忆', icon: BookOpen },
  { path: '/reading', label: '阅读理解', icon: FileText },
  { path: '/listening', label: '听力练习', icon: Headphones },
  { path: '/writing', label: '作文题材', icon: PenTool },
  { path: '/exam', label: '试卷练习', icon: ClipboardList },
  { path: '/profile', label: '个人中心', icon: User },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-primary-500 text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-primary-400">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-400 flex items-center justify-center font-display font-bold text-sm">
                C4
              </div>
              <span className="font-display font-semibold text-lg">CET-4</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-primary-400 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-primary-600/20'
                    : 'text-primary-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} className={`flex-shrink-0 ${isActive ? 'text-accent-400' : ''}`} />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom info */}
        {!collapsed && (
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div className="bg-primary-600/50 rounded-lg p-3">
              <p className="text-xs text-primary-200">英语四级学习平台</p>
              <p className="text-xs text-primary-300 mt-1">词库 4900+ | 阅读 200+ | 听力 100+</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-56'
        }`}
      >
        <div className="min-h-screen p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
