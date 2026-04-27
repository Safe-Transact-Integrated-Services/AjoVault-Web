import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CheckCircle, Shield, Users, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PinPad from '@/components/shared/PinPad';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { circlesKeys, getCircleInvitePreview, joinCircle, rejectCircleInvite } from '@/services/circlesApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency, formatDate } from '@/services/mockData';
import { toast } from 'sonner';

type Step = 'preview' | 'confirm' | 'success' | 'declined';

const CircleJoinInvite = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('preview');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);

  const previewQuery = useQuery({
    queryKey: circlesKeys.invite(code ?? ''),
    queryFn: () => getCircleInvitePreview(code!),
    enabled: !!code,
  });

  const circle = previewQuery.data;

  if (previewQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading invite...</div>;
  }

  if (!circle) {
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
      const result = await joinCircle(code, pin);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: circlesKeys.list }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);
      setStep('success');
      toast.success(`${result.groupName} joined.`);
    } catch (joinError) {
      const message = getApiErrorMessage(joinError, 'Unable to join this circle.');
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
      await rejectCircleInvite(code);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: circlesKeys.invite(code) }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);
      setStep('declined');
      toast.success('Circle invite declined.');
    } catch (rejectError) {
      const message = getApiErrorMessage(rejectError, 'Unable to reject this circle invite.');
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

            navigate('/circles/join');
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
              <h1 className="font-display text-2xl font-bold">You're Invited!</h1>
              <p className="mt-1 text-sm text-muted-foreground">You've been invited to join a savings circle.</p>
              <Badge variant="secondary" className="mt-2 font-mono">{circle.inviteCode}</Badge>
            </div>

            <Card className="space-y-3 p-5">
              <h2 className="font-display text-lg font-bold">{circle.name}</h2>
              <p className="text-sm text-muted-foreground">{circle.description || 'Rotating contribution circle'}</p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contribution</p>
                    <p className="text-sm font-bold">{formatCurrency(circle.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Frequency</p>
                    <p className="text-sm font-bold capitalize">{circle.frequency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="text-sm font-bold">{circle.memberCount}/{circle.maxMembers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payout</p>
                    <p className="text-sm font-bold capitalize">{circle.payoutType}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-accent/20 bg-accent/5 p-4">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> every {circle.frequency}, each member contributes {formatCurrency(circle.amount)}.
                One member receives the pooled payout of about {formatCurrency(circle.payoutAmount)} each cycle.
              </p>
            </Card>

            {circle.alreadyJoined && (
              <Alert>
                <AlertTitle>Already joined</AlertTitle>
                <AlertDescription>You already belong to this circle.</AlertDescription>
              </Alert>
            )}

            {circle.invitationStatus?.toLowerCase() === 'rejected' && (
              <Alert>
                <AlertTitle>Invite declined</AlertTitle>
                <AlertDescription>You already declined this circle invite.</AlertDescription>
              </Alert>
            )}

            <Button
              className="h-12 w-full"
              onClick={() => {
                setError('');
                setPinPadKey(current => current + 1);
                setStep('confirm');
              }}
              disabled={circle.alreadyJoined || circle.slotsRemaining <= 0 || circle.invitationStatus?.toLowerCase() === 'rejected'}
            >
              {circle.invitationStatus?.toLowerCase() === 'rejected'
                ? 'Invite declined'
                : circle.slotsRemaining <= 0
                  ? 'Circle is full'
                  : 'Join This Circle'}
            </Button>
            {circle.hasPendingInvitation && circle.invitationStatus?.toLowerCase() !== 'rejected' && (
              <Button variant="outline" className="w-full" onClick={() => void handleReject()} disabled={isSubmitting || circle.alreadyJoined}>
                Decline Invite
              </Button>
            )}
            <Button variant="ghost" className="w-full" onClick={() => navigate('/circles')}>
              Not Now
            </Button>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center pt-10">
            <PinPad
              key={pinPadKey}
              title="Confirm Joining"
              subtitle={`Join ${circle.name}`}
              error={error}
              disabled={isSubmitting}
              onInput={() => setError('')}
              onComplete={handleJoin}
            />
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold">Welcome to {circle.name}!</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Your next contribution of {formatCurrency(circle.amount)} is due on {formatDate(circle.nextContributionDate)}.
            </p>
            <Card className="w-full space-y-2 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Circle</span><span className="font-bold">{circle.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium">{formatCurrency(circle.amount)} / {circle.frequency}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Invite Code</span><span className="font-mono text-xs">{circle.inviteCode}</span></div>
            </Card>
            <Button className="h-12 w-full" onClick={() => navigate('/circles')}>
              Go to Circles
            </Button>
          </motion.div>
        )}

        {step === 'declined' && (
          <motion.div key="declined" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ArrowLeft className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold">Invite declined</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              You declined the invite to join {circle.name}. The admin can send you a new invite later.
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

export default CircleJoinInvite;
