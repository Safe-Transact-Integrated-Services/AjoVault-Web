import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Shield, Star, TrendingUp, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { creditPassportKeys, getCreditPassportScore, getCreditPassportUnlocks } from '@/services/creditPassportApi';

const tiers = [
  { name: 'Bronze', min: 0, max: 399, color: 'text-orange-700 bg-orange-100' },
  { name: 'Silver', min: 400, max: 599, color: 'text-muted-foreground bg-muted' },
  { name: 'Gold', min: 600, max: 799, color: 'text-yellow-600 bg-yellow-50' },
  { name: 'Platinum', min: 800, max: 1000, color: 'text-primary bg-primary/10' },
];

const CreditPassport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scoreQuery = useQuery({
    queryKey: creditPassportKeys.score,
    queryFn: getCreditPassportScore,
    enabled: !!user,
  });
  const unlocksQuery = useQuery({
    queryKey: creditPassportKeys.unlocks,
    queryFn: getCreditPassportUnlocks,
    enabled: !!user,
  });

  const score = scoreQuery.data?.score ?? user?.creditScore ?? 0;
  const currentTier = tiers.find(tier => score >= tier.min && score <= tier.max) || tiers[0];
  const scorePercent = (score / 1000) * 100;

  return (
    <div className="min-h-screen space-y-6 px-5 py-6">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="text-center">
        <h1 className="font-display text-xl font-bold">Credit Passport</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your community credit identity</p>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
        <div className="relative h-48 w-48">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${scorePercent * 5.34} 534`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-extrabold text-foreground">{score}</span>
            <span className={cn('mt-1 rounded-full px-3 py-0.5 text-xs font-semibold', currentTier.color)}>
              {currentTier.name}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Score range: 0 - 1,000</p>
      </motion.div>

      <div className="flex justify-between px-2">
        {tiers.map(tier => (
          <div key={tier.name} className="flex flex-col items-center gap-1">
            <div className={cn('h-2 w-2 rounded-full', score >= tier.min ? 'bg-accent' : 'bg-muted')} />
            <span className="text-[10px] font-medium text-muted-foreground">{tier.name}</span>
          </div>
        ))}
      </div>

      <Card className="space-y-4 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-accent" /> Weighted Factors
        </h3>
        {(scoreQuery.data?.breakdown ?? []).map(item => (
          <div key={item.factor} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{item.factor}</span>
              <span className="font-semibold">{item.weightPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.weightPercent}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full rounded-full bg-accent"
              />
            </div>
          </div>
        ))}
        {scoreQuery.isLoading && <p className="text-xs text-muted-foreground">Loading score breakdown...</p>}
      </Card>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Star className="h-4 w-4 text-warning" /> Benefits and Unlocks
        </h3>
        <Card className="divide-y divide-border">
          {(unlocksQuery.data?.unlocks ?? []).map(unlock => (
            <div key={unlock} className="flex items-center gap-3 p-3">
              <Unlock className="h-4 w-4 shrink-0 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium">{unlock}</p>
                <p className="text-xs text-muted-foreground">Unlocked at your current score</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
          {unlocksQuery.isLoading && (
            <div className="flex items-center gap-3 p-3">
              <p className="text-sm text-muted-foreground">Loading unlocked benefits...</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CreditPassport;
