import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Clock3, MapPin, Shield, Users, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { getApiErrorMessage } from '@/lib/api/http';
import { getMyAgentPortalState, type AgentActivity, type AgentPortalState } from '@/services/agentApi';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const activityTitle = (activity: AgentActivity) => {
  if (activity.activityType === 'registration') {
    return activity.customerName ? `Registered ${activity.customerName}` : 'Customer registration';
  }

  return activity.description;
};

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AgentPortalState | null>(null);
  const [loading, setLoading] = useState(true);
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
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="px-5 py-6">
        <p className="text-sm text-muted-foreground">Loading agent portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!state?.profile) {
    return (
      <div className="space-y-5 px-5 py-6">
        <h1 className="font-display text-xl font-bold">Agent Portal</h1>
        <Card className="space-y-3 border-warning/20 bg-warning/5 p-5">
          <p className="text-sm font-semibold">No active agent profile</p>
          <p className="text-sm text-muted-foreground">
            Your account does not have an approved active agent profile yet. Submit an application or wait for super-admin approval.
          </p>
        </Card>
      </div>
    );
  }

  const profile = state.profile;
  const summary = state.summary;

  return (
    <div className="space-y-6 px-5 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Agent profile</p>
          <h1 className="font-display text-xl font-bold">{profile.fullName}</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
          <BadgeCheck className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-accent">{profile.agentCode}</span>
        </div>
      </div>

      <Card className="bg-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1 text-xs opacity-80"><Wallet className="h-3 w-3" /> Float Balance</p>
            <p className="mt-1 font-display text-2xl font-bold">{currency.format(profile.floatBalance)}</p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-xs opacity-80"><Shield className="h-3 w-3" /> Available Commission</p>
            <p className="mt-1 font-display text-lg font-bold">{currency.format(profile.commissionBalance)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-primary-foreground/20 pt-3 text-xs opacity-80">
          <span className="capitalize">{profile.tier} tier</span>
          <span className="capitalize">{profile.status}</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Linked Customers</p>
          <p className="mt-1 font-display text-2xl font-bold">{summary?.linkedCustomerCount ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Activities</p>
          <p className="mt-1 font-display text-2xl font-bold">{summary?.totalActivities ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Earned</p>
          <p className="mt-1 text-sm font-semibold">{currency.format(summary?.totalCommissionsEarned ?? 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="mt-1 text-sm font-semibold">{profile.state}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button className="h-12" onClick={() => navigate('/agent/transact')}>
          Start Transaction
        </Button>
        <Button variant="outline" className="h-12" onClick={() => navigate('/agent/register')}>
          Register Customer
        </Button>
        <Button variant="outline" className="col-span-2 h-12" onClick={() => navigate('/agent/customers')}>
          View Customers
        </Button>
      </div>

      <Card className="space-y-3 border-warning/20 bg-warning/5 p-5">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-warning" />
          <p className="text-sm font-semibold">Operational services extended</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Agent-assisted registration, cash-in, cash-out, balance enquiry, mini statement, local transfer, bill payment, commission tracking, float ledger, wallet settlements, and assisted savings, circle, and group-goal contributions are live.
        </p>
        <div className="rounded-lg bg-background/70 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}{profile.lga ? `, ${profile.lga}` : ''}, {profile.state}</p>
          <p className="mt-1">Approved on {formatDate(profile.approvedAtUtc)}</p>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Recent Activities</h2>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-accent"
            onClick={() => navigate('/agent/customers')}
          >
            Open customers
          </button>
        </div>

        {summary?.recentActivities.length ? (
          <div className="space-y-3">
            {summary.recentActivities.map(activity => (
              <div key={activity.activityId} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{activityTitle(activity)}</p>
                    <p className="text-xs text-muted-foreground">{activity.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-success">{currency.format(activity.commissionAmount)}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(activity.createdAtUtc)}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{activity.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyTableState
            title="No assisted activity yet"
            description="Start by registering your first customer or completing an assisted transaction."
          />
        )}

        <Button variant="ghost" className="w-full justify-between" onClick={() => navigate('/agent/register')}>
          Register another customer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
};

export default AgentDashboard;
