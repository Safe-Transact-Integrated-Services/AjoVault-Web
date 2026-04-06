import { Heart, Home, PiggyBank, Users, MoreHorizontal } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/circles', icon: Users, label: 'Circles' },
  { path: '/savings', icon: PiggyBank, label: 'Savings' },
  { path: '/fundraising', icon: Heart, label: 'Fundraising' },
  { path: '/more', icon: MoreHorizontal, label: 'More' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
              isActive(tab.path)
                ? 'text-accent'
                : 'text-muted-foreground'
            )}
          >
            <tab.icon className={cn('h-5 w-5', isActive(tab.path) && 'stroke-[2.5]')} />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
