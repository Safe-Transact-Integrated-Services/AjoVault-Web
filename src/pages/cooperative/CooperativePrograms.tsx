import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockCoopPrograms } from '@/services/cooperativeMockData';
import { formatCurrency } from '@/services/mockData';

const CooperativePrograms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      <button onClick={() => navigate('/cooperative')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Savings Programs</h1>
        <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Create</Button>
      </div>

      <div className="space-y-3">
        {mockCoopPrograms.map(p => (
          <Card key={p.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{p.type} • {p.frequency} • {p.memberCount} members</p>
              </div>
              <span className="text-[10px] font-medium bg-success/10 text-success rounded-full px-2 py-0.5 capitalize">{p.status}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(p.totalContributed / p.targetAmount) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{formatCurrency(p.totalContributed)} contributed</span>
              <span className="font-medium">{Math.round((p.totalContributed / p.targetAmount) * 100)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Target: {formatCurrency(p.targetAmount)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CooperativePrograms;
