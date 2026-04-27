import { useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, FileText, HelpCircle, KeyRound, Landmark, LogOut, Shield, User, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: User, label: 'Profile', path: '/more/profile' },
  { icon: Wallet, label: 'Transactions', path: '/transactions' },
  { icon: Shield, label: 'KYC Verification', path: '/more/kyc' },
  { icon: Landmark, label: 'Withdrawal Accounts', path: '/more/withdrawal-accounts' },
  { icon: CreditCard, label: 'Credit Passport', path: '/credit-passport' },
  { icon: KeyRound, label: 'Agent Access Code', path: '/more/agent-access' },
  { icon: FileText, label: 'Settings', path: '/more/settings' },
  { icon: HelpCircle, label: 'Help & Support', path: '/more/help' },
];

const MorePage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="px-4 py-6 safe-top">
      <h1 className="mb-6 font-display text-xl font-bold text-foreground">More</h1>

      <button onClick={() => navigate('/more/profile')} className="mb-6 flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
          {user?.firstName?.[0] || 'A'}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-muted-foreground">{user?.phone || user?.email || 'No primary contact yet'}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="space-y-1">
        {menuItems.map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-muted"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button
        onClick={async () => {
          await logout();
          navigate('/');
        }}
        className="mt-6 flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-destructive/5"
      >
        <LogOut className="h-5 w-5 text-destructive" />
        <span className="text-sm font-medium text-destructive">Log Out</span>
      </button>
    </div>
  );
};

export default MorePage;
