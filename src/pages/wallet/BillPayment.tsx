import { AlertCircle, ArrowLeft, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BILL_PAYMENTS_UNAVAILABLE_MESSAGE } from '@/lib/features';

const BillPayment = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mx-auto max-w-md space-y-6 pt-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Bill payments coming soon</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {BILL_PAYMENTS_UNAVAILABLE_MESSAGE}
          </p>
        </div>

        <Card className="rounded-3xl border-muted bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Temporary pause</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We have not completed third-party biller integration yet, so this flow is disabled for now.
              </p>
            </div>
          </div>
        </Card>

        <Button className="h-12 w-full" onClick={() => navigate('/transactions')}>
          Back to Transactions
        </Button>
      </div>
    </div>
  );
};

export default BillPayment;
