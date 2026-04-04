import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, Copy, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PinPad from '@/components/shared/PinPad';
import { createAgentAuthorization, type AgentAuthorization, type AgentTransactionType } from '@/services/agentApi';
import { getBillProviders } from '@/services/billPaymentsApi';
import { getSavingsPlans, savingsKeys } from '@/services/savingsApi';
import { circlesKeys, getCircles } from '@/services/circlesApi';
import { getGroupGoals, groupGoalsKeys } from '@/services/groupGoalsApi';
import { getPayoutBanks, resolveTransferAccount, type ResolveTransferAccountResponse } from '@/services/paymentApi';
import { getApiErrorMessage } from '@/lib/api/http';

type Step = 'form' | 'pin' | 'code';

type TargetOption = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  helper: string;
  accountLabel?: string;
  minimumAmount?: number;
};

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const transactionOptions: Array<{ value: AgentTransactionType; label: string }> = [
  { value: 'cash_out', label: 'Cash-out' },
  { value: 'cash_in', label: 'Cash-in' },
  { value: 'transfer', label: 'Local transfer' },
  { value: 'balance_enquiry', label: 'Balance enquiry' },
  { value: 'mini_statement', label: 'Mini statement' },
  { value: 'savings', label: 'Savings contribution' },
  { value: 'circle', label: 'Circle contribution' },
  { value: 'group_goal', label: 'Group goal contribution' },
];

const isCashService = (transactionType: AgentTransactionType) =>
  transactionType === 'cash_in' || transactionType === 'cash_out';

const isTransferService = (transactionType: AgentTransactionType) => transactionType === 'transfer';
const isBillPaymentService = (transactionType: AgentTransactionType) => transactionType === 'bill_payment';
const isEnquiryService = (transactionType: AgentTransactionType) =>
  transactionType === 'balance_enquiry' || transactionType === 'mini_statement';

const getTransactionLabel = (transactionType: AgentTransactionType) =>
  transactionOptions.find(option => option.value === transactionType)?.label ?? 'Agent service';

const AgentAccess = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [agentCode, setAgentCode] = useState('');
  const [transactionType, setTransactionType] = useState<AgentTransactionType>('cash_out');
  const [amount, setAmount] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [reason, setReason] = useState('');
  const [resolvedTransferAccount, setResolvedTransferAccount] = useState<ResolveTransferAccountResponse | null>(null);
  const [isResolvingTransferAccount, setIsResolvingTransferAccount] = useState(false);
  const [authorization, setAuthorization] = useState<AgentAuthorization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinPadKey, setPinPadKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const savingsQuery = useQuery({
    queryKey: savingsKeys.plans,
    queryFn: getSavingsPlans,
    enabled: transactionType === 'savings',
  });

  const circlesQuery = useQuery({
    queryKey: circlesKeys.list,
    queryFn: getCircles,
    enabled: transactionType === 'circle',
  });

  const groupGoalsQuery = useQuery({
    queryKey: groupGoalsKeys.list,
    queryFn: getGroupGoals,
    enabled: transactionType === 'group_goal',
  });

  const billProvidersQuery = useQuery({
    queryKey: ['bills', 'providers'],
    queryFn: getBillProviders,
    staleTime: 5 * 60 * 1000,
    enabled: transactionType === 'bill_payment',
  });

  const banksQuery = useQuery({
    queryKey: ['payments', 'banks'],
    queryFn: getPayoutBanks,
    staleTime: 5 * 60 * 1000,
    enabled: transactionType === 'transfer',
  });

  const normalizedAccountNumber = accountNumber.replace(/[^\d]/g, '');
  const parsedAmount = Number.parseFloat(amount);
  const cashService = isCashService(transactionType);
  const transferService = isTransferService(transactionType);
  const billPaymentService = isBillPaymentService(transactionType);
  const enquiryService = isEnquiryService(transactionType);
  const selectedBank = banksQuery.data?.find(bank => bank.code === bankCode) ?? null;

  useEffect(() => {
    setSelectedTargetId('');
    setAmount('');
    setBankCode('');
    setAccountNumber('');
    setReason('');
    setResolvedTransferAccount(null);
    setError('');
  }, [transactionType]);

  useEffect(() => {
    setResolvedTransferAccount(null);
  }, [bankCode, normalizedAccountNumber]);

  let targetOptions: TargetOption[] = [];
  let targetLoading = false;
  let targetLoadError = '';

  if (transactionType === 'savings') {
    targetLoading = savingsQuery.isLoading;
    targetLoadError = savingsQuery.isError ? getApiErrorMessage(savingsQuery.error, 'Unable to load savings plans.') : '';
    targetOptions = (savingsQuery.data ?? [])
      .filter(plan => plan.status === 'active')
      .map(plan => ({
        id: plan.id,
        name: plan.name,
        amount: plan.contributionAmount,
        currency: plan.currency,
        helper: `${plan.frequency} contribution`,
      }));
  } else if (transactionType === 'circle') {
    targetLoading = circlesQuery.isLoading;
    targetLoadError = circlesQuery.isError ? getApiErrorMessage(circlesQuery.error, 'Unable to load circles.') : '';
    targetOptions = (circlesQuery.data ?? [])
      .filter(circle => circle.status === 'active')
      .map(circle => ({
        id: circle.id,
        name: circle.name,
        amount: circle.amount,
        currency: circle.currency,
        helper: `Cycle ${circle.currentCycle} of ${circle.totalCycles}`,
      }));
  } else if (transactionType === 'group_goal') {
    targetLoading = groupGoalsQuery.isLoading;
    targetLoadError = groupGoalsQuery.isError ? getApiErrorMessage(groupGoalsQuery.error, 'Unable to load group goals.') : '';
    targetOptions = (groupGoalsQuery.data ?? [])
      .filter(goal => goal.status === 'active')
      .map(goal => ({
        id: goal.id,
        name: goal.name,
        amount: goal.contributionAmount,
        currency: goal.currency,
        helper: `${goal.memberCount} members`,
      }));
  } else if (transactionType === 'bill_payment') {
    targetLoading = billProvidersQuery.isLoading;
    targetLoadError = billProvidersQuery.isError ? getApiErrorMessage(billProvidersQuery.error, 'Unable to load bill providers.') : '';
    targetOptions = (billProvidersQuery.data ?? []).map(provider => ({
      id: provider.providerId,
      name: provider.name,
      amount: provider.minimumAmount,
      currency: provider.currency,
      helper: provider.accountLabel,
      accountLabel: provider.accountLabel,
      minimumAmount: provider.minimumAmount,
    }));
  }

  const selectedTarget = targetOptions.find(option => option.id === selectedTargetId) ?? null;
  const canContinue =
    agentCode.trim().length >= 4 &&
    (enquiryService
      ? true
      : cashService
      ? Number.isFinite(parsedAmount) && parsedAmount > 0
      : transferService
        ? !!bankCode && normalizedAccountNumber.length === 10 && Number.isFinite(parsedAmount) && parsedAmount >= 100
        : billPaymentService
          ? !!selectedTargetId && !!accountNumber.trim() && Number.isFinite(parsedAmount) && parsedAmount >= (selectedTarget?.minimumAmount ?? 0)
          : !!selectedTargetId);

  const handleResolveTransferAndContinue = async () => {
    if (!bankCode) {
      setError('Select a bank first.');
      return;
    }

    if (normalizedAccountNumber.length !== 10) {
      setError('Provide a valid 10-digit account number.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 100) {
      setError('Minimum transfer amount is NGN 100.');
      return;
    }

    setIsResolvingTransferAccount(true);
    setError('');

    try {
      const account = await resolveTransferAccount({
        accountNumber: normalizedAccountNumber,
        bankCode,
        bankName: selectedBank?.name,
        currency: 'NGN',
      });

      setResolvedTransferAccount(account);
      setStep('pin');
    } catch (resolveError) {
      setResolvedTransferAccount(null);
      setError(getApiErrorMessage(resolveError, 'Unable to resolve this bank account.'));
    } finally {
      setIsResolvingTransferAccount(false);
    }
  };

  const handleCreateAuthorization = async (pin: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await createAgentAuthorization({
        agentCode,
        transactionType,
        amount: cashService || transferService || billPaymentService ? parsedAmount : undefined,
        targetId: cashService || transferService || enquiryService ? undefined : selectedTargetId,
        destinationAccountNumber: transferService
          ? resolvedTransferAccount?.accountNumber ?? normalizedAccountNumber
          : billPaymentService
            ? accountNumber.trim()
            : undefined,
        destinationBankCode: transferService ? resolvedTransferAccount?.bankCode ?? bankCode : undefined,
        destinationBankName: transferService ? resolvedTransferAccount?.bankName ?? selectedBank?.name : undefined,
        reason: transferService ? reason : undefined,
        pin,
      });

      setAuthorization(response);
      setStep('code');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to generate agent authorization code.'));
      setPinPadKey(current => current + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!authorization) {
      return;
    }

    await navigator.clipboard.writeText(authorization.authorizationCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5 px-5 py-6">
      <button
        onClick={() => {
          if (step === 'pin') {
            setStep('form');
            return;
          }

          navigate('/more');
        }}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'form' && (
        <>
          <div>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Agent Access Code</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a one-time code for agent-assisted cash services, balance enquiry, mini statement, local transfer, or a fixed contribution to your savings, circle, or group goal.
            </p>
          </div>

          <Card className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="agentCode">Agent Code</Label>
              <Input
                id="agentCode"
                className="h-12 font-mono uppercase"
                placeholder="AJO-AG-123456"
                value={agentCode}
                onChange={event => setAgentCode(event.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={transactionType} onValueChange={value => setTransactionType(value as AgentTransactionType)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cashService ? (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  className="h-12"
                  placeholder="0.00"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                />
              </div>
            ) : transferService ? (
              <>
                <div className="space-y-2">
                  <Label>Bank</Label>
                  <Select
                    value={bankCode}
                    onValueChange={value => {
                      setBankCode(value);
                      setResolvedTransferAccount(null);
                      setError('');
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={banksQuery.isLoading ? 'Loading banks...' : 'Select bank'} />
                    </SelectTrigger>
                    <SelectContent>
                      {banksQuery.data?.map(bank => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer-account-number">Account Number</Label>
                  <Input
                    id="transfer-account-number"
                    inputMode="numeric"
                    className="h-12"
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={event => {
                      setAccountNumber(event.target.value.replace(/[^\d]/g, '').slice(0, 10));
                      setResolvedTransferAccount(null);
                      setError('');
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer-amount">Amount</Label>
                  <Input
                    id="transfer-amount"
                    inputMode="decimal"
                    className="h-12"
                    placeholder="0.00"
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer-reason">Narration</Label>
                  <Input
                    id="transfer-reason"
                    className="h-12"
                    placeholder="Optional"
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                  />
                </div>

                {resolvedTransferAccount && (
                  <div className="rounded-xl bg-muted/60 p-3 text-sm">
                    <p className="font-medium text-foreground">{resolvedTransferAccount.accountName}</p>
                    <p className="mt-1 text-muted-foreground">
                      {resolvedTransferAccount.bankName} | {resolvedTransferAccount.accountNumber}
                    </p>
                  </div>
                )}
              </>
            ) : billPaymentService ? (
              <>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={selectedTargetId} onValueChange={value => setSelectedTargetId(value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={targetLoading ? 'Loading providers...' : 'Select provider'} />
                    </SelectTrigger>
                    <SelectContent>
                      {targetOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {targetLoadError && <p className="text-xs text-destructive">{targetLoadError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bill-account-number">{selectedTarget?.accountLabel ?? 'Account number'}</Label>
                  <Input
                    id="bill-account-number"
                    className="h-12"
                    placeholder={selectedTarget?.accountLabel ?? 'Enter account number'}
                    value={accountNumber}
                    onChange={event => {
                      setAccountNumber(event.target.value);
                      setError('');
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bill-amount">Amount</Label>
                  <Input
                    id="bill-amount"
                    inputMode="decimal"
                    className="h-12"
                    placeholder="0.00"
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                  />
                </div>

                {selectedTarget && (
                  <div className="rounded-xl bg-muted/60 p-3 text-sm">
                    <p className="font-medium text-foreground">{selectedTarget.name}</p>
                    <p className="mt-1 text-muted-foreground">{selectedTarget.accountLabel}</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Minimum payment: {currency.format(selectedTarget.minimumAmount ?? 0)}
                    </p>
                  </div>
                )}
              </>
            ) : enquiryService ? (
              <div className="rounded-xl bg-muted/60 p-4 text-sm">
                <p className="font-medium text-foreground">{getTransactionLabel(transactionType)}</p>
                <p className="mt-1 text-muted-foreground">
                  {transactionType === 'balance_enquiry'
                    ? 'This lets the agent view your current available wallet balance once. No wallet debit will happen.'
                    : 'This lets the agent view your 5 most recent wallet entries once. No wallet debit will happen.'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select value={selectedTargetId} onValueChange={value => setSelectedTargetId(value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={targetLoading ? 'Loading targets...' : 'Select a target'} />
                    </SelectTrigger>
                    <SelectContent>
                      {targetOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {targetLoadError && <p className="text-xs text-destructive">{targetLoadError}</p>}
                  {!targetLoading && !targetLoadError && targetOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No active {transactionType === 'savings' ? 'savings plans' : transactionType === 'circle' ? 'circles' : 'group goals'} available for assisted contribution.
                    </p>
                  )}
                </div>

                {selectedTarget && (
                  <div className="rounded-xl bg-muted/60 p-3 text-sm">
                    <p className="font-medium text-foreground">{selectedTarget.name}</p>
                    <p className="mt-1 text-muted-foreground">{selectedTarget.helper}</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Locked contribution: {currency.format(selectedTarget.amount)}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              Use this only when you are physically with the agent. The code expires in 5 minutes and can be used once.
            </div>

            <Button
              className="h-12 w-full"
              disabled={!canContinue || targetLoading || banksQuery.isLoading || isResolvingTransferAccount}
              onClick={() => {
                if (transferService) {
                  void handleResolveTransferAndContinue();
                  return;
                }

                setStep('pin');
              }}
            >
              {transferService && isResolvingTransferAccount ? 'Verifying account...' : 'Continue'}
            </Button>
          </Card>
        </>
      )}

      {step === 'pin' && (
        <div className="pt-6">
          <PinPad
            key={pinPadKey}
            title="Confirm with PIN"
            subtitle={
              loading
                ? 'Generating authorization...'
                : enquiryService
                  ? getTransactionLabel(transactionType)
                : cashService
                  ? `${getTransactionLabel(transactionType)} of ${currency.format(parsedAmount || 0)}`
                : transferService
                  ? `${getTransactionLabel(transactionType)} to ${resolvedTransferAccount?.accountName ?? 'verified account'}`
                  : billPaymentService
                    ? `${getTransactionLabel(transactionType)} for ${selectedTarget?.name ?? 'selected provider'}`
                  : `${getTransactionLabel(transactionType)} to ${selectedTarget?.name ?? 'selected target'}`
            }
            error={error}
            disabled={loading}
            onInput={() => error && setError('')}
            onComplete={handleCreateAuthorization}
          />
        </div>
      )}

      {step === 'code' && authorization && (
        <>
          <Card className="space-y-4 border-success/20 bg-success/5 p-5">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-success" />
              <h1 className="font-display text-xl font-bold">Authorization Ready</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this code with the agent together with your phone number or email. The agent cannot change the locked service amount or target.
            </p>
          </Card>

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Authorization Code</p>
                <p className="font-display text-3xl font-bold tracking-[0.25em]">{authorization.authorizationCode}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void handleCopy()}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Agent</p>
                <p className="font-medium">{authorization.agentName}</p>
                <p className="text-xs text-muted-foreground">{authorization.agentCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="font-medium">{getTransactionLabel(authorization.transactionType)}</p>
                <p className="text-xs text-muted-foreground">
                  {authorization.amount > 0 ? currency.format(authorization.amount) : 'No wallet debit'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Service Fee</p>
                <p className="font-medium">{currency.format(authorization.serviceFee)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Customer Charge</p>
                <p className="font-medium">{currency.format(authorization.totalCharge)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Agent Share</p>
                <p className="font-medium">{currency.format(authorization.agentCommissionAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AjoVault Share</p>
                <p className="font-medium">{currency.format(authorization.platformRevenueAmount)}</p>
              </div>
            </div>

            {authorization.targetName && (
              <div className="rounded-xl bg-muted/60 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Locked Target</p>
                <p className="font-medium text-foreground">{authorization.targetName}</p>
                {authorization.targetDescription ? (
                  <p className="mt-1 text-xs text-muted-foreground">{authorization.targetDescription}</p>
                ) : null}
              </div>
            )}

            <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              Expires on {new Date(authorization.expiresAtUtc).toLocaleString()}.
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12" onClick={() => navigate('/notifications')}>
              Open Notifications
            </Button>
            <Button
              className="h-12"
              onClick={() => {
                setAuthorization(null);
                setAmount('');
                setSelectedTargetId('');
                setStep('form');
              }}
            >
              New Code
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentAccess;
