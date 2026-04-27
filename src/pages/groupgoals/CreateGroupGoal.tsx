import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, GraduationCap, Home, Monitor, Package, Share2, Car } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import PlatformUserInvitePicker from '@/components/shared/PlatformUserInvitePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createGroupGoal, groupGoalsKeys, sendGroupGoalInvite, type GroupGoalCategory, type GroupGoalDetail } from '@/services/groupGoalsApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency } from '@/services/mockData';
import type { PlatformUserSearchResult } from '@/services/platformUsersApi';
import { toast } from 'sonner';

type Step = 'category' | 'details' | 'schedule' | 'review' | 'invite';

const categories: { type: GroupGoalCategory; label: string; desc: string; icon: typeof Home }[] = [
  { type: 'property', label: 'Property', desc: 'Land, house, or building', icon: Home },
  { type: 'vehicle', label: 'Vehicle', desc: 'Car, bus, or motorcycle', icon: Car },
  { type: 'equipment', label: 'Equipment', desc: 'Office or business equipment', icon: Monitor },
  { type: 'education', label: 'Education', desc: 'School fees or training', icon: GraduationCap },
  { type: 'other', label: 'Other', desc: 'Any other shared goal', icon: Package },
];

const steps: Step[] = ['category', 'details', 'schedule', 'review', 'invite'];

const CreateGroupGoal = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<GroupGoalCategory>('other');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [contribution, setContribution] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [deadline, setDeadline] = useState('');
  const [goal, setGoal] = useState<GroupGoalDetail | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepIndex = steps.indexOf(step);

  const handleCreate = async () => {
    const targetAmount = Number(target);
    const contributionAmount = Number(contribution);

    if (!name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(contributionAmount) || contributionAmount <= 0 || !deadline) {
      setError('Enter a valid name, target amount, contribution amount, and deadline.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createdGoal = await createGroupGoal({
        name,
        description,
        category,
        targetAmount,
        contributionAmount,
        frequency,
        deadline,
      });

      setGoal(createdGoal);
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
    if (!goal) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await sendGroupGoalInvite({
        goalId: goal.id,
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
    if (!goal) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await sendGroupGoalInvite({
        goalId: goal.id,
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
    <div className="min-h-screen px-4 py-6 safe-top">
      <div className="mb-6 flex gap-1">
        {steps.map((_, index) => (
          <div key={index} className={`h-1 flex-1 rounded-full ${stepIndex >= index ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {step === 'category' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">What is the shared goal?</h1>
              <div className="space-y-3">
                {categories.map(option => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      setCategory(option.type);
                      setStep('details');
                    }}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <option.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Goal Details</h1>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-goal-name">Goal Name</Label>
                  <Input id="group-goal-name" value={name} onChange={event => setName(event.target.value)} placeholder="Family land purchase" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-goal-description">Description</Label>
                  <Textarea id="group-goal-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe what the group is saving toward." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-goal-target">Target Amount (N)</Label>
                  <Input id="group-goal-target" type="number" value={target} onChange={event => setTarget(event.target.value.replace(/[^\d]/g, ''))} placeholder="5000000" className="h-12" />
                </div>
              </div>
              <Button className="h-12 w-full" onClick={() => setStep('schedule')} disabled={!name.trim() || !target}>
                Continue
              </Button>
            </div>
          )}

          {step === 'schedule' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Contribution Schedule</h1>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-goal-contribution">Contribution Per Member (N)</Label>
                  <Input id="group-goal-contribution" type="number" value={contribution} onChange={event => setContribution(event.target.value.replace(/[^\d]/g, ''))} placeholder="200000" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <div className="flex gap-2">
                    {(['weekly', 'monthly'] as const).map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFrequency(value)}
                        className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${frequency === value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground'}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-goal-deadline">Deadline</Label>
                  <Input id="group-goal-deadline" type="date" value={deadline} onChange={event => setDeadline(event.target.value)} className="h-12" />
                </div>
              </div>
              <Button className="h-12 w-full" onClick={() => setStep('review')} disabled={!contribution || !deadline}>
                Continue
              </Button>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Review Goal</h1>

              <div className="rounded-xl border border-border bg-card p-4 text-sm">
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Goal Name</span><span className="font-medium text-foreground">{name}</span></div>
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Category</span><span className="font-medium capitalize text-foreground">{category}</span></div>
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Target</span><span className="font-medium text-foreground">{formatCurrency(Number(target || 0))}</span></div>
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Contribution</span><span className="font-medium text-foreground">{formatCurrency(Number(contribution || 0))} / {frequency}</span></div>
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Deadline</span><span className="font-medium text-foreground">{deadline}</span></div>
              </div>

              {description && <p className="text-sm text-muted-foreground">{description}</p>}

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="h-12 w-full" onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create and Get Invite Link'}
              </Button>
            </div>
          )}

          {step === 'invite' && goal && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Invite Members</h1>

              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">Share this code with your members</p>
                <p className="font-mono text-3xl font-bold tracking-wider text-accent">{goal.inviteCode}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(goal.inviteCode); toast.success('Invite code copied.'); }}>
                    <Copy className="h-4 w-4" /> Copy Code
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/group-goals/join/${goal.inviteCode}`); toast.success('Invite link copied.'); }}>
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
                <div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span className="font-medium text-foreground">{goal.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span className="font-medium text-foreground">{formatCurrency(goal.targetAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium text-foreground">{formatCurrency(goal.contributionAmount)} / {goal.frequency}</span></div>
              </div>

              <Button className="h-12 w-full" onClick={() => navigate(`/group-goals/${goal.id}`)}>
                Go to Goal
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateGroupGoal;
