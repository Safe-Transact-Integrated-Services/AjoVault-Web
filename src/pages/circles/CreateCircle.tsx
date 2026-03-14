import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import PlatformUserInvitePicker from '@/components/shared/PlatformUserInvitePicker';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { circlesKeys, createCircle, sendCircleInvite, type CircleDetail } from '@/services/circlesApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import type { PlatformUserSearchResult } from '@/services/platformUsersApi';
import { toast } from 'sonner';

type Step = 'name' | 'amount' | 'rules' | 'invite';

const CreateCircle = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [maxMembers, setMaxMembers] = useState('');
  const [payoutType, setPayoutType] = useState<'rotation' | 'random' | 'bidding'>('rotation');
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: Step[] = ['name', 'amount', 'rules', 'invite'];
  const stepIndex = steps.indexOf(step);

  const goBack = () => {
    const index = steps.indexOf(step);
    if (index > 0) {
      setStep(steps[index - 1]);
      return;
    }

    navigate(-1);
  };

  const handleCreate = async () => {
    const amountValue = Number(amount);
    const maxMembersValue = Number(maxMembers);
    if (!Number.isFinite(amountValue) || amountValue <= 0 || !Number.isFinite(maxMembersValue) || maxMembersValue <= 0) {
      setError('Enter a valid contribution amount and member limit.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createdCircle = await createCircle({
        name,
        description,
        amount: amountValue,
        frequency,
        maxMembers: maxMembersValue,
        payoutType,
      });

      setCircle(createdCircle);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: circlesKeys.list }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);
      setStep('invite');
      toast.success('Circle created.');
    } catch (createError) {
      setError(getApiErrorMessage(createError, 'Unable to create this circle.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvite = async (user: PlatformUserSearchResult) => {
    if (!circle) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await sendCircleInvite({
        circleId: circle.id,
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
    if (!circle) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await sendCircleInvite({
        circleId: circle.id,
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
      <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex gap-1">
        {[0, 1, 2, 3].map(index => (
          <div key={index} className={`h-1 flex-1 rounded-full ${stepIndex >= index ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {step === 'name' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Create Circle</h1>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="circle-name">Circle Name</Label>
                  <Input id="circle-name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Ajo Family" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="circle-description">Description</Label>
                  <Input id="circle-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Monthly family contribution group" className="h-12" />
                </div>
              </div>
              <Button className="h-12 w-full" onClick={() => setStep('amount')} disabled={!name.trim()}>
                Continue
              </Button>
            </div>
          )}

          {step === 'amount' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Contribution Details</h1>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="circle-amount">Amount per member (N)</Label>
                  <Input id="circle-amount" type="number" value={amount} onChange={event => setAmount(event.target.value.replace(/[^\d]/g, ''))} placeholder="25000" className="h-12" />
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
                  <Label htmlFor="circle-max-members">Max Members</Label>
                  <Input id="circle-max-members" type="number" value={maxMembers} onChange={event => setMaxMembers(event.target.value.replace(/[^\d]/g, ''))} placeholder="6" className="h-12" />
                </div>
              </div>
              <Button className="h-12 w-full" onClick={() => setStep('rules')} disabled={!amount || !maxMembers}>
                Continue
              </Button>
            </div>
          )}

          {step === 'rules' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Payout Rules</h1>
              <div className="space-y-3">
                {[
                  { id: 'rotation', label: 'Rotation', description: 'Members receive payouts in fixed order.' },
                  { id: 'random', label: 'Random', description: 'Admins can choose any unpaid member each cycle.' },
                  { id: 'bidding', label: 'Bidding', description: 'Admins can manage flexible payout ordering.' },
                ].map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPayoutType(option.id as typeof payoutType)}
                    className={`flex w-full flex-col rounded-xl border p-4 text-left transition-colors ${payoutType === option.id ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}
                  >
                    <span className="font-semibold text-foreground">{option.label}</span>
                    <span className="mt-0.5 text-xs text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="h-12 w-full" onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Circle'}
              </Button>
            </div>
          )}

          {step === 'invite' && circle && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Invite Members</h1>
              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">Share this code with your group members</p>
                <p className="font-mono text-3xl font-bold tracking-wider text-accent">{circle.inviteCode}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(circle.inviteCode); toast.success('Code copied.'); }}>
                    <Copy className="h-4 w-4" /> Copy Code
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/circles/join/${circle.inviteCode}`); toast.success('Link copied.'); }}>
                    <Share2 className="h-4 w-4" /> Copy Link
                  </Button>
                </div>
              </div>

              <PlatformUserInvitePicker
                onInvite={handleSendInvite}
                onInviteContact={handleContactInvite}
                disabled={isSubmitting}
                showDirectContactInvite
                title="Invite Platform Users"
                description="Search existing AjoVault users by email or phone number, then send an in-app invite."
              />

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{circle.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium text-foreground">N{Number(amount || 0).toLocaleString()} / {frequency}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Max Members</span><span className="font-medium text-foreground">{maxMembers}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payout</span><span className="font-medium capitalize text-foreground">{payoutType}</span></div>
              </div>

              <Button className="h-12 w-full" onClick={() => navigate(`/circles/${circle.id}`)}>
                Go to Circle
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateCircle;
