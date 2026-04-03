import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoaderCircle, TrendingUp, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { creditPassportKeys, getCreditPassportScore } from '@/services/creditPassportApi';
import { getApiErrorMessage } from '@/lib/api/http';

const kycLabels = { none: 'Not Verified', basic: 'Basic', verified: 'Verified', premium: 'Premium' };
const kycColors = { none: 'bg-destructive/10 text-destructive', basic: 'bg-warning/10 text-warning', verified: 'bg-success/10 text-success', premium: 'bg-accent/10 text-accent' };

const Profile = () => {
  const { user, isInitializing, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const creditPassportQuery = useQuery({
    queryKey: creditPassportKeys.score,
    queryFn: getCreditPassportScore,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
    setError('');
  }, [user]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.trim() || 'A';
  const score = creditPassportQuery.data?.score ?? user.creditScore;
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const trimmedPhone = phone.trim();
  const hasChanges = trimmedFirstName !== user.firstName || trimmedLastName !== user.lastName || trimmedPhone !== user.phone;
  const canSave = trimmedFirstName.length > 0 && trimmedLastName.length > 0 && !isSaving && hasChanges;

  const handleSave = async () => {
    if (!trimmedFirstName || !trimmedLastName) {
      setError('First name and last name are required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await updateProfile({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phone: trimmedPhone,
      });
      toast('Profile updated successfully.');
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Unable to update profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 px-4 py-6 safe-top">
      <div className="flex flex-col items-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {initials}
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">{user.firstName} {user.lastName}</h1>
        <p className="text-sm text-muted-foreground">{user.phone || user.email || 'No primary contact yet'}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Badge className={kycColors[user.kycTier]}>{kycLabels[user.kycTier]}</Badge>
          <Badge variant="outline" className={user.isActive ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive'}>
            {user.isActive ? 'Active account' : 'Inactive account'}
          </Badge>
        </div>
      </div>

      <Card className="p-5 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <span className="font-display font-bold text-foreground">Credit Passport</span>
        </div>
        <p className="text-4xl font-bold text-accent">{score}</p>
        <p className="mt-1 text-xs text-muted-foreground">Live score from the backend credit passport service</p>
        <div className="mt-3 overflow-hidden rounded-full bg-muted">
          <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min((score / 1000) * 100, 100)}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0</span>
          <span>1000</span>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-foreground">Profile details</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-first-name">First name</Label>
            <Input
              id="profile-first-name"
              value={firstName}
              onChange={event => {
                setFirstName(event.target.value);
                setError('');
              }}
              placeholder="First name"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-last-name">Last name</Label>
            <Input
              id="profile-last-name"
              value={lastName}
              onChange={event => {
                setLastName(event.target.value);
                setError('');
              }}
              placeholder="Last name"
              className="h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-phone">Phone number</Label>
          <Input
            id="profile-phone"
            value={phone}
            onChange={event => {
              setPhone(event.target.value);
              setError('');
            }}
            placeholder="08000000000"
            type="tel"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            value={user.email ?? 'No email on this account'}
            readOnly
            disabled
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed from this screen yet.</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSave} disabled={!canSave} className="h-12 w-full">
          {isSaving ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </Card>

      <Card className="space-y-3 p-4">
        {[
          ['Role', user.role],
          ['Member Since', new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })],
          ['Last Login', user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-NG') : 'No login activity yet'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium text-foreground">{value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default Profile;
