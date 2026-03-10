import { ArrowLeft, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockCoopMembers } from '@/services/cooperativeMockData';
import { formatCurrency } from '@/services/mockData';
import { cn } from '@/lib/utils';

const roleColors: Record<string, string> = {
  admin: 'text-accent bg-accent/10',
  member: 'text-muted-foreground bg-muted',
  auditor: 'text-warning bg-warning/10',
};

const CooperativeMembers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = mockCoopMembers.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      <button onClick={() => navigate('/cooperative')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Members</h1>
        <Button size="sm" className="gap-1"><UserPlus className="h-4 w-4" /> Invite</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-9" />
      </div>

      <Card className="divide-y divide-border">
        {filtered.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {m.firstName[0]}{m.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{m.firstName} {m.lastName}</p>
              <p className="text-xs text-muted-foreground">{m.phone}</p>
            </div>
            <div className="text-right space-y-1">
              <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', roleColors[m.role])}>
                {m.role}
              </span>
              <p className="text-xs text-muted-foreground">{formatCurrency(m.savingsBalance)}</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default CooperativeMembers;
