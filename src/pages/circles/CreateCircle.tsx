import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Share2 } from 'lucide-react';
import PlatformUserInvitePicker from '@/components/shared/PlatformUserInvitePicker';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  circlesKeys,
  createCircle,
  sendCircleInvite,
  type CircleDetail,
} from '@/services/circlesApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import type { PlatformUserSearchResult } from '@/services/platformUsersApi';
import { toast } from 'sonner';

type Step = 'form' | 'invite';

const CreateCircle = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'bi-weekly' | 'monthly'>('monthly');
  const [maxMembers, setMaxMembers] = useState('');
  const [payoutType] = useState<'rotation' | 'random' | 'bidding'>('rotation');
  const [startDate, setStartDate] = useState('');
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ongoing offline progress import state variables
  const [isOngoing, setIsOngoing] = useState(false);
  const [currentCycle, setCurrentCycle] = useState('1');
  const [completedPayoutsCount, setCompletedPayoutsCount] = useState('0');

  const location = useLocation();
  const template = location.state?.templateCircle;

  // Auto pre-fill if navigating with template state
  useEffect(() => {
    if (template) {
      setName(template.name ?? '');
      setDescription(template.description ?? '');
      setAmount(template.amount?.toString() ?? '');
      setFrequency(template.frequency ?? 'monthly');
      setMaxMembers(template.maxMembers?.toString() ?? '');
      setStartDate(template.startDate ?? '');
    }
  }, [template]);

  const handleCreate = async () => {
    const amountValue = Number(amount);
    const maxMembersValue = Number(maxMembers);
    if (!Number.isFinite(amountValue) || amountValue <= 0 || !Number.isFinite(maxMembersValue) || maxMembersValue <= 0) {
      setError('Enter a valid contribution amount and member limit.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const currentCycleValue = isOngoing ? Number(currentCycle) : 1;
    const completedPayoutsValue = isOngoing ? Number(completedPayoutsCount) : 0;

    try {
      const createdCircle = await createCircle({
        name,
        description,
        amount: amountValue,
        frequency,
        maxMembers: maxMembersValue,
        payoutType,
        isOngoing,
        currentCycle: currentCycleValue,
        completedPayoutsCount: completedPayoutsValue,
        startDate: startDate || undefined,
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
      <div className="mb-6 flex gap-1">
        {[0, 1].map(index => (
          <div key={index} className={`h-1 flex-1 rounded-full ${(step === 'form' ? 0 : 1) >= index ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {step === 'form' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Create Circle</h1>
              
              {/* Section 1: Basic Information */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground text-sm border-b border-border pb-2">Basic Info</h3>
                <div className="space-y-2">
                  <Label htmlFor="circle-name">Circle Name</Label>
                  <Input id="circle-name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Ajo Family" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="circle-description">Description</Label>
                  <Input id="circle-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Monthly family contribution group" className="h-12" />
                </div>
              </div>

              {/* Section 2: Contribution Details */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground text-sm border-b border-border pb-2">Contribution Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="circle-amount">Amount per member (₦)</Label>
                  <Input id="circle-amount" type="number" value={amount} onChange={event => setAmount(event.target.value.replace(/[^\d]/g, ''))} placeholder="25000" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(['daily', 'weekly', 'bi-weekly', 'monthly'] as const).map(value => (
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
                
                <div className="space-y-2">
                  <Label htmlFor="circle-start-date">Start Date (Optional)</Label>
                  <Input id="circle-start-date" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="h-12 text-foreground" />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isOngoing}
                      onChange={(e) => {
                        setIsOngoing(e.target.checked);
                        if (!e.target.checked) {
                          setCurrentCycle('1');
                          setCompletedPayoutsCount('0');
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent accent-accent"
                    />
                    <span className="text-sm font-semibold text-foreground">Import group contribution (offline circle)</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 ml-6">
                    Select this if some contributions/payouts have already been processed offline.
                  </p>
                </div>

                {isOngoing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 border-l-2 border-accent/20 pl-4 py-1"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="circle-current-cycle">Current Cycle Number</Label>
                      <Input
                        id="circle-current-cycle"
                        type="number"
                        min="1"
                        max={maxMembers || "100"}
                        value={currentCycle}
                        onChange={event => setCurrentCycle(event.target.value.replace(/[^\d]/g, ''))}
                        placeholder="e.g. 4"
                        className="h-12"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        The circle will start digitized at this cycle number.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="circle-completed-payouts">Payouts Completed Offline</Label>
                      <Input
                        id="circle-completed-payouts"
                        type="number"
                        min="0"
                        max={String(Math.max(0, Number(currentCycle) - 1))}
                        value={completedPayoutsCount}
                        onChange={event => setCompletedPayoutsCount(event.target.value.replace(/[^\d]/g, ''))}
                        placeholder="e.g. 3"
                        className="h-12"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Number of members who have already received their payouts offline.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="h-12 w-full font-bold" onClick={handleCreate} disabled={isSubmitting || !name.trim() || !amount || !maxMembers}>
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
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{circle.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium text-foreground">₦{Number(amount || 0).toLocaleString()} / {frequency}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Max Members</span><span className="font-medium text-foreground">{maxMembers}</span></div>
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
