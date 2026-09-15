import React from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  Settings,
  ShoppingBag,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  onClose,
  collapsed = false,
  onToggle,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navigation = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Products',
      path: '/admin/products',
      icon: Package,
    },
    {
      label: 'Orders',
      path: '/admin/orders',
      icon: ClipboardList,
    },
    {
      label: 'Customers',
      path: '/admin/customers',
      icon: Users,
    },
    {
      label: 'Offers',
      path: '/admin/offers',
      icon: Percent,
    },
    {
      label: 'Coupons',
      path: '/admin/coupons',
      icon: Tag,
    },
    {
      label: 'Reviews',
      path: '/admin/reviews',
      icon: ShoppingBag,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b border-gray-100 px-5">
        {!collapsed && (
          <div>
            <p className="text-lg font-bold tracking-[0.2em]">
              BOUTIQUE
            </p>

            <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">
              Admin Panel
            </p>
          </div>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                } ${
                  collapsed
                    ? 'justify-center'
                    : ''
                }`
              }
            >
              <Icon size={19} />

              {!collapsed && (
                <span>{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-gray-100 p-4">

        {!collapsed && (
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-black"
          >
            <Settings size={19} />
            Settings
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-500 transition hover:bg-red-50 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={19} />

          {!collapsed && <span>Logout</span>}
        </button>

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="mt-2 hidden w-full items-center justify-center rounded-xl border border-gray-200 py-2 text-gray-500 hover:bg-gray-50 lg:flex"
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;