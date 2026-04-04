import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  getAdminAgentOperationSettings,
  updateAdminAgentOperationSettings,
  type AgentOperationSettings,
} from '@/services/adminSettingsApi';

interface SettingsFormState {
  maxSingleTransactionAmount: string;
  basicKycDailyTransferLimit: string;
  verifiedKycDailyTransferLimit: string;
  premiumKycDailyTransferLimit: string;
  transferFeeBandOneMax: string;
  transferFeeBandOneAmount: string;
  transferFeeBandTwoMax: string;
  transferFeeBandTwoAmount: string;
  transferFeeBandThreeAmount: string;
  transferStampDutyThreshold: string;
  transferStampDutyAmount: string;
  transferPassStampDutyToUser: boolean;
  cashInCommissionPercent: string;
  cashOutCommissionPercent: string;
  transferAssistedServiceFeePercent: string;
  billPaymentCommissionPercent: string;
  balanceEnquiryFee: string;
  miniStatementFee: string;
  agentCommissionSharePercent: string;
  platformCommissionSharePercent: string;
  registrationBonusAmount: string;
  campaignDefaultTipPercent: string;
  campaignAllowCustomTip: boolean;
  campaignEnableCoverFees: boolean;
  campaignWithdrawalFeePercent: string;
  campaignWithdrawalFeeCap: string;
  walletFundingCheckoutProvider: string;
  walletFundingTransferAccountProvider: string;
  walletFundingCheckoutFeeMode: string;
  walletFundingCheckoutMarkupPercent: string;
  walletFundingTransferAccountFeeMode: string;
  paymentProcessorPercent: string;
  paymentProcessorFlatFee: string;
  paymentProcessorFlatFeeThreshold: string;
  paymentProcessorFeeCap: string;
}

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatNumber = (value: number, fractionDigits = 4) => {
  const normalized = Number(value.toFixed(fractionDigits));
  return Number.isInteger(normalized) ? String(normalized) : String(normalized);
};

const toPercent = (value: number) => formatNumber(value * 100, 4);

const toFormState = (settings: AgentOperationSettings): SettingsFormState => ({
  maxSingleTransactionAmount: formatNumber(settings.maxSingleTransactionAmount, 2),
  basicKycDailyTransferLimit: formatNumber(settings.basicKycDailyTransferLimit, 2),
  verifiedKycDailyTransferLimit: formatNumber(settings.verifiedKycDailyTransferLimit, 2),
  premiumKycDailyTransferLimit: formatNumber(settings.premiumKycDailyTransferLimit, 2),
  transferFeeBandOneMax: formatNumber(settings.transferFeeBandOneMax, 2),
  transferFeeBandOneAmount: formatNumber(settings.transferFeeBandOneAmount, 2),
  transferFeeBandTwoMax: formatNumber(settings.transferFeeBandTwoMax, 2),
  transferFeeBandTwoAmount: formatNumber(settings.transferFeeBandTwoAmount, 2),
  transferFeeBandThreeAmount: formatNumber(settings.transferFeeBandThreeAmount, 2),
  transferStampDutyThreshold: formatNumber(settings.transferStampDutyThreshold, 2),
  transferStampDutyAmount: formatNumber(settings.transferStampDutyAmount, 2),
  transferPassStampDutyToUser: settings.transferPassStampDutyToUser,
  cashInCommissionPercent: toPercent(settings.cashInCommissionRate),
  cashOutCommissionPercent: toPercent(settings.cashOutCommissionRate),
  transferAssistedServiceFeePercent: toPercent(settings.transferAssistedServiceFeeRate),
  billPaymentCommissionPercent: toPercent(settings.billPaymentCommissionRate),
  balanceEnquiryFee: formatNumber(settings.balanceEnquiryFee, 2),
  miniStatementFee: formatNumber(settings.miniStatementFee, 2),
  agentCommissionSharePercent: toPercent(settings.agentCommissionShareRate),
  platformCommissionSharePercent: toPercent(settings.platformCommissionShareRate),
  registrationBonusAmount: formatNumber(settings.registrationBonusAmount, 2),
  campaignDefaultTipPercent: toPercent(settings.campaignDefaultTipRate),
  campaignAllowCustomTip: settings.campaignAllowCustomTip,
  campaignEnableCoverFees: settings.campaignEnableCoverFees,
  campaignWithdrawalFeePercent: toPercent(settings.campaignWithdrawalFeeRate),
  campaignWithdrawalFeeCap: formatNumber(settings.campaignWithdrawalFeeCap, 2),
  walletFundingCheckoutProvider: settings.walletFundingCheckoutProvider,
  walletFundingTransferAccountProvider: settings.walletFundingTransferAccountProvider,
  walletFundingCheckoutFeeMode: settings.walletFundingCheckoutFeeMode,
  walletFundingCheckoutMarkupPercent: toPercent(settings.walletFundingCheckoutMarkupRate),
  walletFundingTransferAccountFeeMode: settings.walletFundingTransferAccountFeeMode,
  paymentProcessorPercent: toPercent(settings.paymentProcessorRate),
  paymentProcessorFlatFee: formatNumber(settings.paymentProcessorFlatFee, 2),
  paymentProcessorFlatFeeThreshold: formatNumber(settings.paymentProcessorFlatFeeThreshold, 2),
  paymentProcessorFeeCap: formatNumber(settings.paymentProcessorFeeCap, 2),
});

const parseNonNegativeNumber = (value: string, label: string) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid non-negative number.`);
  }

  return parsed;
};

const parsePercent = (value: string, label: string) => {
  const parsed = parseNonNegativeNumber(value, label);
  if (parsed > 100) {
    throw new Error(`${label} must be between 0 and 100.`);
  }

  return parsed / 100;
};

const NumberField = ({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: keyof SettingsFormState;
  label: string;
  value: string;
  onChange: (field: keyof SettingsFormState, value: string) => void;
  hint?: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="number"
      min="0"
      step="0.01"
      inputMode="decimal"
      value={value}
      onChange={event => onChange(id, event.target.value)}
    />
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);

const AdminSettings = () => {
  const [settings, setSettings] = useState<AgentOperationSettings | null>(null);
  const [form, setForm] = useState<SettingsFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getAdminAgentOperationSettings();
      setSettings(response);
      setForm(toFormState(response));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load monetization settings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleChange = (field: keyof SettingsFormState, value: string | boolean) => {
    setForm(current => (current ? { ...current, [field]: value } : current));
  };

  const handleReset = () => {
    if (!settings) {
      return;
    }

    setForm(toFormState(settings));
    setError('');
  };

  const handleSave = async () => {
    if (!form) {
      return;
    }

    try {
      const payload = {
        maxSingleTransactionAmount: parseNonNegativeNumber(form.maxSingleTransactionAmount, 'Max single assisted transaction'),
        basicKycDailyTransferLimit: parseNonNegativeNumber(form.basicKycDailyTransferLimit, 'Basic KYC daily transfer limit'),
        verifiedKycDailyTransferLimit: parseNonNegativeNumber(form.verifiedKycDailyTransferLimit, 'Verified KYC daily transfer limit'),
        premiumKycDailyTransferLimit: parseNonNegativeNumber(form.premiumKycDailyTransferLimit, 'Premium KYC daily transfer limit'),
        transferFeeBandOneMax: parseNonNegativeNumber(form.transferFeeBandOneMax, 'Transfer fee band one maximum'),
        transferFeeBandOneAmount: parseNonNegativeNumber(form.transferFeeBandOneAmount, 'Transfer fee band one fee'),
        transferFeeBandTwoMax: parseNonNegativeNumber(form.transferFeeBandTwoMax, 'Transfer fee band two maximum'),
        transferFeeBandTwoAmount: parseNonNegativeNumber(form.transferFeeBandTwoAmount, 'Transfer fee band two fee'),
        transferFeeBandThreeAmount: parseNonNegativeNumber(form.transferFeeBandThreeAmount, 'Transfer fee band three fee'),
        transferStampDutyThreshold: parseNonNegativeNumber(form.transferStampDutyThreshold, 'Stamp duty threshold'),
        transferStampDutyAmount: parseNonNegativeNumber(form.transferStampDutyAmount, 'Stamp duty amount'),
        transferPassStampDutyToUser: form.transferPassStampDutyToUser,
        cashInCommissionRate: parsePercent(form.cashInCommissionPercent, 'Cash-in service fee'),
        cashOutCommissionRate: parsePercent(form.cashOutCommissionPercent, 'Cash-out service fee'),
        transferAssistedServiceFeeRate: parsePercent(form.transferAssistedServiceFeePercent, 'Assisted transfer service fee'),
        billPaymentCommissionRate: parsePercent(form.billPaymentCommissionPercent, 'Bill payment service fee'),
        balanceEnquiryFee: parseNonNegativeNumber(form.balanceEnquiryFee, 'Balance enquiry fee'),
        miniStatementFee: parseNonNegativeNumber(form.miniStatementFee, 'Mini statement fee'),
        agentCommissionShareRate: parsePercent(form.agentCommissionSharePercent, 'Agent share'),
        platformCommissionShareRate: parsePercent(form.platformCommissionSharePercent, 'AjoVault share'),
        registrationBonusAmount: parseNonNegativeNumber(form.registrationBonusAmount, 'Registration bonus'),
        campaignDefaultTipRate: parsePercent(form.campaignDefaultTipPercent, 'Campaign default tip'),
        campaignAllowCustomTip: form.campaignAllowCustomTip,
        campaignEnableCoverFees: form.campaignEnableCoverFees,
        campaignWithdrawalFeeRate: parsePercent(form.campaignWithdrawalFeePercent, 'Campaign withdrawal fee'),
        campaignWithdrawalFeeCap: parseNonNegativeNumber(form.campaignWithdrawalFeeCap, 'Campaign withdrawal fee cap'),
        walletFundingCheckoutProvider: form.walletFundingCheckoutProvider,
        walletFundingTransferAccountProvider: form.walletFundingTransferAccountProvider,
        walletFundingCheckoutFeeMode: form.walletFundingCheckoutFeeMode,
        walletFundingCheckoutMarkupRate: parsePercent(form.walletFundingCheckoutMarkupPercent, 'Wallet funding markup'),
        walletFundingTransferAccountFeeMode: form.walletFundingTransferAccountFeeMode,
        paymentProcessorRate: parsePercent(form.paymentProcessorPercent, 'Processor rate'),
        paymentProcessorFlatFee: parseNonNegativeNumber(form.paymentProcessorFlatFee, 'Processor flat fee'),
        paymentProcessorFlatFeeThreshold: parseNonNegativeNumber(form.paymentProcessorFlatFeeThreshold, 'Processor flat fee threshold'),
        paymentProcessorFeeCap: parseNonNegativeNumber(form.paymentProcessorFeeCap, 'Processor fee cap'),
      };

      if (payload.verifiedKycDailyTransferLimit < payload.basicKycDailyTransferLimit) {
        toast.error('Verified KYC daily transfer limit cannot be lower than the basic KYC limit.');
        return;
      }

      if (payload.premiumKycDailyTransferLimit < payload.verifiedKycDailyTransferLimit) {
        toast.error('Premium KYC daily transfer limit cannot be lower than the verified KYC limit.');
        return;
      }

      if (payload.transferFeeBandTwoMax < payload.transferFeeBandOneMax) {
        toast.error('Transfer fee band two maximum cannot be lower than band one maximum.');
        return;
      }

      const shareTotal = Number((payload.agentCommissionShareRate + payload.platformCommissionShareRate).toFixed(4));
      if (shareTotal !== 1) {
        toast.error('Agent and AjoVault revenue shares must add up to 100%.');
        return;
      }

      setSaving(true);
      setError('');

      const response = await updateAdminAgentOperationSettings(payload);
      setSettings(response);
      setForm(toFormState(response));
      toast.success('Monetization settings updated.');
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : getApiErrorMessage(err, 'Unable to save monetization settings.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure assisted-service pricing, transfer fees, campaign monetization, wallet funding rules, and the current 50/50 agent-to-AjoVault split.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {loading || !form || !settings ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading monetization settings...</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assisted Transaction Limits</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <NumberField id="maxSingleTransactionAmount" label="Max single assisted transaction (NGN)" value={form.maxSingleTransactionAmount} onChange={handleChange} />
              <NumberField id="basicKycDailyTransferLimit" label="Basic KYC daily assisted transfer limit (NGN)" value={form.basicKycDailyTransferLimit} onChange={handleChange} />
              <NumberField id="verifiedKycDailyTransferLimit" label="Verified KYC daily assisted transfer limit (NGN)" value={form.verifiedKycDailyTransferLimit} onChange={handleChange} />
              <NumberField id="premiumKycDailyTransferLimit" label="Premium KYC daily assisted transfer limit (NGN)" value={form.premiumKycDailyTransferLimit} onChange={handleChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transfer Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <NumberField id="transferFeeBandOneMax" label="Band 1 maximum amount (NGN)" value={form.transferFeeBandOneMax} onChange={handleChange} />
              <NumberField id="transferFeeBandOneAmount" label="Band 1 fee (NGN)" value={form.transferFeeBandOneAmount} onChange={handleChange} />
              <NumberField id="transferFeeBandTwoMax" label="Band 2 maximum amount (NGN)" value={form.transferFeeBandTwoMax} onChange={handleChange} />
              <NumberField id="transferFeeBandTwoAmount" label="Band 2 fee (NGN)" value={form.transferFeeBandTwoAmount} onChange={handleChange} />
              <NumberField id="transferFeeBandThreeAmount" label="Band 3 fee (NGN)" value={form.transferFeeBandThreeAmount} onChange={handleChange} />
              <NumberField id="transferStampDutyThreshold" label="Stamp duty threshold (NGN)" value={form.transferStampDutyThreshold} onChange={handleChange} />
              <NumberField id="transferStampDutyAmount" label="Stamp duty amount (NGN)" value={form.transferStampDutyAmount} onChange={handleChange} />
              <div className="space-y-2">
                <Label htmlFor="transferPassStampDutyToUser">Pass stamp duty to user</Label>
                <div className="flex h-10 items-center rounded-md border px-3">
                  <Switch
                    id="transferPassStampDutyToUser"
                    checked={form.transferPassStampDutyToUser}
                    onCheckedChange={checked => handleChange('transferPassStampDutyToUser', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Service Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <NumberField id="cashInCommissionPercent" label="Cash-in fee (%)" value={form.cashInCommissionPercent} onChange={handleChange} />
              <NumberField id="cashOutCommissionPercent" label="Cash-out fee (%)" value={form.cashOutCommissionPercent} onChange={handleChange} />
              <NumberField id="transferAssistedServiceFeePercent" label="Assisted transfer fee (%)" value={form.transferAssistedServiceFeePercent} onChange={handleChange} />
              <NumberField id="billPaymentCommissionPercent" label="Bill payment fee (%)" value={form.billPaymentCommissionPercent} onChange={handleChange} />
              <NumberField id="balanceEnquiryFee" label="Balance enquiry fee (NGN)" value={form.balanceEnquiryFee} onChange={handleChange} />
              <NumberField id="miniStatementFee" label="Mini statement fee (NGN)" value={form.miniStatementFee} onChange={handleChange} />
              <NumberField id="agentCommissionSharePercent" label="Agent share (%)" value={form.agentCommissionSharePercent} onChange={handleChange} hint="Keep this at 50 for the current 50/50 split." />
              <NumberField id="platformCommissionSharePercent" label="AjoVault share (%)" value={form.platformCommissionSharePercent} onChange={handleChange} hint="Keep this at 50 for the current 50/50 split." />
              <NumberField id="registrationBonusAmount" label="Registration bonus (NGN)" value={form.registrationBonusAmount} onChange={handleChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Monetization</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <NumberField id="campaignDefaultTipPercent" label="Default donation tip (%)" value={form.campaignDefaultTipPercent} onChange={handleChange} />
              <NumberField id="campaignWithdrawalFeePercent" label="Withdrawal fee (%)" value={form.campaignWithdrawalFeePercent} onChange={handleChange} />
              <NumberField id="campaignWithdrawalFeeCap" label="Withdrawal fee cap (NGN)" value={form.campaignWithdrawalFeeCap} onChange={handleChange} />
              <div className="space-y-2">
                <Label htmlFor="campaignAllowCustomTip">Allow custom donation tips</Label>
                <div className="flex h-10 items-center rounded-md border px-3">
                  <Switch
                    id="campaignAllowCustomTip"
                    checked={form.campaignAllowCustomTip}
                    onCheckedChange={checked => handleChange('campaignAllowCustomTip', checked)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaignEnableCoverFees">Allow donors to cover processing fees</Label>
                <div className="flex h-10 items-center rounded-md border px-3">
                  <Switch
                    id="campaignEnableCoverFees"
                    checked={form.campaignEnableCoverFees}
                    onCheckedChange={checked => handleChange('campaignEnableCoverFees', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wallet Funding Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="walletFundingCheckoutProvider">User checkout provider</Label>
                <Select value={form.walletFundingCheckoutProvider} onValueChange={value => handleChange('walletFundingCheckoutProvider', value)}>
                  <SelectTrigger id="walletFundingCheckoutProvider">
                    <SelectValue placeholder="Choose checkout provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paystack">Paystack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="walletFundingTransferAccountProvider">Transfer-account provider</Label>
                <Select value={form.walletFundingTransferAccountProvider} onValueChange={value => handleChange('walletFundingTransferAccountProvider', value)}>
                  <SelectTrigger id="walletFundingTransferAccountProvider">
                    <SelectValue placeholder="Choose transfer-account provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="paystack">Paystack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="walletFundingCheckoutFeeMode">Checkout fee mode</Label>
                <Select value={form.walletFundingCheckoutFeeMode} onValueChange={value => handleChange('walletFundingCheckoutFeeMode', value)}>
                  <SelectTrigger id="walletFundingCheckoutFeeMode">
                    <SelectValue placeholder="Choose fee mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absorb">Absorb</SelectItem>
                    <SelectItem value="pass_through">Pass through</SelectItem>
                    <SelectItem value="markup">Markup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NumberField id="walletFundingCheckoutMarkupPercent" label="Checkout markup (%)" value={form.walletFundingCheckoutMarkupPercent} onChange={handleChange} />
              <div className="space-y-2">
                <Label htmlFor="walletFundingTransferAccountFeeMode">Transfer-account fee mode</Label>
                <Select value={form.walletFundingTransferAccountFeeMode} onValueChange={value => handleChange('walletFundingTransferAccountFeeMode', value)}>
                  <SelectTrigger id="walletFundingTransferAccountFeeMode">
                    <SelectValue placeholder="Choose transfer-account fee mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absorb">Absorb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processor Estimate</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <NumberField id="paymentProcessorPercent" label="Processor rate (%)" value={form.paymentProcessorPercent} onChange={handleChange} />
              <NumberField id="paymentProcessorFlatFee" label="Processor flat fee (NGN)" value={form.paymentProcessorFlatFee} onChange={handleChange} />
              <NumberField id="paymentProcessorFlatFeeThreshold" label="Flat fee threshold (NGN)" value={form.paymentProcessorFlatFeeThreshold} onChange={handleChange} />
              <NumberField id="paymentProcessorFeeCap" label="Processor fee cap (NGN)" value={form.paymentProcessorFeeCap} onChange={handleChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Effective Values</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Last updated: {dateTimeFormatter.format(new Date(settings.updatedAtUtc))}</p>
              <p>Transfer fee bands: up to {currency.format(settings.transferFeeBandOneMax)} = {currency.format(settings.transferFeeBandOneAmount)}, up to {currency.format(settings.transferFeeBandTwoMax)} = {currency.format(settings.transferFeeBandTwoAmount)}, above that = {currency.format(settings.transferFeeBandThreeAmount)}</p>
              <p>Agent / AjoVault split: {formatPercent(settings.agentCommissionShareRate)} / {formatPercent(settings.platformCommissionShareRate)}</p>
              <p>Campaign default tip: {formatPercent(settings.campaignDefaultTipRate)}</p>
              <p>Wallet funding fee mode: {formatFeeMode(settings.walletFundingCheckoutFeeMode)}</p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" disabled={saving} onClick={handleReset}>
              Reset
            </Button>
            <Button disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSettings;

const formatPercent = (value: number) => `${formatNumber(value * 100, 2)}%`;

const formatFeeMode = (value: string) =>
  value.trim().toLowerCase() === 'pass_through'
    ? 'Pass through'
    : value.trim().toLowerCase() === 'markup'
      ? 'Markup'
      : 'Absorb';
