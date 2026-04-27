import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, LifeBuoy, LoaderCircle, Lock, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { dashboardKeys } from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { notificationKeys } from '@/services/notificationsApi';
import { getMySettings, settingsKeys, updateMySettings, type NotificationSettings } from '@/services/settingsApi';

type NotificationToggleKey =
  | 'pushEnabled'
  | 'smsEnabled'
  | 'emailEnabled'
  | 'savingsEnabled'
  | 'circleEnabled'
  | 'groupGoalEnabled';

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: settingsKeys.me,
    queryFn: getMySettings,
  });

  const [form, setForm] = useState<NotificationSettings | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(settingsQuery.data);
      setError('');
    }
  }, [settingsQuery.data]);

  const hasChanges = useMemo(() => {
    if (!form || !settingsQuery.data) {
      return false;
    }

    return (
      form.pushEnabled !== settingsQuery.data.pushEnabled
      || form.smsEnabled !== settingsQuery.data.smsEnabled
      || form.emailEnabled !== settingsQuery.data.emailEnabled
      || form.savingsEnabled !== settingsQuery.data.savingsEnabled
      || form.circleEnabled !== settingsQuery.data.circleEnabled
      || form.groupGoalEnabled !== settingsQuery.data.groupGoalEnabled
    );
  }, [form, settingsQuery.data]);

  const updateToggle = (key: NotificationToggleKey, value: boolean) => {
    setForm(current => current ? { ...current, [key]: value } : current);
    setError('');
  };

  const handleSave = async () => {
    if (!form) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const next = await updateMySettings({
        pushEnabled: form.pushEnabled,
        smsEnabled: form.smsEnabled,
        emailEnabled: form.emailEnabled,
        savingsEnabled: form.savingsEnabled,
        circleEnabled: form.circleEnabled,
        groupGoalEnabled: form.groupGoalEnabled,
      });

      setForm(next);
      toast.success('Settings saved.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.me }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.feed }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Unable to save settings.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your notification and activity alert preferences.</p>
      </div>

      {settingsQuery.isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading settings...
        </div>
      )}

      {form && (
        <>
          <Card className="space-y-1 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" />
              <h2 className="font-semibold text-foreground">Delivery preferences</h2>
            </div>
            {[
              ['pushEnabled', 'Push notifications', 'Receive app alerts when activity happens.'],
              ['smsEnabled', 'SMS alerts', 'Use SMS for important account and transaction updates.'],
              ['emailEnabled', 'Email updates', 'Receive summaries and service updates by email.'],
            ].map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-card py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={form[key as NotificationToggleKey]} onCheckedChange={value => updateToggle(key as NotificationToggleKey, value)} />
              </div>
            ))}
          </Card>

          <Card className="space-y-1 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" />
              <h2 className="font-semibold text-foreground">Activity alerts</h2>
            </div>
            {[
              ['savingsEnabled', 'Savings alerts', 'Plan creation, contributions, and goal completion.'],
              ['circleEnabled', 'Circle alerts', 'Joins, contributions, and payouts in your circles.'],
              ['groupGoalEnabled', 'Group goal alerts', 'Member joins, contributions, and goal completion.'],
            ].map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-card py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={form[key as NotificationToggleKey]} onCheckedChange={value => updateToggle(key as NotificationToggleKey, value)} />
              </div>
            ))}
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-accent" />
              <h2 className="font-semibold text-foreground">Help & Support</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Submit an issue, check your support request status, or read quick answers for wallet, savings, circles, and group goals.
            </p>
            <Button type="button" variant="outline" onClick={() => navigate('/more/help')} className="h-11 w-full">
              Open help centre
            </Button>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="h-12 w-full">
            {isSaving ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save settings
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default Settings;
