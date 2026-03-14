import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  cashInCommissionPercent: string;
  cashOutCommissionPercent: string;
  billPaymentCommissionPercent: string;
  registrationBonusAmount: string;
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

const toFormState = (settings: AgentOperationSettings): SettingsFormState => ({
  maxSingleTransactionAmount: formatNumber(settings.maxSingleTransactionAmount, 2),
  basicKycDailyTransferLimit: formatNumber(settings.basicKycDailyTransferLimit, 2),
  verifiedKycDailyTransferLimit: formatNumber(settings.verifiedKycDailyTransferLimit, 2),
  premiumKycDailyTransferLimit: formatNumber(settings.premiumKycDailyTransferLimit, 2),
  cashInCommissionPercent: formatNumber(settings.cashInCommissionRate * 100),
  cashOutCommissionPercent: formatNumber(settings.cashOutCommissionRate * 100),
  billPaymentCommissionPercent: formatNumber(settings.billPaymentCommissionRate * 100),
  registrationBonusAmount: formatNumber(settings.registrationBonusAmount, 2),
});

const parseNonNegativeNumber = (value: string, label: string) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid non-negative number.`);
  }

  return parsed;
};

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
      setError(getApiErrorMessage(err, 'Unable to load agent operation settings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleChange = (field: keyof SettingsFormState, value: string) => {
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
      const maxSingleTransactionAmount = parseNonNegativeNumber(form.maxSingleTransactionAmount, 'Max single transaction amount');
      const basicKycDailyTransferLimit = parseNonNegativeNumber(form.basicKycDailyTransferLimit, 'Basic KYC daily transfer limit');
      const verifiedKycDailyTransferLimit = parseNonNegativeNumber(form.verifiedKycDailyTransferLimit, 'Verified KYC daily transfer limit');
      const premiumKycDailyTransferLimit = parseNonNegativeNumber(form.premiumKycDailyTransferLimit, 'Premium KYC daily transfer limit');
      const cashInCommissionPercent = parseNonNegativeNumber(form.cashInCommissionPercent, 'Cash-in commission');
      const cashOutCommissionPercent = parseNonNegativeNumber(form.cashOutCommissionPercent, 'Cash-out commission');
      const billPaymentCommissionPercent = parseNonNegativeNumber(form.billPaymentCommissionPercent, 'Bill payment commission');
      const registrationBonusAmount = parseNonNegativeNumber(form.registrationBonusAmount, 'Registration bonus');

      if (verifiedKycDailyTransferLimit < basicKycDailyTransferLimit) {
        toast.error('Verified KYC daily transfer limit cannot be lower than the basic KYC limit.');
        return;
      }

      if (premiumKycDailyTransferLimit < verifiedKycDailyTransferLimit) {
        toast.error('Premium KYC daily transfer limit cannot be lower than the verified KYC limit.');
        return;
      }

      if (cashInCommissionPercent > 100 || cashOutCommissionPercent > 100 || billPaymentCommissionPercent > 100) {
        toast.error('Commission percentages must be between 0 and 100.');
        return;
      }

      setSaving(true);
      setError('');

      const response = await updateAdminAgentOperationSettings({
        maxSingleTransactionAmount,
        basicKycDailyTransferLimit,
        verifiedKycDailyTransferLimit,
        premiumKycDailyTransferLimit,
        cashInCommissionRate: cashInCommissionPercent / 100,
        cashOutCommissionRate: cashOutCommissionPercent / 100,
        billPaymentCommissionRate: billPaymentCommissionPercent / 100,
        registrationBonusAmount,
      });

      setSettings(response);
      setForm(toFormState(response));
      toast.success('Agent operation settings updated.');
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : getApiErrorMessage(err, 'Unable to save agent operation settings.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Agent Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control the agent limits, daily transfer caps, and commission rules enforced by the backend.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading || !form ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading agent operation settings...</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assisted Transaction Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  field: 'maxSingleTransactionAmount',
                  label: 'Max single assisted transaction (NGN)',
                  hint: 'Applies to amount-based assisted transactions before execution.',
                },
                {
                  field: 'basicKycDailyTransferLimit',
                  label: 'Basic KYC daily assisted transfer limit (NGN)',
                  hint: 'The maximum total assisted transfer amount for customers on basic KYC.',
                },
                {
                  field: 'verifiedKycDailyTransferLimit',
                  label: 'Verified KYC daily assisted transfer limit (NGN)',
                  hint: 'Must be equal to or higher than the basic KYC limit.',
                },
                {
                  field: 'premiumKycDailyTransferLimit',
                  label: 'Premium KYC daily assisted transfer limit (NGN)',
                  hint: 'Must be equal to or higher than the verified KYC limit.',
                },
              ].map(item => (
                <div key={item.field} className="space-y-2">
                  <Label htmlFor={item.field}>{item.label}</Label>
                  <Input
                    id={item.field}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form[item.field as keyof SettingsFormState]}
                    onChange={event => handleChange(item.field as keyof SettingsFormState, event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Commission and Bonus Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  field: 'cashInCommissionPercent',
                  label: 'Cash-in commission (%)',
                  hint: 'Enter a percentage. Example: 0.5 means 0.5% of the assisted cash-in amount.',
                },
                {
                  field: 'cashOutCommissionPercent',
                  label: 'Cash-out commission (%)',
                  hint: 'Enter a percentage. Example: 1 means 1% of the assisted cash-out amount.',
                },
                {
                  field: 'billPaymentCommissionPercent',
                  label: 'Bill payment commission (%)',
                  hint: 'Enter a percentage applied to assisted bill payments.',
                },
                {
                  field: 'registrationBonusAmount',
                  label: 'Customer registration bonus (NGN)',
                  hint: 'Flat reward credited to the agent commission balance after successful assisted registration.',
                },
              ].map(item => (
                <div key={item.field} className="space-y-2">
                  <Label htmlFor={item.field}>{item.label}</Label>
                  <Input
                    id={item.field}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form[item.field as keyof SettingsFormState]}
                    onChange={event => handleChange(item.field as keyof SettingsFormState, event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Effective Values</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Last updated: {dateTimeFormatter.format(new Date(settings.updatedAtUtc))}</p>
              <p>Max single assisted transaction: {currency.format(settings.maxSingleTransactionAmount)}</p>
              <p>Basic daily assisted transfer limit: {currency.format(settings.basicKycDailyTransferLimit)}</p>
              <p>Verified daily assisted transfer limit: {currency.format(settings.verifiedKycDailyTransferLimit)}</p>
              <p>Premium daily assisted transfer limit: {currency.format(settings.premiumKycDailyTransferLimit)}</p>
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
