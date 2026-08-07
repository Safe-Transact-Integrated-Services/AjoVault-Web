import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Share2,
  Settings2,
  Gift,
  CheckCircle2,
  Building,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { getApiErrorMessage } from '@/lib/api/http';
import { shareLink } from '@/lib/share';
import { getFundraiser, fundraisingKeys, type FundraiserDetail as FundraiserDetailType } from '@/services/fundraisingApi';
import { formatCurrency, formatDate } from '@/services/mockData';
import { formatCampaignCategoryLabel, getCampaignTypeDetailItems } from './campaignTypes';

const categoryMarks: Record<string, string> = {
  event: 'EV',
  project: 'PR',
  emergency: 'EM',
  community: 'CO',
  education: 'ED',
  health: 'HL',
};

const categoryColors: Record<string, string> = {
  event: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  project: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  emergency: 'bg-red-500/10 text-red-600 border-red-500/20',
  community: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  education: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  health: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const sampleDetails: Record<string, FundraiserDetailType> = {
  'sample-1': {
    id: 'sample-1',
    title: 'Support Bethesda Home & School for the Blind',
    description: 'Help us provide tuition, learning equipment, housing, and medical care for 120 visually impaired students.',
    story: `Bethesda Home and School for the Blind is a dedicated boarding facility providing free education, rehabilitation, and vocational training for visually impaired children and young adults in Nigeria.

Many of our students come from underprivileged backgrounds and depend entirely on public goodwill for their daily meals, braille books, assistive devices, and medical checkups.

Through this campaign, we aim to cover school fees, adaptive laptops, braille paper, specialized instructional materials, and hostel renovation for the upcoming academic year. Every contribution brings light and independence to a child's educational journey.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1200',
    category: 'education',
    targetAmount: 10000000,
    raisedAmount: 4072356.67,
    currency: 'NGN',
    deadline: new Date(Date.now() + 210 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isPublic: true,
    creatorName: 'Bethesda home & school for the blind',
    donorCount: 142,
    shareCode: 'BETHESDA',
    progressPercent: 40.7,
    canManage: false,
    createdAt: new Date().toISOString(),
    typeDetails: { institutionName: 'Bethesda School for the Blind', educationLevel: 'Primary & Vocational' },
    canDonateWithWallet: true,
    canDonateWithPaystack: true,
    beneficiaryVerified: true,
    withdrawnAmount: 1200000,
    recentDonors: [
      { id: 'd1', name: 'Adefemi Williams', amount: 50000, date: new Date(Date.now() - 3600000 * 4).toISOString(), isAnonymous: false, fundingSource: 'Wallet' },
      { id: 'd2', name: 'Anonymous Supporter', amount: 100000, date: new Date(Date.now() - 3600000 * 24).toISOString(), isAnonymous: true, fundingSource: 'Paystack' },
      { id: 'd3', name: 'Dr. Chioma Nwachukwu', amount: 25000, date: new Date(Date.now() - 3600000 * 48).toISOString(), isAnonymous: false, fundingSource: 'Paystack' },
    ],
    recentUpdates: [
      { id: 'u1', title: 'First Batch of Braille Textbooks Delivered!', message: 'Thanks to early donors, we purchased 45 braille textbooks for our primary 5 students.', createdAtUtc: new Date(Date.now() - 86400000 * 3).toISOString() },
    ],
  },
};

const FundraiserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'story' | 'sponsor' | 'updates' | 'donors'>('story');
  const [quickAmount, setQuickAmount] = useState('10000');

  const fundraiserQuery = useQuery({
    queryKey: id ? fundraisingKeys.detail(id) : fundraisingKeys.detail('missing'),
    queryFn: () => getFundraiser(id!),
    enabled: !!id && !id.startsWith('sample-'),
  });

  const sampleFundraiser = id && id.startsWith('sample-') ? sampleDetails[id] : null;
  const fundraiser = sampleFundraiser || fundraiserQuery.data;
  const typeDetailItems = fundraiser ? getCampaignTypeDetailItems(fundraiser.category, fundraiser.typeDetails) : [];

  if (fundraiserQuery.isLoading && !sampleFundraiser) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading campaign details...
      </div>
    );
  }

  if (!fundraiser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-muted-foreground">
        <p className="font-semibold text-foreground">Campaign Not Found</p>
        <p className="mt-1 text-sm">{getApiErrorMessage(fundraiserQuery.error, 'This fundraiser may have ended or does not exist.')}</p>
        <Button size="sm" onClick={() => navigate('/fundraising')} className="mt-4">
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const handleShare = async () => {
    const link = `${window.location.origin}/fundraising/donate/${fundraiser.shareCode}`;

    try {
      const result = await shareLink({
        title: fundraiser.title,
        text: `Support ${fundraiser.title} on AjoVault`,
        url: link,
      });

      if (result === 'copied') {
        toast.success('Share link copied to clipboard.');
      }
    } catch {
      toast.error('Unable to share this campaign right now.');
    }
  };

  const handleQuickDonate = () => {
    navigate(`/fundraising/${fundraiser.id}/donate`);
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-top">
      {/* Top Header Bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/fundraising')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Campaigns
          </button>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            {fundraiser.canManage && (
              <Button size="sm" onClick={() => navigate(`/fundraising/${fundraiser.id}/manage`)} className="gap-1.5 text-xs">
                <Settings2 className="h-3.5 w-3.5" /> Manage
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main Grid Section (Donate.ng Split Screen Visual Style) */}
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Image & Campaign Title Header */}
          <div className="lg:col-span-7">
            {/* Cover Image */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-md">
              {fundraiser.coverImageUrl ? (
                <img
                  src={fundraiser.coverImageUrl}
                  alt={fundraiser.title}
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-[#102A56] to-slate-800 text-white">
                  <Heart className="h-16 w-16 opacity-30" />
                </div>
              )}
              <Badge
                variant="secondary"
                className={`absolute left-4 top-4 border text-xs font-semibold ${
                  categoryColors[fundraiser.category] || 'bg-card text-foreground'
                }`}
              >
                {formatCampaignCategoryLabel(fundraiser.category)}
              </Badge>
            </div>

            {/* Campaign Header Info */}
            <div className="mt-6">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl leading-tight">
                {fundraiser.title}
              </h1>

              {/* Sponsor Row (AjoVault Brand Colors) */}
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#102A56] text-white font-bold text-sm shadow-sm">
                  {categoryMarks[fundraiser.category] ?? 'FR'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-[#102A56]/10 text-[#102A56] dark:bg-blue-500/10 dark:text-blue-400 border border-blue-400/30 text-[10px] font-semibold">
                      Campaign Sponsor
                    </Badge>
                    {fundraiser.beneficiaryVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#3B82F6]">
                        <BadgeCheck className="h-3.5 w-3.5 fill-blue-500/20" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-foreground text-sm mt-0.5">{fundraiser.creatorName}</p>
                </div>
              </div>
            </div>

            {/* Tabbed Content Navigation */}
            <div className="mt-8 border-b border-border">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('story')}
                  className={`pb-3 text-sm font-bold transition-all relative ${
                    activeTab === 'story'
                      ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  About the campaign
                </button>
                <button
                  onClick={() => setActiveTab('sponsor')}
                  className={`pb-3 text-sm font-bold transition-all relative ${
                    activeTab === 'sponsor'
                      ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Campaign Sponsor
                </button>
                <button
                  onClick={() => setActiveTab('updates')}
                  className={`pb-3 text-sm font-bold transition-all relative ${
                    activeTab === 'updates'
                      ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Updates ({fundraiser.recentUpdates.length})
                </button>
                <button
                  onClick={() => setActiveTab('donors')}
                  className={`pb-3 text-sm font-bold transition-all relative ${
                    activeTab === 'donors'
                      ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Donors ({fundraiser.donorCount})
                </button>
              </div>
            </div>

            {/* Tab Content Display */}
            <div className="mt-6">
              <AnimatePresence mode="wait">
                {activeTab === 'story' && (
                  <motion.div
                    key="story"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {fundraiser.story || fundraiser.description || 'No detailed story provided for this campaign.'}
                    </div>

                    {typeDetailItems.length > 0 && (
                      <div className="mt-6 rounded-xl border border-border bg-card p-5">
                        <h3 className="font-semibold text-foreground text-sm mb-3">Key Details</h3>
                        <div className="grid gap-2 text-xs sm:grid-cols-2">
                          {typeDetailItems.map(item => (
                            <div key={item.key} className="flex justify-between rounded-lg bg-muted/40 p-2.5">
                              <span className="text-muted-foreground">{item.label}:</span>
                              <span className="font-medium text-foreground">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'sponsor' && (
                  <motion.div
                    key="sponsor"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-border bg-card p-6 space-y-4 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#102A56] text-white font-bold text-base">
                        {categoryMarks[fundraiser.category] ?? 'FR'}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{fundraiser.creatorName}</p>
                        <p className="text-xs text-muted-foreground">Organizer & Campaign Leader</p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Verification Status</span>
                        <span className="font-semibold text-[#3B82F6]">
                          {fundraiser.beneficiaryVerified ? 'Verified Account' : 'Pending Verification'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Share Code</span>
                        <span className="font-mono font-medium text-foreground">{fundraiser.shareCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campaign Visibility</span>
                        <span className="font-medium text-foreground">{fundraiser.isPublic ? 'Public' : 'Members Only'}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'updates' && (
                  <motion.div
                    key="updates"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {fundraiser.recentUpdates.length === 0 && (
                      <EmptyTableState
                        title="No campaign updates yet"
                        description="Updates from the organizer will appear here as the campaign progresses."
                      />
                    )}
                    {fundraiser.recentUpdates.map(update => (
                      <div key={update.id} className="rounded-xl border border-border bg-card p-4">
                        <p className="font-semibold text-foreground text-sm">{update.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{update.message}</p>
                        <p className="mt-2 text-[11px] text-muted-foreground">{formatDate(update.createdAtUtc)}</p>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'donors' && (
                  <motion.div
                    key="donors"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {fundraiser.recentDonors.length === 0 && (
                      <EmptyTableState
                        title="No donations yet"
                        description="Share the campaign link to get the first supporter."
                      />
                    )}
                    {fundraiser.recentDonors.map(donor => (
                      <div key={donor.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-[#3B82F6] font-bold text-xs">
                            <Heart className="h-4 w-4 fill-blue-500/20" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{donor.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatDate(donor.date)}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#3B82F6] dark:text-blue-400">
                          {formatCurrency(donor.amount)}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Quick Donation Box (AjoVault Brand Styling) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border-2 border-[#102A56]/20 bg-card p-6 shadow-xl space-y-6">
              {/* Header Box */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-bold text-base">
                  <Gift className="h-5 w-5 text-[#3B82F6]" />
                  <span>Donate</span>
                </div>
                <Badge variant="secondary" className="bg-[#102A56]/10 text-[#102A56] dark:bg-blue-500/10 dark:text-blue-300 border border-blue-400/30 text-xs font-semibold">
                  100% Secure
                </Badge>
              </div>

              {/* Progress Summary */}
              <div className="rounded-xl bg-muted/40 p-4 border border-border/50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Raised so far</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(fundraiser.raisedAmount)} / {formatCurrency(fundraiser.targetAmount)}
                  </span>
                </div>
                <Progress value={Math.min(100, Math.round(fundraiser.progressPercent))} className="h-2.5 bg-muted" />
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span className="font-semibold text-[#3B82F6] dark:text-blue-400">
                    {Math.round(fundraiser.progressPercent)}% funded
                  </span>
                  <span>{fundraiser.donorCount} Supporters</span>
                </div>
              </div>

              {/* Amount Quick Select */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-foreground">Select Amount (NGN)</p>
                <div className="grid grid-cols-4 gap-2">
                  {['5000', '10000', '25000', '50000'].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setQuickAmount(preset)}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                        quickAmount === preset
                          ? 'border-[#102A56] bg-[#102A56] text-white'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {formatCurrency(Number(preset))}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    type="number"
                    value={quickAmount}
                    onChange={e => setQuickAmount(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Enter custom amount"
                    className="h-11 rounded-xl text-sm"
                  />
                  <Button
                    onClick={handleQuickDonate}
                    className="h-11 px-6 bg-[#102A56] hover:bg-[#15366f] text-white font-bold rounded-xl shrink-0 shadow-md"
                  >
                    Donate Now
                  </Button>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-center text-muted-foreground leading-snug">
                By making a donation, you are consenting to our transparent platform terms & direct beneficiary payout security.
              </p>

              {/* Campaign Trust Badges */}
              <div className="border-t border-border pt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-[#102A56] dark:text-blue-400" />
                  <span>Encrypted</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                  <span>Instant Payout</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <BadgeCheck className="h-4 w-4 text-indigo-500" />
                  <span>Verified Cause</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundraiserDetail;
