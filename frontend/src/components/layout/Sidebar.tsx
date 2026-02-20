import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, UserCog, CheckSquare } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/users', label: 'Users', icon: UserCog },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 border-r bg-background md:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
