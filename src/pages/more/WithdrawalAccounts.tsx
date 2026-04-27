import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Landmark, LoaderCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getApiErrorMessage } from '@/lib/api/http';
import { getPayoutBanks } from '@/services/paymentApi';
import {
  activateMyWithdrawalAccount,
  deleteMyWithdrawalAccount,
  getMyWithdrawalAccounts,
  saveMyWithdrawalAccount,
  withdrawalAccountKeys,
} from '@/services/withdrawalAccountsApi';

const WithdrawalAccounts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const withdrawalAccountsQuery = useQuery({
    queryKey: withdrawalAccountKeys.me,
    queryFn: getMyWithdrawalAccounts,
  });
  const banksQuery = useQuery({
    queryKey: ['payments', 'banks'],
    queryFn: getPayoutBanks,
    staleTime: 5 * 60 * 1000,
  });

  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [makeActive, setMakeActive] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [activatingAccountId, setActivatingAccountId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);

  const withdrawalAccounts = withdrawalAccountsQuery.data ?? [];
  const canAddWithdrawalAccount = withdrawalAccounts.length < 2;
  const selectedBank = banksQuery.data?.find(bank => bank.code === bankCode) ?? null;
  const isFirstWithdrawalAccount = withdrawalAccounts.length === 0;

  const resetAddAccountForm = () => {
    setAccountNumber('');
    setBankCode('');
    setMakeActive(isFirstWithdrawalAccount);
    setAccountError('');
    setShowAddAccountForm(false);
  };

  const handleSaveWithdrawalAccount = async () => {
    const normalizedAccountNumber = accountNumber.replace(/[^\d]/g, '');

    if (!bankCode) {
      setAccountError('Select a bank first.');
      return;
    }

    if (normalizedAccountNumber.length !== 10) {
      setAccountError('Provide a valid 10-digit account number.');
      return;
    }

    setIsSavingAccount(true);
    setAccountError('');

    try {
      const savedAccount = await saveMyWithdrawalAccount({
        accountNumber: normalizedAccountNumber,
        bankCode,
        bankName: selectedBank?.name,
        currency: 'NGN',
        makeActive,
      });

      resetAddAccountForm();
      await queryClient.invalidateQueries({ queryKey: withdrawalAccountKeys.me });
      toast.success(`${savedAccount.accountName} has been saved for withdrawals.`);
    } catch (saveError) {
      const message = getApiErrorMessage(saveError, 'Unable to verify and save this withdrawal account.');
      setAccountError(message);
      toast.error(message);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleActivateWithdrawalAccount = async (accountId: string) => {
    setActivatingAccountId(accountId);
    setAccountError('');

    try {
      await activateMyWithdrawalAccount(accountId);
      await queryClient.invalidateQueries({ queryKey: withdrawalAccountKeys.me });
      toast.success('This account will now be used for withdrawals.');
    } catch (activateError) {
      const message = getApiErrorMessage(activateError, 'Unable to activate this withdrawal account.');
      setAccountError(message);
      toast.error(message);
    } finally {
      setActivatingAccountId(null);
    }
  };

  const handleDeleteWithdrawalAccount = async (accountId: string) => {
    setDeletingAccountId(accountId);
    setAccountError('');

    try {
      await deleteMyWithdrawalAccount(accountId);
      await queryClient.invalidateQueries({ queryKey: withdrawalAccountKeys.me });
      toast.success('Withdrawal account removed.');
    } catch (deleteError) {
      const message = getApiErrorMessage(deleteError, 'Unable to remove this withdrawal account.');
      setAccountError(message);
      toast.error(message);
    } finally {
      setDeletingAccountId(null);
    }
  };

  return (
    <div className="min-h-screen space-y-6 px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold">Withdrawal Accounts</h1>
        <p className="text-sm text-muted-foreground">Save up to two verified bank accounts.</p>
      </div>

      {(withdrawalAccountsQuery.isLoading || banksQuery.isLoading) && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading withdrawal accounts...
        </div>
      )}

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-foreground">Saved Accounts</h2>
        </div>

        {withdrawalAccounts.map(account => (
          <div key={account.accountId} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{account.accountName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {account.bankName} / {account.accountNumberMasked}
                </p>
              </div>
              {account.isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  Saved
                </span>
              )}
            </div>

            <div className="flex gap-3">
              {!account.isActive && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleActivateWithdrawalAccount(account.accountId)}
                  disabled={activatingAccountId === account.accountId || deletingAccountId === account.accountId}
                >
                  {activatingAccountId === account.accountId ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    'Use for withdrawals'
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteWithdrawalAccount(account.accountId)}
                disabled={deletingAccountId === account.accountId || activatingAccountId === account.accountId}
              >
                {deletingAccountId === account.accountId ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}

        {canAddWithdrawalAccount ? (
          showAddAccountForm ? (
            <div className="space-y-4 rounded-2xl border border-dashed border-border p-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawal-bank">Bank</Label>
                <Select
                  value={bankCode}
                  onValueChange={value => {
                    setBankCode(value);
                    setAccountError('');
                  }}
                >
                  <SelectTrigger id="withdrawal-bank" className="h-12">
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
                <Label htmlFor="withdrawal-account-number">Account Number</Label>
                <Input
                  id="withdrawal-account-number"
                  type="tel"
                  inputMode="numeric"
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={event => {
                    setAccountNumber(event.target.value.replace(/[^\d]/g, '').slice(0, 10));
                    setAccountError('');
                  }}
                  className="h-12"
                />
              </div>

              {isFirstWithdrawalAccount ? (
                <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">This will become your active withdrawal account</p>
                  <p className="text-xs text-muted-foreground">Your first verified account is used automatically for withdrawals.</p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Use as active withdrawal account</p>
                    <p className="text-xs text-muted-foreground">New withdrawals will go to this account right away.</p>
                  </div>
                  <Switch checked={makeActive} onCheckedChange={value => setMakeActive(value)} />
                </div>
              )}

              {accountError && <p className="text-sm text-destructive">{accountError}</p>}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1"
                  onClick={resetAddAccountForm}
                  disabled={isSavingAccount}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-1"
                  onClick={handleSaveWithdrawalAccount}
                  disabled={isSavingAccount || banksQuery.isLoading}
                >
                  {isSavingAccount ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify and save account'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={() => {
                setAccountError('');
                setMakeActive(isFirstWithdrawalAccount);
                setShowAddAccountForm(true);
              }}
            >
              Add account
            </Button>
          )
        ) : (
          <p className="text-sm text-muted-foreground">You already have two verified withdrawal accounts. Remove one to add another.</p>
        )}
      </Card>
    </div>
  );
};

export default WithdrawalAccounts;
