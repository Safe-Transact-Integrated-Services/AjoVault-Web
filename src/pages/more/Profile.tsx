import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { creditPassportKeys, getCreditPassportScore } from '@/services/creditPassportApi';

const kycLabels = { none: 'Not Verified', basic: 'Basic', verified: 'Verified', premium: 'Premium' };
const kycColors = { none: 'bg-destructive/10 text-destructive', basic: 'bg-warning/10 text-warning', verified: 'bg-success/10 text-success', premium: 'bg-accent/10 text-accent' };

const Profile = () => {
  const { user, isInitializing } = useAuth();
  const creditPassportQuery = useQuery({
    queryKey: creditPassportKeys.score,
    queryFn: getCreditPassportScore,
    enabled: !!user,
  });

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

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {initials}
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">{user.firstName} {user.lastName}</h1>
        <p className="text-sm text-muted-foreground">{user.phone || 'Phone number not set'}</p>
        <Badge className={`mt-2 ${kycColors[user.kycTier]}`}>{kycLabels[user.kycTier]}</Badge>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <span className="font-display font-bold text-foreground">Credit Passport</span>
        </div>
        <p className="text-4xl font-bold text-accent">{score}</p>
        <p className="mt-1 text-xs text-muted-foreground">Live score from the backend credit passport service</p>
        <div className="mt-3 overflow-hidden rounded-full bg-muted">
          <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min((score / 850) * 100, 100)}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>300</span>
          <span>850</span>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        {[
          ['Full Name', `${user.firstName} ${user.lastName}`.trim()],
          ['Phone', user.phone || 'Not set'],
          ['Email', user.email || 'Not set'],
          ['KYC Tier', kycLabels[user.kycTier]],
          ['Member Since', new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
