import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { getApiErrorMessage } from '@/lib/api/http';
import { getFundraisers, fundraisingKeys } from '@/services/fundraisingApi';
import { formatCurrency } from '@/services/mockData';

const categoryColors: Record<string, string> = {
  event: 'bg-warning/10 text-warning',
  project: 'bg-accent/10 text-accent',
  emergency: 'bg-destructive/10 text-destructive',
  community: 'bg-success/10 text-success',
  education: 'bg-primary/10 text-primary',
  health: 'bg-destructive/10 text-destructive',
};

const categoryMarks: Record<string, string> = {
  event: 'EV',
  project: 'PR',
  emergency: 'EM',
  community: 'CO',
  education: 'ED',
  health: 'HL',
};

const FundraisingHome = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const fundraisingQuery = useQuery({
    queryKey: fundraisingKeys.list,
    queryFn: getFundraisers,
  });

  const campaigns = fundraisingQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return campaigns;
    }

    return campaigns.filter(campaign =>
      campaign.title.toLowerCase().includes(term)
      || campaign.creatorName.toLowerCase().includes(term)
      || campaign.category.toLowerCase().includes(term),
    );
  }, [campaigns, search]);

  return (
    <div className="px-4 py-6 safe-top">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Fundraising</h1>
        <Button size="sm" onClick={() => navigate('/fundraising/create')} className="gap-1">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search campaigns..."
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="h-11 pl-10"
        />
      </div>

      <div className="space-y-3">
        {fundraisingQuery.isLoading && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading campaigns...
          </div>
        )}

        {fundraisingQuery.isError && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {getApiErrorMessage(fundraisingQuery.error, 'Unable to load fundraising campaigns.')}
          </div>
        )}

        {!fundraisingQuery.isLoading && !fundraisingQuery.isError && filtered.length === 0 && (
          <EmptyTableState
            title={campaigns.length === 0 ? 'No fundraising campaigns yet' : 'No campaigns matched your search'}
            description={
              campaigns.length === 0
                ? 'Create a campaign and share it to start receiving support.'
                : 'Try another search term to widen the campaign results.'
            }
          />
        )}

        {filtered.map((campaign, index) => (
          <motion.button
            key={campaign.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => navigate(`/fundraising/${campaign.id}`)}
            className="w-full rounded-xl border border-border bg-card p-4 text-left"
          >
            {campaign.coverImageUrl ? (
              <div className="mb-3 overflow-hidden rounded-xl border border-border">
                <img
                  src={campaign.coverImageUrl}
                  alt={campaign.title}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : null}

            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {categoryMarks[campaign.category] ?? 'FR'}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{campaign.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {campaign.creatorName} / {campaign.donorCount} donors
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={categoryColors[campaign.category] || 'bg-muted text-muted-foreground'}
              >
                {campaign.category}
              </Badge>
            </div>

            <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
              {campaign.description || 'Share this campaign and start receiving support.'}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(campaign.raisedAmount)}</span>
                <span className="font-medium text-foreground">{formatCurrency(campaign.targetAmount)}</span>
              </div>
              <Progress value={Math.round(campaign.progressPercent)} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(campaign.progressPercent)}% funded</span>
                <span>{campaign.isPublic ? 'Public' : 'Members only'}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FundraisingHome;
