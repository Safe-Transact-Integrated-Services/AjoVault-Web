import { ArrowLeft, Lock, Bell, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

const Settings = () => {
  const navigate = useNavigate();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold mb-6">Settings</h1>

      {/* Security */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Security</h2>
        <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Change PIN</p>
            <p className="text-xs text-muted-foreground">Update your 4-digit security PIN</p>
          </div>
        </button>
      </div>

      {/* Notifications */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Notifications</h2>
        <div className="space-y-1">
          {[
            { label: 'Push Notifications', desc: 'Receive push alerts', checked: pushEnabled, onChange: setPushEnabled },
            { label: 'SMS Alerts', desc: 'Get SMS for transactions', checked: smsEnabled, onChange: setSmsEnabled },
            { label: 'Email Updates', desc: 'Weekly summary emails', checked: emailEnabled, onChange: setEmailEnabled },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} />
            </div>
          ))}
        </div>
      </div>

      {/* Support */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Support</h2>
        <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Help & Support</p>
            <p className="text-xs text-muted-foreground">FAQs, contact us, report an issue</p>
          </div>
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">AjoVault v1.0.0</p>
    </div>
  );
};

export default Settings;
