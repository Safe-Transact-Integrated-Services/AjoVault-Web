import { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, ChevronRight, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api/http';
import { getLinkedAgentCustomers, type AgentCustomer } from '@/services/agentApi';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const AgentCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<AgentCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await getLinkedAgentCustomers();
        if (active) {
          setCustomers(response);
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, 'Unable to load linked customers.'));
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

  return (
    <div className="space-y-5 px-5 py-6">
      <button onClick={() => navigate('/agent')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Linked Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customers you registered or are currently linked to as an agent.
          </p>
        </div>
        <Button className="shrink-0" onClick={() => navigate('/agent/register')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Register
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading linked customers...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && !customers.length && (
        <Card className="space-y-3 border-dashed p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">No linked customers yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your first assisted registration will appear here together with recent field activity.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate('/agent/register')}>
            Register First Customer
          </Button>
        </Card>
      )}

      {!!customers.length && (
        <div className="space-y-3">
          {customers.map(customer => (
            <Card key={customer.customerUserId} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{customer.fullName}</p>
                  <p className="text-xs text-muted-foreground">{customer.phoneNumber ?? 'No phone number'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-accent">
                    {customer.kycTier}
                  </span>
                  {customer.isActive && <BadgeCheck className="h-4 w-4 text-success" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Email</p>
                  <p className="mt-1 text-sm text-foreground">{customer.email ?? 'Phone-only account'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Linked</p>
                  <p className="mt-1 text-sm text-foreground">{formatDate(customer.linkedAtUtc)}</p>
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Latest activity</p>
                    <p className="text-sm font-medium">
                      {customer.lastActivity?.description ?? 'Customer linked to your agent profile'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="capitalize">{customer.linkType}</span>
                  <span>{formatDate(customer.lastActivityAtUtc ?? customer.linkedAtUtc)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentCustomers;
