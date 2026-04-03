import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Landmark, Megaphone, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  createFundraiserUpdate,
  fundraisingKeys,
  getFundraiserManagement,
  saveFundraiserBeneficiary,
} from '@/services/fundraisingApi';
import { getPayoutBanks, resolveTransferAccount, type ResolveTransferAccountResponse } from '@/services/paymentApi';
import { formatCurrency, formatDate } from '@/services/mockData';

const FundraiserManage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('');
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedAccount, setResolvedAccount] = useState<ResolveTransferAccountResponse | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSavingBeneficiary, setIsSavingBeneficiary] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isPublishingUpdate, setIsPublishingUpdate] = useState(false);

  const managementQuery = useQuery({
    queryKey: id ? fundraisingKeys.manage(id) : fundraisingKeys.manage('missing'),
    queryFn: () => getFundraiserManagement(id!),
    enabled: !!id,
  });

  const banksQuery = useQuery({
    queryKey: ['payments', 'banks'],
    queryFn: getPayoutBanks,
    staleTime: 5 * 60 * 1000,
  });

  const management = managementQuery.data;
  const selectedBank = banksQuery.data?.find(bank => bank.code === bankCode) ?? null;

  useEffect(() => {
    if (!management) {
      return;
    }

    setBeneficiaryName(management.beneficiary.beneficiaryName ?? '');
    setBeneficiaryEmail(management.beneficiary.email ?? '');
    setBeneficiaryPhone(management.beneficiary.phoneNumber ?? '');
    setBankCode(management.beneficiary.bankCode ?? '');
    setAccountNumber('');
  }, [management]);

  if (managementQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading campaign tools...</div>;
  }

  if (!management) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {getApiErrorMessage(managementQuery.error, 'Campaign management is unavailable.')}
      </div>
    );
  }

  const refreshCampaign = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: fundraisingKeys.manage(management.fundraiserId) }),
      queryClient.invalidateQueries({ queryKey: fundraisingKeys.detail(management.fundraiserId) }),
      queryClient.invalidateQueries({ queryKey: fundraisingKeys.list }),
    ]);
  };

  const handleResolveBeneficiary = async () => {
    if (!bankCode || accountNumber.replace(/[^\d]/g, '').length !== 10) {
      toast.error('Choose a bank and enter a valid 10-digit account number.');
      return;
    }

    setIsResolving(true);
    try {
      const account = await resolveTransferAccount({
        accountNumber,
        bankCode,
        bankName: selectedBank?.name,
        currency: 'NGN',
      });

      setResolvedAccount(account);
      toast.success('Bank account resolved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to resolve this beneficiary account.'));
    } finally {
      setIsResolving(false);
    }
  };

  const handleSaveBeneficiary = async () => {
    setIsSavingBeneficiary(true);
    try {
      await saveFundraiserBeneficiary(management.fundraiserId, {
        beneficiaryName,
        accountNumber,
        bankCode,
        bankName: selectedBank?.name,
        email: beneficiaryEmail,
        phoneNumber: beneficiaryPhone,
      });

      await refreshCampaign();
      toast.success('Campaign beneficiary verified.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save the campaign beneficiary.'));
    } finally {
      setIsSavingBeneficiary(false);
    }
  };

  const handlePublishUpdate = async () => {
    setIsPublishingUpdate(true);
    try {
      await createFundraiserUpdate(management.fundraiserId, {
        title: updateTitle,
        message: updateMessage,
      });

      setUpdateTitle('');
      setUpdateMessage('');
      await refreshCampaign();
      toast.success('Campaign update published.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to publish the campaign update.'));
    } finally {
      setIsPublishingUpdate(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-24">
      <button onClick={() => navigate(`/fundraising/${management.fundraiserId}`)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Manage Campaign</h1>
          <p className="mt-1 text-sm text-muted-foreground">{management.title}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate(`/fundraising/${management.fundraiserId}/invite`)}>
          <Send className="mr-2 h-4 w-4" /> Invite
        </Button>
      </div>

      {management.coverImageUrl ? (
        <Card className="mb-6 overflow-hidden rounded-3xl">
          <img
            src={management.coverImageUrl}
            alt={management.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </Card>
      ) : null}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="rounded-2xl p-4"><p className="text-xs text-muted-foreground">Raised</p><p className="mt-1 font-semibold">{formatCurrency(management.raisedAmount)}</p></Card>
        <Card className="rounded-2xl p-4"><p className="text-xs text-muted-foreground">Available</p><p className="mt-1 font-semibold">{formatCurrency(management.availableBalance)}</p></Card>
        <Card className="rounded-2xl p-4"><p className="text-xs text-muted-foreground">Withdrawn</p><p className="mt-1 font-semibold">{formatCurrency(management.withdrawnAmount)}</p></Card>
      </div>

      <Card className="mb-6 rounded-2xl p-4">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-success" />
          <h2 className="font-display text-lg font-bold text-foreground">Beneficiary</h2>
        </div>
        {management.beneficiary.isVerified && (
          <Alert className="mb-4 border-success/20 bg-success/5">
            <AlertTitle>Verified beneficiary</AlertTitle>
            <AlertDescription>
              {management.beneficiary.accountName} / {management.beneficiary.bankName} / {management.beneficiary.accountNumberMasked}
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-3">
          <Input placeholder="Beneficiary name" value={beneficiaryName} onChange={event => setBeneficiaryName(event.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email (optional)" value={beneficiaryEmail} onChange={event => setBeneficiaryEmail(event.target.value)} />
            <Input placeholder="Phone (optional)" value={beneficiaryPhone} onChange={event => setBeneficiaryPhone(event.target.value)} />
          </div>
          <Select value={bankCode} onValueChange={value => { setBankCode(value); setResolvedAccount(null); }}>
            <SelectTrigger><SelectValue placeholder={banksQuery.isLoading ? 'Loading banks...' : 'Choose bank'} /></SelectTrigger>
            <SelectContent>{banksQuery.data?.map(bank => <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex gap-3">
            <Input
              placeholder="Account number"
              value={accountNumber}
              onChange={event => { setAccountNumber(event.target.value.replace(/[^\d]/g, '').slice(0, 10)); setResolvedAccount(null); }}
            />
            <Button type="button" variant="outline" onClick={handleResolveBeneficiary} disabled={isResolving}>
              <Landmark className="mr-2 h-4 w-4" /> {isResolving ? 'Checking...' : 'Resolve'}
            </Button>
          </div>
          {resolvedAccount && (
            <div className="rounded-xl border border-success/20 bg-success/5 p-3 text-sm text-foreground">
              {resolvedAccount.accountName} / {resolvedAccount.bankName}
            </div>
          )}
          <Button className="w-full" onClick={handleSaveBeneficiary} disabled={isSavingBeneficiary}>
            {isSavingBeneficiary ? 'Saving beneficiary...' : 'Verify Beneficiary'}
          </Button>
        </div>
      </Card>

      <Card className="mb-6 rounded-2xl p-4">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg font-bold text-foreground">Campaign Updates</h2>
        </div>
        <div className="space-y-3">
          <Input placeholder="Update title" value={updateTitle} onChange={event => setUpdateTitle(event.target.value)} />
          <Textarea placeholder="Tell supporters what changed..." rows={4} value={updateMessage} onChange={event => setUpdateMessage(event.target.value)} />
          <Button className="w-full" onClick={handlePublishUpdate} disabled={isPublishingUpdate}>
            {isPublishingUpdate ? 'Publishing...' : 'Publish Update'}
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {management.updates.length === 0 && (
            <EmptyTableState
              title="No updates yet"
              description="Published campaign updates will appear here for you and your supporters."
            />
          )}
          {management.updates.map(update => (
            <div key={update.id} className="rounded-xl border border-border p-3">
              <p className="font-medium text-foreground">{update.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{update.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(update.createdAtUtc)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-2xl p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Withdrawals</h2>
            <p className="text-sm text-muted-foreground">Transfer available campaign funds to the verified beneficiary.</p>
          </div>
          <Button onClick={() => navigate(`/fundraising/${management.fundraiserId}/withdraw`)}>Withdraw</Button>
        </div>
        <div className="space-y-3">
          {management.withdrawals.length === 0 && (
            <EmptyTableState
              title="No withdrawals yet"
              description="Withdrawal records will appear here after funds are moved to the verified beneficiary."
            />
          )}
          {management.withdrawals.map(withdrawal => (
            <div key={withdrawal.withdrawalId} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{formatCurrency(withdrawal.amount)}</p>
                <p className="text-xs capitalize text-muted-foreground">{withdrawal.status}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {withdrawal.destinationAccountName} / {withdrawal.destinationBankName}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(withdrawal.createdAtUtc)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FundraiserManage;
