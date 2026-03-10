import { LayoutDashboard, ArrowDownUp, UserPlus, Receipt, MoreHorizontal } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/agent', icon: LayoutDashboard, label: 'Home', exact: true },
  { path: '/agent/transact', icon: ArrowDownUp, label: 'Transact' },
  { path: '/agent/register', icon: UserPlus, label: 'Register' },
  { path: '/agent/history', icon: Receipt, label: 'History' },
  { path: '/agent/more', icon: MoreHorizontal, label: 'More' },
];

const AgentBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
              isActive(tab.path, tab.exact) ? 'text-accent' : 'text-muted-foreground'
            )}
          >
            <tab.icon className={cn('h-5 w-5', isActive(tab.path, tab.exact) && 'stroke-[2.5]')} />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default AgentBottomNav;
