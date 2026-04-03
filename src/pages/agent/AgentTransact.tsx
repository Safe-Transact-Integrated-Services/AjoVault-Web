import { useState } from 'react';
import { ArrowLeft, BadgeCheck, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PinPad from '@/components/shared/PinPad';
import { executeAgentTransaction, finalizeAgentTransfer, previewAgentTransaction, type AgentTransactionPreview, type AgentTransactionReceipt } from '@/services/agentApi';
import { getApiErrorMessage } from '@/lib/api/http';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const getTransactionLabel = (transactionType: string) => {
  switch (transactionType) {
    case 'cash_in':
      return 'Cash-in';
    case 'cash_out':
      return 'Cash-out';
    case 'transfer':
      return 'Local transfer';
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
      return 'Agent service';
  }
};

const AgentTransact = () => {
  const navigate = useNavigate();
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [preview, setPreview] = useState<AgentTransactionPreview | null>(null);
  const [receipt, setReceipt] = useState<AgentTransactionReceipt | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalizingOtp, setFinalizingOtp] = useState(false);
  const [otpPadKey, setOtpPadKey] = useState(0);
  const [error, setError] = useState('');
  const isZeroDebitService = (transactionType: string, amount: number) =>
    (transactionType === 'balance_enquiry' || transactionType === 'mini_statement') && amount <= 0;

  const reset = () => {
    setPreview(null);
    setReceipt(null);
    setError('');
    setCustomerIdentifier('');
    setAuthorizationCode('');
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    setError('');
    setReceipt(null);

    try {
      const response = await previewAgentTransaction({
        customerIdentifier,
        authorizationCode,
      });
      setPreview(response);
    } catch (err) {
      setPreview(null);
      setError(getApiErrorMessage(err, 'Unable to preview this authorized transaction.'));
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecute = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await executeAgentTransaction({
        customerIdentifier,
        authorizationCode,
      });
      setReceipt(response);
      if (response.requiresOtp) {
        setOtpPadKey(current => current + 1);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to complete this agent transaction.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeTransferOtp = async (otp: string) => {
    if (!receipt) {
      return;
    }

    setFinalizingOtp(true);
    setError('');

    try {
      const response = await finalizeAgentTransfer({
        customerIdentifier,
        reference: receipt.reference,
        otp,
      });
      setReceipt(response);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to finalize this assisted transfer.'));
      setOtpPadKey(current => current + 1);
    } finally {
      setFinalizingOtp(false);
    }
  };

  return (
    <div className="space-y-5 px-5 py-6">
      <button onClick={() => navigate('/agent')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold">Agent Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete customer-authorized cash services, balance enquiries, mini statements, bill payments, and assisted contributions. Amount, type, and target are locked by the backend.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="customerIdentifier">Customer Phone or Email</Label>
          <Input
            id="customerIdentifier"
            className="h-12"
            placeholder="+2348012345678 or customer@email.com"
            value={customerIdentifier}
            onChange={event => setCustomerIdentifier(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorizationCode">Authorization Code</Label>
          <Input
            id="authorizationCode"
            inputMode="numeric"
            maxLength={6}
            className="h-12 text-center font-mono tracking-[0.35em]"
            placeholder="123456"
            value={authorizationCode}
            onChange={event => setAuthorizationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12"
            disabled={loadingPreview || !customerIdentifier.trim() || authorizationCode.trim().length !== 6}
            onClick={() => void handlePreview()}
          >
            {loadingPreview ? 'Checking...' : 'Preview'}
          </Button>
          <Button className="h-12" variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>
      </Card>

      {preview && (
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="text-sm font-semibold">{preview.customerName}</p>
              <p className="text-xs text-muted-foreground">{preview.customerPhoneNumber ?? preview.customerEmail ?? 'No contact'}</p>
            </div>
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-accent">
              {getTransactionLabel(preview.transactionType)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-medium">{isZeroDebitService(preview.transactionType, preview.amount) ? 'No wallet debit' : currency.format(preview.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expires</p>
              <p className="font-medium">{new Date(preview.expiresAtUtc).toLocaleTimeString()}</p>
            </div>
          </div>

          {preview.targetName ? (
            <div className="rounded-xl bg-muted/60 p-3 text-sm">
              <p className="text-xs text-muted-foreground">Locked Target</p>
              <p className="font-medium">{preview.targetName}</p>
              {preview.targetDescription ? (
                <p className="mt-1 text-xs text-muted-foreground">{preview.targetDescription}</p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            Use the execute button only after you have confirmed the customer is present and ready for this authorized service.
          </div>

          {!receipt ? (
            <Button className="h-12 w-full" disabled={submitting} onClick={() => void handleExecute()}>
              {submitting ? 'Processing...' : 'Execute Service'}
            </Button>
          ) : null}
        </Card>
      )}

      {receipt?.requiresOtp ? (
        <Card className="space-y-4 border-warning/20 bg-warning/5 p-5">
          <div>
            <p className="text-sm font-semibold">Provider OTP Required</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete the transfer to {receipt.destinationAccountName ?? receipt.targetName ?? 'the destination account'} with the 6-digit Paystack OTP.
            </p>
          </div>

          {receipt.destinationBankName || receipt.destinationAccountNumber ? (
            <div className="rounded-xl bg-background/70 p-3 text-sm">
              {receipt.destinationBankName ? <p className="font-medium">{receipt.destinationBankName}</p> : null}
              {receipt.destinationAccountNumber ? <p className="text-xs text-muted-foreground">{receipt.destinationAccountNumber}</p> : null}
            </div>
          ) : null}

          <div className="py-2">
            <PinPad
              key={otpPadKey}
              length={6}
              title="Provider OTP"
              subtitle="Enter the Paystack transfer OTP"
              error={error}
              disabled={finalizingOtp}
              onInput={() => error && setError('')}
              onComplete={handleFinalizeTransferOtp}
            />
          </div>
        </Card>
      ) : null}

      {receipt && !receipt.requiresOtp && (
        <Card className="space-y-4 border-success/20 bg-success/5 p-5">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-success" />
            <h2 className="font-display text-xl font-bold">Service Completed</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="font-medium">{receipt.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reference</p>
              <p className="font-medium">{receipt.reference}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="font-medium">{getTransactionLabel(receipt.transactionType)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-medium">{isZeroDebitService(receipt.transactionType, receipt.amount) ? 'No wallet debit' : currency.format(receipt.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commission</p>
              <p className="font-medium">{currency.format(receipt.commissionEarned)}</p>
            </div>
            {receipt.targetName ? (
              <div>
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="font-medium">{receipt.targetName}</p>
                {receipt.targetDescription ? (
                  <p className="text-xs text-muted-foreground">{receipt.targetDescription}</p>
                ) : null}
              </div>
            ) : null}
            {receipt.destinationBankName ? (
              <div>
                <p className="text-xs text-muted-foreground">Bank</p>
                <p className="font-medium">{receipt.destinationBankName}</p>
              </div>
            ) : null}
            {receipt.destinationAccountNumber ? (
              <div>
                <p className="text-xs text-muted-foreground">Account Number</p>
                <p className="font-medium">{receipt.destinationAccountNumber}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs text-muted-foreground">Customer Balance After</p>
              <p className="font-medium">{currency.format(receipt.customerBalanceAfter)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Agent Float After</p>
              <p className="font-medium">{currency.format(receipt.agentFloatBalanceAfter)}</p>
            </div>
          </div>

          {receipt.message ? (
            <div className="rounded-xl bg-background/70 p-3 text-xs text-muted-foreground">
              {receipt.message}
            </div>
          ) : null}

          {receipt.statementItems?.length ? (
            <div className="space-y-3 rounded-xl bg-background/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Wallet Entries</p>
              <div className="space-y-2">
                {receipt.statementItems.map(item => (
                  <div key={item.entryId} className="rounded-lg border border-border/70 p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAtUtc).toLocaleString()} | {item.direction.toLowerCase()} | {item.status.toLowerCase()}
                        </p>
                      </div>
                      <p className="font-medium">{currency.format(item.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12" onClick={() => navigate('/agent/history')}>
              View History
            </Button>
            <Button className="h-12" onClick={reset}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AgentTransact;
