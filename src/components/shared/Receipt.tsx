import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/services/mockData';
import { useNavigate } from 'react-router-dom';

interface ReceiptProps {
  status: 'completed' | 'failed' | 'pending';
  amount: number;
  description: string;
  reference: string;
  date: string;
  details?: { label: string; value: string }[];
  primaryActionHref?: string;
  primaryActionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
}

const statusConfig = {
  completed: { icon: CheckCircle2, label: 'Successful', color: 'text-success' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-destructive' },
  pending: { icon: Clock, label: 'Pending', color: 'text-warning' },
};

const Receipt = ({
  status,
  amount,
  description,
  reference,
  date,
  details,
  primaryActionHref = '/dashboard',
  primaryActionLabel = 'Done',
  secondaryActionHref = '/wallet/history',
  secondaryActionLabel = 'View History',
}: ReceiptProps) => {
  const navigate = useNavigate();
  const { icon: Icon, label, color } = statusConfig[status];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Icon className={cn(color, 'h-16 w-16')} />
          <h2 className="font-display text-lg font-bold">{label}</h2>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(amount)}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <DetailRow label="Reference" value={reference} />
          <DetailRow label="Date" value={new Date(date).toLocaleString('en-NG')} />
          <DetailRow label="Status" value={label} />
          {details?.map((d, i) => <DetailRow key={i} label={d.label} value={d.value} />)}
        </div>

        <div className="mt-8 space-y-3">
          <Button className="w-full" onClick={() => navigate(primaryActionHref)}>{primaryActionLabel}</Button>
          <Button variant="outline" className="w-full" onClick={() => navigate(secondaryActionHref)}>{secondaryActionLabel}</Button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

export default Receipt;
