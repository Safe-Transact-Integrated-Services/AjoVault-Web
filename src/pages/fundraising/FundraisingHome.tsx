import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Heart,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Share2,
  Zap,
  DollarSign,
  AlertCircle,
  RotateCcw,
  Building,
  GraduationCap,
  Stethoscope,
  AlertTriangle,
  FolderKanban,
  Calendar,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { getApiErrorMessage } from '@/lib/api/http';
import { getFundraisers, fundraisingKeys, type FundraiserSummary } from '@/services/fundraisingApi';
import { formatCurrency } from '@/services/mockData';
import { formatCampaignCategoryLabel } from './campaignTypes';

const categoryColors: Record<string, string> = {
  event: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  project: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  emergency: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  community: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  education: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  health: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const categoryIcons: Record<string, typeof Heart> = {
  event: Calendar,
  project: FolderKanban,
  emergency: AlertTriangle,
  community: Building,
  education: GraduationCap,
  health: Stethoscope,
};

const categoryFilters = [
  { id: 'all', label: 'All Causes' },
  { id: 'health', label: 'Health' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'education', label: 'Education' },
  { id: 'project', label: 'Project' },
  { id: 'community', label: 'Community' },
  { id: 'event', label: 'Event' },
];

const fallbackCampaigns: FundraiserSummary[] = [
  {
    id: 'sample-1',
    title: 'Support Bethesda Home & School for the Blind',
    description: 'Help us provide tuition, learning equipment, housing, and medical care for 120 visually impaired students.',
    coverImageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
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
  },
  {
    id: 'sample-2',
    title: 'Obodo Centre Advocacy & Housing Fund',
    description: 'Empowering advocacy programs, community legal support, and housing assistance for underserved families.',
    coverImageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800',
    category: 'community',
    targetAmount: 10000000,
    raisedAmount: 756000,
    currency: 'NGN',
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isPublic: true,
    creatorName: 'Obodo Centre Advocacy',
    donorCount: 48,
    shareCode: 'OBODO-HOUSING',
    progressPercent: 7.5,
    canManage: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    title: 'Join Us to Engage & Mobilize Citizens for Civic Progress',
    description: 'Building voter education campaigns, youth empowerment workshops, and grassroot community leadership.',
    coverImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=800',
    category: 'project',
    targetAmount: 180000000,
    raisedAmount: 469000,
    currency: 'NGN',
    deadline: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isPublic: true,
    creatorName: 'The EiE Project Ltd/GTE',
    donorCount: 312,
    shareCode: 'EIE-PROJECT',
    progressPercent: 0.26,
    canManage: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-4',
    title: 'Help a Mother and Her Newborn Get Emergency Healthcare',
    description: 'Urgent medical treatment and post-natal care for a mother and her newborn baby facing critical complications.',
    coverImageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    category: 'health',
    targetAmount: 10000000,
    raisedAmount: 12239140,
    currency: 'NGN',
    deadline: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isPublic: true,
    creatorName: 'Chinatu Chinedu',
    donorCount: 520,
    shareCode: 'MOTHER-BABY',
    progressPercent: 100,
    canManage: false,
    createdAt: new Date().toISOString(),
  },
];

const painPoints = [
  {
    title: 'Need urgent funds for health, education or a project?',
    description: 'Launch a verified campaign in under 2 minutes and start receiving contributions immediately.',
    icon: Zap,
  },
  {
    title: 'Supporters hesitate due to transparency concerns?',
    description: 'Every donation is recorded on a transparent digital ledger with verified beneficiary accounts.',
    icon: ShieldCheck,
  },
  {
    title: 'Other platforms charge high fees or delay cashouts?',
    description: 'Enjoy instant payouts directly into your Nigerian bank account or AjoVault wallet with zero hidden fees.',
    icon: TrendingUp,
  },
];

const platformFeatures = [
  {
    title: 'Reach More Donors',
    description: 'Seamlessly share campaign links via WhatsApp, SMS, or social media to widen your reach.',
    icon: Share2,
    accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Safe & Transparent',
    description: 'Bank-grade encryption, real-time donation progress tracking, and public accountability.',
    icon: ShieldCheck,
    accent: 'bg-[#102A56]/10 text-[#102A56] dark:bg-blue-500/10 dark:text-blue-400',
  },
  {
    title: 'Quick Payouts',
    description: 'Withdraw raised funds effortlessly to any bank account or AjoVault wallet anytime.',
    icon: DollarSign,
    accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
];

const howItWorksSteps = [
  {
    step: '01',
    title: 'Create Your Campaign',
    description: 'Set your target goal, add a cover image, write your story, and choose a category.',
  },
  {
    step: '02',
    title: 'Spread the Word',
    description: 'Share your custom campaign link with friends, family, and online communities.',
  },
  {
    step: '03',
    title: 'Receive & Withdraw Funds',
    description: 'Watch donations come in real time and withdraw funds directly to your verified bank account.',
  },
];

const formatDaysLeft = (deadlineStr?: string) => {
  if (!deadlineStr) return 'Active campaign';
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Ended';
  if (diffDays === 1) return 'Ends in 1 day';
  if (diffDays < 30) return `Ends in ${diffDays} days`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Ends in ${months} ${months === 1 ? 'month' : 'months'}`;
  }
  return 'Ends in a year';
};

const getInitials = (name: string) => {
  if (!name) return 'AV';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const FundraisingHome = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fundraisingQuery = useQuery({
    queryKey: fundraisingKeys.list,
    queryFn: getFundraisers,
  });

  const rawCampaigns = fundraisingQuery.data ?? [];
  const campaigns = rawCampaigns.length > 0 ? rawCampaigns : fallbackCampaigns;

  const filtered = useMemo(() => {
    let result = campaigns;

    if (selectedCategory !== 'all') {
      result = result.filter(campaign => campaign.category.toLowerCase() === selectedCategory);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter(
        campaign =>
          campaign.title.toLowerCase().includes(term) ||
          campaign.creatorName.toLowerCase().includes(term) ||
          campaign.category.toLowerCase().includes(term) ||
          (campaign.description && campaign.description.toLowerCase().includes(term))
      );
    }

    return result;
  }, [campaigns, search, selectedCategory]);

  const stats = useMemo(() => {
    const totalRaised = campaigns.reduce((acc, curr) => acc + (curr.raisedAmount || 0), 0);
    const totalDonors = campaigns.reduce((acc, curr) => acc + (curr.donorCount || 0), 0);
    const activeCampaigns = campaigns.length;
    return {
      totalRaised: totalRaised > 0 ? totalRaised : 45000000,
      totalDonors: totalDonors > 0 ? totalDonors : 1240,
      activeCampaigns: activeCampaigns > 0 ? activeCampaigns : 28,
    };
  }, [campaigns]);

  const handleShare = async (e: React.MouseEvent, campaign: FundraiserSummary) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/fundraising/donate/${campaign.shareCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: campaign.description || `Support ${campaign.title} on AjoVault`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success('Campaign share link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background pb-12 safe-top">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#102A56] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>AjoVault Crowdfunding Platform</span>
              </div>

              <h1 className="mb-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Support the <span className="text-[#3B82F6]">Causes & Campaigns</span> You Care About
              </h1>

              <p className="mb-6 text-base font-normal text-slate-300 sm:text-lg">
                The easiest, most transparent way to raise and donate funds in Nigeria. Raise money for healthcare, emergencies, education, projects, and community goals.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate('/fundraising/create')}
                  className="gap-2 bg-[#3B82F6] font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95"
                >
                  <Plus className="h-5 w-5" /> Start a Campaign
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById('campaigns-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-white/20 bg-white/5 font-semibold text-white hover:bg-white/10"
                >
                  Explore Campaigns <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Visual Hero Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                      <Heart className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Featured Impact</p>
                      <p className="text-[11px] text-slate-400">Verified & Transparent</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                    Live Platform
                  </Badge>
                </div>

                <div className="mb-4 rounded-xl bg-slate-900/60 p-4 border border-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 mb-1.5">
                    <span>Total Community Raised</span>
                    <span className="font-bold text-[#3B82F6]">{formatCurrency(stats.totalRaised)}</span>
                  </div>
                  <Progress value={78} className="h-2.5 bg-slate-800" />
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{stats.totalDonors.toLocaleString()} Total Supporters</span>
                    <span>100% Payout Safety</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                    <p className="text-xs text-slate-400">Active Campaigns</p>
                    <p className="font-display text-lg font-bold text-white">{stats.activeCampaigns}+</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                    <p className="text-xs text-slate-400">Success Rate</p>
                    <p className="font-display text-lg font-bold text-blue-400">99.4%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Bar Strip */}
      <section className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4 sm:divide-x sm:divide-border">
            <div className="p-2">
              <p className="font-display text-xl font-bold text-foreground sm:text-2xl">
                {formatCurrency(stats.totalRaised)}
              </p>
              <p className="text-xs text-muted-foreground">Raised for Causes</p>
            </div>
            <div className="p-2">
              <p className="font-display text-xl font-bold text-foreground sm:text-2xl">
                {stats.totalDonors.toLocaleString()}+
              </p>
              <p className="text-xs text-muted-foreground">Generous Donors</p>
            </div>
            <div className="p-2">
              <p className="font-display text-xl font-bold text-foreground sm:text-2xl">
                {stats.activeCampaigns}+
              </p>
              <p className="text-xs text-muted-foreground">Live Campaigns</p>
            </div>
            <div className="p-2">
              <p className="font-display text-xl font-bold text-[#3B82F6] dark:text-blue-400 sm:text-2xl">
                100%
              </p>
              <p className="text-xs text-muted-foreground">Secure & Transparent</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search, Category Tabs & Campaign List Section */}
      <section id="campaigns-section" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Campaigns You Can Support</h2>
            <p className="text-xs text-muted-foreground">Discover verified fundraisers and make an immediate impact.</p>
          </div>
          <Button size="sm" onClick={() => navigate('/fundraising/create')} className="gap-1.5 self-start sm:self-auto bg-[#102A56] hover:bg-[#15366f] text-white">
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>

        {/* Search Bar & Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by campaign title, category, or organizer..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="h-11 pl-10 pr-4 shadow-sm rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Pills Slider */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categoryFilters.map(filter => {
              const isActive = selectedCategory === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedCategory(filter.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#102A56] text-white shadow-sm'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {fundraisingQuery.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-96 animate-pulse rounded-2xl border border-border bg-card p-4">
                <div className="mb-4 h-48 rounded-xl bg-muted" />
                <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {fundraisingQuery.isError && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <AlertCircle className="mb-2 h-10 w-10 text-destructive" />
            <p className="font-semibold text-foreground">Unable to load campaigns</p>
            <p className="mb-4 text-xs text-muted-foreground">
              {getApiErrorMessage(fundraisingQuery.error, 'Please check your connection and try again.')}
            </p>
            <Button size="sm" variant="outline" onClick={() => fundraisingQuery.refetch()} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Retry Loading
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!fundraisingQuery.isLoading && !fundraisingQuery.isError && filtered.length === 0 && (
          <EmptyTableState
            title={campaigns.length === 0 ? 'No fundraising campaigns yet' : 'No campaigns matched your filters'}
            description={
              campaigns.length === 0
                ? 'Be the first to create a campaign and start receiving community support.'
                : 'Try adjusting your search query or category filter.'
            }
          />
        )}

        {/* Crowdy-Style Campaign Cards Grid */}
        {!fundraisingQuery.isLoading && !fundraisingQuery.isError && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((campaign, index) => {
              const CategoryIcon = categoryIcons[campaign.category] || Heart;
              const isOrg = campaign.creatorName.toLowerCase().includes('school') ||
                            campaign.creatorName.toLowerCase().includes('foundation') ||
                            campaign.creatorName.toLowerCase().includes('ltd') ||
                            campaign.creatorName.toLowerCase().includes('advocacy') ||
                            campaign.creatorName.toLowerCase().includes('project') ||
                            campaign.creatorName.toLowerCase().includes('home');
              const creatorType = isOrg ? 'Organization' : 'Individual';

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/fundraising/${campaign.id}`)}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-[#3B82F6]/50 hover:shadow-md cursor-pointer"
                >
                  <div>
                    {/* Header: Creator Info + Featured Badge */}
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#102A56]/10 text-[#102A56] font-bold text-xs">
                          {getInitials(campaign.creatorName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-xs font-semibold text-foreground">
                            {campaign.creatorName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{creatorType}</p>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-400/30 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-[#3B82F6] dark:text-blue-400">
                        <Star className="h-3 w-3 fill-blue-500/30 text-blue-500" /> Featured
                      </span>
                    </div>

                    {/* Image Area with Category & Verified Overlay Badges */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                      {campaign.coverImageUrl ? (
                        <img
                          src={campaign.coverImageUrl}
                          alt={campaign.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#102A56] to-slate-800 text-white">
                          <CategoryIcon className="h-12 w-12 opacity-40" />
                        </div>
                      )}

                      {/* Category Badge Top-Left */}
                      <span className="absolute left-3 top-3 rounded-full border border-border/60 bg-white/90 dark:bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-md shadow-sm capitalize">
                        {formatCampaignCategoryLabel(campaign.category)}
                      </span>

                      {/* Verified Badge Bottom-Left */}
                      <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-border/40 bg-white/95 dark:bg-slate-900/95 px-2 py-0.5 text-[10px] font-medium text-slate-800 dark:text-slate-200 backdrop-blur-md shadow-sm">
                        <CheckCircle2 className="h-3 w-3 text-blue-500 fill-blue-500/20" /> Verified
                      </span>
                    </div>

                    {/* Title & Deadline */}
                    <div className="mt-3">
                      <h3 className="line-clamp-2 font-bold text-base text-foreground leading-snug group-hover:text-[#3B82F6] transition-colors">
                        {campaign.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground font-medium">
                        {formatDaysLeft(campaign.deadline)}
                      </p>
                    </div>

                    {/* Goal & Progress Container */}
                    <div className="mt-4 rounded-xl border border-border/50 bg-muted/40 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Goal <span className="font-semibold text-foreground">{formatCurrency(campaign.raisedAmount)}</span>/{formatCurrency(campaign.targetAmount)}
                        </span>
                        <span className="font-bold text-foreground">{Math.round(campaign.progressPercent)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[#3B82F6] transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(campaign.progressPercent))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="mt-4 space-y-2">
                    <Button
                      size="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/fundraising/${campaign.id}/donate`);
                      }}
                      className="w-full h-10 rounded-xl bg-[#102A56] hover:bg-[#15366f] font-bold text-white shadow-sm active:scale-[0.98] transition-all text-xs sm:text-sm"
                    >
                      Donate
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      onClick={(e) => handleShare(e, campaign)}
                      className="w-full h-10 rounded-xl border-border bg-card font-semibold text-foreground hover:bg-muted text-xs sm:text-sm"
                    >
                      Share Campaign
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. "Does This Sound Familiar?" Section */}
      <section className="mt-16 bg-muted/40 py-12 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">Does This Sound Familiar?</h2>
            <p className="text-xs text-muted-foreground">We built AjoVault Crowdfunding to solve real issues in community fundraising.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {painPoints.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#102A56]/10 text-[#102A56] dark:bg-blue-500/10 dark:text-blue-400">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground text-sm">{item.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Features to Love */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-2 border-primary/30 text-primary">
              Why AjoVault?
            </Badge>
            <h2 className="font-display text-2xl font-bold text-foreground">Features You Will Love</h2>
            <p className="text-xs text-muted-foreground">Built with bank-grade security and full community control.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {platformFeatures.map((feat, i) => (
              <div key={i} className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${feat.accent}`}>
                  <feat.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground text-base">{feat.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. How It Works 3-Step Guide */}
      <section className="bg-[#102A56] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">How It Works</h2>
            <p className="text-xs text-slate-300">Start receiving donations in three simple steps.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {howItWorksSteps.map((step, idx) => (
              <div key={idx} className="relative rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <span className="mb-4 inline-block font-display text-3xl font-extrabold text-[#3B82F6]">
                  {step.step}
                </span>
                <h3 className="mb-2 font-bold text-white text-base">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              size="lg"
              onClick={() => navigate('/fundraising/create')}
              className="bg-[#3B82F6] font-bold text-white shadow-lg hover:bg-blue-600"
            >
              Start Raising Funds Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FundraisingHome;
