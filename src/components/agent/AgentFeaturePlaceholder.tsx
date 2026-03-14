import { ArrowLeft, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AgentFeaturePlaceholderProps {
  title: string;
  description: string;
  backPath?: string;
}

const AgentFeaturePlaceholder = ({ title, description, backPath = '/agent' }: AgentFeaturePlaceholderProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen space-y-5 px-5 py-6">
      <button onClick={() => navigate(backPath)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="space-y-3 border-warning/20 bg-warning/5 p-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
          <Clock3 className="h-7 w-7 text-warning" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Phase 1 is active</p>
          <p className="text-xs text-muted-foreground">
            Agent application, approval, login, and guarded portal access are live. Operational agent workflows land in the next implementation phase.
          </p>
        </div>
        <Button className="h-11 w-full" onClick={() => navigate('/agent')}>
          Back to Agent Home
        </Button>
      </Card>
    </div>
  );
};

export default AgentFeaturePlaceholder;
