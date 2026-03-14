import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CheckCircle, Shield, Target, Users, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PinPad from '@/components/shared/PinPad';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getGroupGoalInvitePreview, groupGoalsKeys, joinGroupGoal, rejectGroupGoalInvite } from '@/services/groupGoalsApi';
import { toast } from 'sonner';

type Step = 'preview' | 'confirm' | 'success' | 'declined';

const GroupGoalJoinInvite = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('preview');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);

  const previewQuery = useQuery({
    queryKey: groupGoalsKeys.invite(code ?? ''),
    queryFn: () => getGroupGoalInvitePreview(code!),
    enabled: !!code,
  });

  const goal = previewQuery.data;

  if (previewQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading invite...</div>;
  }

  if (!goal) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {getApiErrorMessage(previewQuery.error, 'Invite not found.')}
      </div>
    );
  }

  const handleJoin = async (pin: string) => {
    if (!code) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await joinGroupGoal(code, pin);
      await queryClient.invalidateQueries({ queryKey: groupGoalsKeys.list });
      setStep('success');
      toast.success(`${result.goalName} joined.`);
    } catch (joinError) {
      const message = getApiErrorMessage(joinError, 'Unable to join this group goal.');
      setError(message);
      setPinPadKey(current => current + 1);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!code) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await rejectGroupGoalInvite(code);
      await queryClient.invalidateQueries({ queryKey: groupGoalsKeys.invite(code) });
      setStep('declined');
      toast.success('Group goal invite declined.');
    } catch (rejectError) {
      const message = getApiErrorMessage(rejectError, 'Unable to reject this group goal invite.');
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      {step !== 'success' && (
        <button
          onClick={() => {
            if (step === 'confirm') {
              setStep('preview');
              return;
            }

            navigate('/group-goals/join');
          }}
          className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Join Group Goal</h1>
              <p className="mt-1 text-sm text-muted-foreground">Save together toward a shared target.</p>
            </div>

            <Card className="space-y-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{goal.category}</p>
                <h2 className="mt-1 font-display text-lg font-bold">{goal.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{goal.description || 'Shared target savings goal'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{formatCurrency(goal.currentBalance)} / {formatCurrency(goal.targetAmount)}</span>
                </div>
                <Progress value={goal.progressPercent} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contribution</p>
                    <p className="text-sm font-bold">{formatCurrency(goal.contributionAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="text-sm font-bold">{formatDate(goal.deadline)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="text-sm font-bold">{goal.memberCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created by</p>
                    <p className="text-sm font-bold">{goal.creatorName}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-accent/20 bg-accent/5 p-4">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> members contribute {formatCurrency(goal.contributionAmount)} every {goal.frequency}. Funds stay pooled against the shared target until the goal is complete.
              </p>
            </Card>

            {goal.alreadyJoined && (
              <Alert>
                <AlertTitle>Already joined</AlertTitle>
                <AlertDescription>You already belong to this group goal.</AlertDescription>
              </Alert>
            )}

            {goal.invitationStatus?.toLowerCase() === 'rejected' && (
              <Alert>
                <AlertTitle>Invite declined</AlertTitle>
                <AlertDescription>You already declined this group goal invite.</AlertDescription>
              </Alert>
            )}

            <Button
              className="h-12 w-full"
              onClick={() => {
                setError('');
                setPinPadKey(current => current + 1);
                setStep('confirm');
              }}
              disabled={goal.alreadyJoined || goal.status !== 'active' || goal.invitationStatus?.toLowerCase() === 'rejected'}
            >
              {goal.invitationStatus?.toLowerCase() === 'rejected'
                ? 'Invite declined'
                : goal.status !== 'active'
                  ? 'Goal is not open for joining'
                  : 'Join This Goal'}
            </Button>
            {goal.hasPendingInvitation && goal.invitationStatus?.toLowerCase() !== 'rejected' && (
              <Button variant="outline" className="w-full" onClick={() => void handleReject()} disabled={isSubmitting || goal.alreadyJoined}>
                Decline Invite
              </Button>
            )}
            <Button variant="ghost" className="w-full" onClick={() => navigate('/group-goals')}>
              Not Now
            </Button>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center pt-10">
            <PinPad
              key={pinPadKey}
              title="Confirm Joining"
              subtitle={`Join ${goal.name}`}
              error={error}
              disabled={isSubmitting}
              onInput={() => setError('')}
              onComplete={handleJoin}
            />
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center space-y-4 pt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold">You joined {goal.name}</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Your fixed contribution is {formatCurrency(goal.contributionAmount)} and the target is {formatCurrency(goal.targetAmount)} by {formatDate(goal.deadline)}.
            </p>
            <Card className="w-full space-y-2 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span className="font-bold">{goal.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium">{formatCurrency(goal.contributionAmount)} / {goal.frequency}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Invite Code</span><span className="font-mono text-xs">{goal.inviteCode}</span></div>
            </Card>
            <Button className="h-12 w-full" onClick={() => navigate('/group-goals')}>
              Go to Group Goals
            </Button>
          </motion.div>
        )}

        {step === 'declined' && (
          <motion.div key="declined" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center space-y-4 pt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ArrowLeft className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold">Invite declined</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              You declined the invite to join {goal.name}. The admin can send you a new invite later.
            </p>
            <Button className="h-12 w-full" onClick={() => navigate('/notifications')}>
              Back to Notifications
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupGoalJoinInvite;
