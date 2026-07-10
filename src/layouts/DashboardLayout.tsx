import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  LogOut,
  User,
  Menu,
  Search,
  Plus,
} from 'lucide-react';
import { Button, Input, Avatar, Dropdown, DropdownItem, DropdownDivider } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { cn } from '@/utils';

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navigation = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FolderOpen, label: 'My Boards', path: '/dashboard' },
    { icon: Settings, label: 'Settings', path: '/' },
  ];

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="flex">
        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100',
            'transform transition-transform duration-200 ease-in-out',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-100">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blush-400 to-lavender-400 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="3" width="7" height="7" rx="2" />
                    <rect x="3" y="14" width="7" height="7" rx="2" />
                    <rect x="14" y="14" width="7" height="7" rx="2" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-800">CollabBoard</span>
              </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-blush-100 to-lavender-100 text-blush-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-100">
              <Link to="/dashboard">
                <Button className="w-full" leftIcon={<Plus className="w-4 h-4" />}>
                  New Board
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="hidden sm:block w-72">
                  <Input
                    placeholder="Search boards..."
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Dropdown
                  trigger={
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                      <Avatar src={user?.avatar} name={user?.name} size="sm" />
                      <span className="hidden sm:block text-sm font-medium text-gray-700">
                        {user?.name || 'User'}
                      </span>
                    </button>
                  }
                  align="right"
                >
                  <DropdownItem icon={<User className="w-4 h-4" />} label="Profile" />
                  <DropdownItem icon={<Settings className="w-4 h-4" />} label="Settings" />
                  <DropdownDivider />
                  <DropdownItem
                    icon={<LogOut className="w-4 h-4" />}
                    label="Sign out"
                    variant="danger"
                    onClick={() => logout()}
                  />
                </Dropdown>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
