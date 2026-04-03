import { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { getApiErrorMessage } from '@/lib/api/http';
import { getAgentActivities, type AgentActivity } from '@/services/agentApi';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const titleForActivity = (activity: AgentActivity) => {
  if (activity.activityType === 'registration') {
    return activity.customerName ? `Registered ${activity.customerName}` : 'Customer registration';
  }

  switch (activity.activityType) {
    case 'cash_in':
      return 'Cash-in completed';
    case 'cash_out':
      return 'Cash-out completed';
    case 'transfer':
      return activity.status === 'completed' ? 'Transfer completed' : activity.status === 'pending' ? 'Transfer pending' : 'Transfer failed';
    case 'bill_payment':
      return 'Bill payment';
    case 'balance_enquiry':
      return 'Balance enquiry';
    case 'mini_statement':
      return 'Mini statement';
    case 'savings':
      return 'Savings contribution';
    case 'circle':
      return 'Circle contribution';
    case 'group_goal':
      return 'Group goal contribution';
    default:
      return 'Agent activity';
  }
};

const AgentHistory = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isZeroDebitActivity = (activity: AgentActivity) =>
    (activity.activityType === 'balance_enquiry' || activity.activityType === 'mini_statement') && activity.amount <= 0;

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await getAgentActivities();
        if (active) {
          setActivities(response);
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, 'Unable to load agent history.'));
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

      <div>
        <h1 className="font-display text-2xl font-bold">Agent History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registration and assisted transaction history for this agent profile.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading history...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && !activities.length && (
        <Card className="border-dashed p-5 text-center">
          <EmptyTableState
            title="No history yet"
            description="Once you register customers or complete assisted transactions, they will appear here."
          />
        </Card>
      )}

      {!!activities.length && (
        <div className="space-y-3">
          {activities.map(activity => (
            <Card key={activity.activityId} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{titleForActivity(activity)}</p>
                  <p className="text-xs text-muted-foreground">{activity.reference}</p>
                </div>
                <BadgeCheck className="h-4 w-4 text-success" />
              </div>

              <p className="text-sm text-muted-foreground">{activity.description}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{activity.customerName ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">{new Date(activity.createdAtUtc).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium">{isZeroDebitActivity(activity) ? 'No wallet debit' : currency.format(activity.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="font-medium">{currency.format(activity.commissionAmount)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentHistory;
