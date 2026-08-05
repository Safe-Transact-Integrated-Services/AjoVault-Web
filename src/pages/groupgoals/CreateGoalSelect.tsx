import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  PiggyBank,
  Target,
  Users,
  ArrowLeft,
  Copy,
  Share2,
  GraduationCap,
  Home,
  Monitor,
  Package,
  Car,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PlatformUserInvitePicker from '@/components/shared/PlatformUserInvitePicker';
import { createSavingsPlan, savingsKeys } from '@/services/savingsApi';
import { createGroupGoal, groupGoalsKeys, sendGroupGoalInvite, type GroupGoalCategory, type GroupGoalDetail } from '@/services/groupGoalsApi';
import { getMyWallet, walletKeys } from '@/services/walletApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency } from '@/services/mockData';
import type { PlatformUserSearchResult } from '@/services/platformUsersApi';
import { toast } from 'sonner';

type GoalType = 'personal' | 'group';
type PlanType = 'flexible' | 'locked' | 'goal';
type Step = 'form' | 'invite';

const planTypes = [
  { type: 'flexible' as const, label: 'Flexible Savings', desc: 'Save and withdraw anytime', icon: PiggyBank, rate: '8%' },
  { type: 'locked' as const, label: 'Locked Savings', desc: 'Higher returns with a longer commitment', icon: Lock, rate: '12%' },
  { type: 'goal' as const, label: 'Goal Savings', desc: 'Save steadily towards a target', icon: Target, rate: '10%' },
];

const personalFrequencies = ['daily', 'weekly', 'monthly'] as const;

const categories: { type: GroupGoalCategory; label: string; desc: string; icon: typeof Home }[] = [
  { type: 'property', label: 'Property', desc: 'Land, house, or building', icon: Home },
  { type: 'vehicle', label: 'Vehicle', desc: 'Car, bus, or motorcycle', icon: Car },
  { type: 'equipment', label: 'Equipment', desc: 'Office or business equipment', icon: Monitor },
  { type: 'education', label: 'Education', desc: 'School fees or training', icon: GraduationCap },
  { type: 'other', label: 'Other', desc: 'Any other shared goal', icon: Package },
];

const CreateGoalSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Detect initial type based on URL path or default to personal
  const path = location.pathname;
  const initialType: GoalType = path.includes('/savings/create') ? 'personal' : 'group';
  
  const [goalType, setGoalType] = useState<GoalType>(initialType);
  const [step, setStep] = useState<Step>('form');

  // Shared state fields
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [contribution, setContribution] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Personal Goal specific states
  const [planType, setPlanType] = useState<PlanType>('flexible');
  const [personalFrequency, setPersonalFrequency] = useState<typeof personalFrequencies[number]>('monthly');
  const [fundingSource, setFundingSource] = useState('wallet');

  // Group Goal specific states
  const [category, setCategory] = useState<GroupGoalCategory>('other');
  const [description, setDescription] = useState('');
  const [groupFrequency, setGroupFrequency] = useState<GroupGoalFrequency>('monthly');
  const [deadline, setDeadline] = useState('');
  const [createdGroupGoal, setCreatedGroupGoal] = useState<GroupGoalDetail | null>(null);

  // Wallet Query for Personal Savings
  const walletQuery = useQuery({
    queryKey: walletKeys.me,
    queryFn: getMyWallet,
    enabled: goalType === 'personal',
  });

  // Automatically update goal type if path changes
  useEffect(() => {
    if (path.includes('/savings/create')) {
      setGoalType('personal');
    } else if (path.includes('/group-goals/create') && !path.includes('/select')) {
      setGoalType('group');
    }
  }, [path]);

  const targetAmount = Number(target || '0');
  const contributionAmount = Number(contribution || '0');

  const handleCreatePersonalGoal = async () => {
    if (!name.trim()) {
      setError('Plan name is required.');
      return;
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setError('Target amount must be greater than zero.');
      return;
    }

    if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      setError('Contribution amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createdPlan = await createSavingsPlan({
        name,
        planType,
        targetAmount,
        contributionAmount,
        frequency: personalFrequency,
        fundingSource,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: savingsKeys.plans }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);

      toast.success('Savings plan created.');
      navigate(`/savings/${createdPlan.id}`);
    } catch (createError) {
      const errorMessage = getApiErrorMessage(createError, 'Unable to create savings plan.');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroupGoal = async () => {
    if (!name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      setError('Enter a valid name, target amount, and contribution amount.');
      return;
    }

    if (!deadline.trim()) {
      setError('Please select a deadline date for your group goal.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await createGroupGoal({
        name,
        description,
        category,
        targetAmount,
        contributionAmount,
        frequency: groupFrequency,
        deadline: deadline.trim(),
      });

      setCreatedGroupGoal(result);
      await queryClient.invalidateQueries({ queryKey: groupGoalsKeys.list });
      setStep('invite');
      toast.success('Group goal created.');
    } catch (createError) {
      setError(getApiErrorMessage(createError, 'Unable to create this group goal.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvite = async (user: PlatformUserSearchResult) => {
    if (!createdGroupGoal) return;
    setIsSubmitting(true);
    setError('');
    try {
      await sendGroupGoalInvite({
        goalId: createdGroupGoal.id,
        channel: 'platform',
        platformUserId: user.userId,
      });
      toast.success(`In-app invite sent to ${user.fullName}.`);
    } catch (inviteError) {
      setError(getApiErrorMessage(inviteError, 'Unable to send invite.'));
      throw inviteError;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactInvite = async (contact: string, channel: 'email' | 'sms') => {
    if (!createdGroupGoal) return;
    setIsSubmitting(true);
    setError('');
    try {
      await sendGroupGoalInvite({
        goalId: createdGroupGoal.id,
        channel,
        memberContact: contact,
      });
      toast.success(`${channel.toUpperCase()} invite queued for ${contact}.`);
    } catch (inviteError) {
      setError(getApiErrorMessage(inviteError, 'Unable to send invite.'));
      throw inviteError;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-24">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mx-auto max-w-2xl space-y-6">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Create a Goal</h1>
                <p className="text-sm text-muted-foreground mt-1">Configure your savings target details below.</p>
              </div>

              {/* Goal Type Switcher */}
              <div className="flex gap-2 rounded-xl border border-border bg-card p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setGoalType('personal');
                    setError('');
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    goalType === 'personal'
                      ? 'bg-accent/10 text-accent font-bold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Target className="h-4 w-4" />
                  Personal Goal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoalType('group');
                    setError('');
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    goalType === 'group'
                      ? 'bg-primary/10 text-primary font-bold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Group Goal
                </button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Goal-Type Specific Fields */}
              {goalType === 'personal' ? (
                // --- PERSONAL GOAL FORM ---
                <div className="space-y-6">
                  {/* Personal Plan Type */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground">Choose Plan Type</Label>
                    <div className="grid gap-3">
                      {planTypes.map(option => (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => {
                            setPlanType(option.type);
                            setError('');
                          }}
                          className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${planType === option.type ? 'border-accent bg-accent/5 font-semibold text-foreground' : 'border-border bg-card'}`}
                        >
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${planType === option.type ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                            <option.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm">{option.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                          </div>
                          <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-md">{option.rate} p.a.</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold text-foreground text-sm border-b border-border pb-2">Plan Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="savings-name">Plan Name</Label>
                      <Input id="savings-name" value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="e.g. Rent 2027" className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="savings-target">Target Amount (₦)</Label>
                      <Input id="savings-target" type="number" value={target} onChange={event => { setTarget(event.target.value.replace(/[^\d]/g, '')); setError(''); }} placeholder="500000" className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="savings-contribution">Contribution Amount (₦)</Label>
                      <Input id="savings-contribution" type="number" value={contribution} onChange={event => { setContribution(event.target.value.replace(/[^\d]/g, '')); setError(''); }} placeholder="10000" className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <div className="flex gap-2">
                        {personalFrequencies.map(value => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setPersonalFrequency(value);
                              setError('');
                            }}
                            className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${personalFrequency === value ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-border text-foreground'}`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Funding Source Selector */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground">Funding Source</Label>
                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFundingSource('wallet');
                          setError('');
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${fundingSource === 'wallet' ? 'border-accent bg-accent/5 font-semibold text-foreground' : 'border-border bg-card'}`}
                      >
                        <div>
                          <p className="font-semibold text-foreground text-sm">Wallet Balance</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {walletQuery.isLoading ? 'Loading wallet...' : formatCurrency(walletQuery.data?.available ?? 0)}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fundingSource === 'wallet' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>Available</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFundingSource('saved_card');
                          setError('');
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${fundingSource === 'saved_card' ? 'border-accent bg-accent/5 font-semibold text-foreground' : 'border-border bg-card'}`}
                      >
                        <div>
                          <p className="font-semibold text-foreground text-sm">Saved Paystack Card</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Contributions will use your latest reusable card on file.
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fundingSource === 'saved_card' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>Card</span>
                      </button>
                    </div>
                  </div>

                  <Button className="h-12 w-full font-bold mt-4 animate-in fade-in duration-300" onClick={handleCreatePersonalGoal} disabled={isSubmitting || !name.trim() || !target || !contribution}>
                    {isSubmitting ? 'Creating plan...' : 'Create Personal Goal'}
                  </Button>
                </div>
              ) : (
                // --- GROUP GOAL FORM ---
                <div className="space-y-6">
                  {/* Group Goal Category */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground">Goal Category</Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {categories.map(option => (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => {
                            setCategory(option.type);
                            setError('');
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${category === option.type ? 'border-primary bg-primary/5 font-semibold text-foreground' : 'border-border bg-card'}`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category === option.type ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <option.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">{option.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{option.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold text-foreground text-sm border-b border-border pb-2">Goal Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="group-goal-name">Goal Name</Label>
                      <Input id="group-goal-name" value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="Family land purchase" className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-goal-description">Description</Label>
                      <Textarea id="group-goal-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe what the group is saving toward." rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-goal-target">Target Amount (₦)</Label>
                      <Input id="group-goal-target" type="number" value={target} onChange={event => { setTarget(event.target.value.replace(/[^\d]/g, '')); setError(''); }} placeholder="5000000" className="h-12" />
                    </div>
                  </div>

                  {/* Contribution Schedule Card */}
                  <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold text-foreground text-sm border-b border-border pb-2">Contribution Schedule</h3>
                    <div className="space-y-2">
                      <Label htmlFor="group-goal-contribution">Contribution Per Member (₦)</Label>
                      <Input id="group-goal-contribution" type="number" value={contribution} onChange={event => { setContribution(event.target.value.replace(/[^\d]/g, '')); setError(''); }} placeholder="200000" className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map(value => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setGroupFrequency(value);
                              setError('');
                            }}
                            className={`rounded-lg border px-3 py-2.5 text-xs font-semibold capitalize transition-colors ${groupFrequency === value ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border text-foreground hover:bg-muted/50'}`}
                          >
                            {value === 'biweekly' ? 'Biweekly' : value}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-goal-deadline">Deadline</Label>
                      <Input id="group-goal-deadline" type="date" value={deadline} onChange={event => { setDeadline(event.target.value); setError(''); }} className="h-12" required />
                    </div>
                  </div>

                  <Button className="h-12 w-full font-bold mt-4 animate-in fade-in duration-300" onClick={handleCreateGroupGoal} disabled={isSubmitting || !name.trim() || !target || !contribution || !deadline.trim()}>
                    {isSubmitting ? 'Creating group goal...' : 'Create Group Goal'}
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'invite' && createdGroupGoal && (
            <motion.div
              key="invite-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Invite Members</h1>
                <p className="text-sm text-muted-foreground mt-1">Get other members started on your shared goal.</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">Share this code with your members</p>
                <p className="font-mono text-3xl font-bold tracking-wider text-accent">{createdGroupGoal.inviteCode}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2 h-11" onClick={() => { navigator.clipboard?.writeText(createdGroupGoal.inviteCode); toast.success('Invite code copied.'); }}>
                    <Copy className="h-4 w-4" /> Copy Code
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 h-11" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/group-goals/join/${createdGroupGoal.inviteCode}`); toast.success('Invite link copied.'); }}>
                    <Share2 className="h-4 w-4" /> Copy Link
                  </Button>
                </div>
              </div>

              <PlatformUserInvitePicker
                onInvite={handleSendInvite}
                onInviteContact={handleContactInvite}
                disabled={isSubmitting}
                showDirectContactInvite
                title="Invite Members"
                description="Use one search box to invite AjoVault users or enter an email address or phone number for non-members."
              />

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span className="font-medium text-foreground">{createdGroupGoal.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span className="font-medium text-foreground">{formatCurrency(createdGroupGoal.targetAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium text-foreground">{formatCurrency(createdGroupGoal.contributionAmount)} / {createdGroupGoal.frequency}</span></div>
              </div>

              <Button className="h-12 w-full" onClick={() => navigate(`/group-goals/${createdGroupGoal.id}`)}>
                Go to Goal
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateGoalSelect;
