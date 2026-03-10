import { ArrowLeft, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockAgentCustomers, formatCurrency } from '@/services/agentMockData';
import { cn } from '@/lib/utils';

const kycColors: Record<string, string> = {
  none: 'text-muted-foreground bg-muted',
  basic: 'text-accent bg-accent/10',
  verified: 'text-success bg-success/10',
};

const AgentCustomers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = mockAgentCustomers.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      <button onClick={() => navigate('/agent/more')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">My Customers</h1>
        <Button size="sm" onClick={() => navigate('/agent/register')} className="gap-1">
          <UserPlus className="h-4 w-4" /> New
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-9" />
      </div>

      <Card className="divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No customers found</p>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {c.firstName[0]}{c.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
              </div>
              <div className="text-right">
                <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', kycColors[c.kycStatus])}>
                  {c.kycStatus === 'none' ? 'No KYC' : c.kycStatus}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(c.totalDeposits)}</p>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default AgentCustomers;
