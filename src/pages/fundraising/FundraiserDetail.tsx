import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Users, Calendar, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockFundraisers } from '@/services/groupGoalsMockData';
import { formatCurrency, formatDate } from '@/services/mockData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const FundraiserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fund = mockFundraisers.find(f => f.id === id);

  if (!fund) return <div className="p-6 text-center text-muted-foreground">Campaign not found</div>;

  const pct = Math.round((fund.raisedAmount / fund.targetAmount) * 100);

  const handleShare = () => {
    const link = `${window.location.origin}/fundraising/donate/${fund.shareCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Share link copied! Anyone can donate with this link.');
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-24">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-6">
          <span className="text-5xl">{fund.image}</span>
          <h1 className="font-display text-2xl font-bold text-foreground mt-3">{fund.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">by {fund.creatorName}</p>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Raised</span>
            <span className="font-bold text-foreground">{formatCurrency(fund.raisedAmount)} / {formatCurrency(fund.targetAmount)}</span>
          </div>
          <Progress value={pct} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct}% funded · {fund.donorCount} donors</span>
            <span>Ends {formatDate(fund.deadline)}</span>
          </div>
        </div>

        {/* Story */}
        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <h2 className="font-display text-base font-bold text-foreground mb-2">Story</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{fund.story}</p>
        </div>

        {/* Recent Donors */}
        <div className="mb-6">
          <h2 className="font-display text-base font-bold text-foreground mb-3">Recent Donors</h2>
          <div className="space-y-2">
            {fund.recentDonors.map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.isAnonymous ? 'Anonymous' : d.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(d.date)}</p>
                </div>
                <p className="text-sm font-semibold text-success">{formatCurrency(d.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex gap-3">
        <Button className="flex-1 h-12 gap-1" onClick={() => navigate(`/fundraising/${fund.id}/donate`)}>
          <Heart className="h-4 w-4" /> Donate Now
        </Button>
        <Button variant="outline" className="h-12 gap-1" onClick={handleShare}>
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  );
};

export default FundraiserDetail;
