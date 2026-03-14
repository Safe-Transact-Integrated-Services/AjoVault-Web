import { useEffect, useState } from 'react';
import { ChevronRight, HelpCircle, LogOut, MapPin, Phone, Settings, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/api/http';
import { getMyAgentPortalState, type AgentPortalState } from '@/services/agentApi';
import { cn } from '@/lib/utils';

const AgentMore = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [state, setState] = useState<AgentPortalState | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await getMyAgentPortalState();
        if (active) {
          setState(response);
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, 'Unable to load your agent profile.'));
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const profile = state?.profile;
  const summary = state?.summary;
  const initials = profile?.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'AG';

  const tierColors: Record<string, string> = {
    basic: 'bg-muted text-muted-foreground',
    standard: 'bg-accent/10 text-accent',
    super: 'bg-warning/10 text-warning',
  };

  const menuItems = [
    { icon: User, label: 'Linked Customers', subtitle: `${summary?.linkedCustomerCount ?? 0} customers linked`, path: '/agent/customers' },
    { icon: Shield, label: 'Commissions', subtitle: `Available balance ${profile ? `NGN ${profile.commissionBalance.toLocaleString()}` : 'NGN 0'}`, path: '/agent/commissions' },
    { icon: MapPin, label: 'Agent Ledger', subtitle: 'View float movements and adjustments', path: '/agent/ledger' },
    { icon: Phone, label: 'Settlements', subtitle: 'Move available commission to wallet', path: '/agent/settlements' },
    { icon: HelpCircle, label: 'Help & Support', subtitle: 'Raise agent issues and disputes', path: '/agent/help' },
    { icon: Settings, label: 'Settings', subtitle: 'Use your customer account settings', path: '/more/settings' },
  ];

  return (
    <div className="min-h-screen space-y-5 px-5 py-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold">{profile?.fullName ?? 'Agent profile'}</h2>
            <p className="text-xs text-muted-foreground">{profile?.phoneNumber ?? 'No phone number on file'}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-accent">{profile?.agentCode ?? 'Pending code'}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', tierColors[profile?.tier ?? 'basic'])}>
                {(profile?.tier ?? 'basic')} Agent
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 font-display text-xl font-bold capitalize">{profile?.status ?? 'pending'}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="mt-1 font-display text-base font-bold">{profile ? `${profile.state}` : 'Pending'}</p>
        </Card>
      </div>

      <Card className="divide-y divide-border">
        {menuItems.map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </Card>

      <button
        onClick={async () => {
          await logout();
          navigate('/', { replace: true });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 p-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
      >
        <LogOut className="h-4 w-4" /> Log Out
      </button>
    </div>
  );
};

export default AgentMore;
