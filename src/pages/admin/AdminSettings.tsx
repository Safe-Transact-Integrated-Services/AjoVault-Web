import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AdminSettings = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Platform configuration</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Transaction Limits</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            ['Daily Transfer Limit (Basic KYC)', '50000'],
            ['Daily Transfer Limit (Verified KYC)', '500000'],
            ['Daily Transfer Limit (Premium KYC)', '5000000'],
            ['Max Single Transaction', '1000000'],
          ].map(([label, defaultVal]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <Label className="text-sm text-foreground flex-1">{label}</Label>
              <Input type="number" defaultValue={defaultVal} className="w-32 text-right" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Platform Features</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            ['User Registrations', true],
            ['Agent Onboarding', true],
            ['USSD Channel', true],
            ['Savings Module', true],
            ['Circles (Ajo) Module', true],
            ['Credit Passport™', false],
            ['Cooperative Module', false],
          ].map(([label, defaultOn]) => (
            <div key={label as string} className="flex items-center justify-between">
              <Label className="text-sm text-foreground">{label as string}</Label>
              <Switch defaultChecked={defaultOn as boolean} onCheckedChange={() => toast.success(`${label} toggled`)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Agent Commission Rates (%)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            ['Cash In', '0.5'],
            ['Cash Out', '1.0'],
            ['Bill Payment', '2.0'],
            ['Registration Bonus (₦)', '100'],
          ].map(([label, defaultVal]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <Label className="text-sm text-foreground flex-1">{label}</Label>
              <Input type="number" step="0.1" defaultValue={defaultVal} className="w-24 text-right" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={() => toast.success('Settings saved')} className="w-full sm:w-auto">Save Changes</Button>
    </div>
  );
};

export default AdminSettings;
