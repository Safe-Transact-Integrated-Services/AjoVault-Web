import { useNavigate } from 'react-router-dom';
import { Plus, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { mockFundraisers } from '@/services/groupGoalsMockData';
import { formatCurrency } from '@/services/mockData';
import { motion } from 'framer-motion';
import { useState } from 'react';

const categoryColors: Record<string, string> = {
  event: 'bg-warning/10 text-warning',
  project: 'bg-accent/10 text-accent',
  emergency: 'bg-destructive/10 text-destructive',
  community: 'bg-success/10 text-success',
  education: 'bg-primary/10 text-primary',
  health: 'bg-destructive/10 text-destructive',
};

const FundraisingHome = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const filtered = mockFundraisers.filter(f => f.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold text-foreground">Fundraising</h1>
        <Button size="sm" onClick={() => navigate('/fundraising/create')} className="gap-1">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-10" />
      </div>

      <div className="space-y-3">
        {filtered.map((fund, i) => {
          const pct = Math.round((fund.raisedAmount / fund.targetAmount) * 100);
          return (
            <motion.button
              key={fund.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/fundraising/${fund.id}`)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{fund.image}</span>
                  <div>
                    <p className="font-semibold text-foreground">{fund.title}</p>
                    <p className="text-xs text-muted-foreground">by {fund.creatorName} · {fund.donorCount} donors</p>
                  </div>
                </div>
                <Badge variant="secondary" className={categoryColors[fund.category] || 'bg-muted text-muted-foreground'}>{fund.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{fund.description}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatCurrency(fund.raisedAmount)}</span>
                  <span className="font-medium text-foreground">{formatCurrency(fund.targetAmount)}</span>
                </div>
                <Progress value={pct} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{pct}% funded</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default FundraisingHome;
