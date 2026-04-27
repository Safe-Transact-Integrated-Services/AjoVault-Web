import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, PiggyBank, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { dashboardKeys } from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { notificationKeys } from '@/services/notificationsApi';
import {
  acceptSavingsInvitation,
  getSavingsInvitation,
  rejectSavingsInvitation,
  savingsKeys,
} from '@/services/savingsApi';
import { toast } from 'sonner';

type Step = 'preview' | 'accepted' | 'declined';

const SavingsInvitationDecision = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('preview');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invitationQuery = useQuery({
    queryKey: id ? savingsKeys.invitation(id) : savingsKeys.invitation('missing'),
    queryFn: () => getSavingsInvitation(id!),
    enabled: !!id,
  });

  const invitation = invitationQuery.data;

  const invalidateShellQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: savingsKeys.all }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.feed }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
    ]);
  };

  const handleAccept = async () => {
    if (!id) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await acceptSavingsInvitation(id);
      await invalidateShellQueries();
      setStep('accepted');
      toast.success('Savings invite accepted.');
    } catch (acceptError) {
      const message = getApiErrorMessage(acceptError, 'Unable to accept this savings invite.');
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!id) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await rejectSavingsInvitation(id);
      await invalidateShellQueries();
      setStep('declined');
      toast.success('Savings invite declined.');
    } catch (rejectError) {
      const message = getApiErrorMessage(rejectError, 'Unable to reject this savings invite.');
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (invitationQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading savings invite...</div>;
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {getApiErrorMessage(invitationQuery.error, 'Savings invite not found.')}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      {step === 'preview' && (
        <button onClick={() => navigate('/notifications')} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <PiggyBank className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Savings Invite</h1>
              <p className="mt-1 text-sm text-muted-foreground">{invitation.inviterName} invited you to start saving on AjoVault.</p>
            </div>

            <Card className="space-y-3 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invited by</span>
                <span className="font-medium text-foreground">{invitation.inviterName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Channel</span>
                <span className="font-medium capitalize text-foreground">{invitation.channel}</span>
              </div>
              {invitation.memberContact && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="font-medium text-foreground">{invitation.memberContact}</span>
                </div>
              )}
            </Card>

            {invitation.status.toLowerCase() === 'rejected' && (
              <Alert>
                <AlertTitle>Invite declined</AlertTitle>
                <AlertDescription>You already declined this savings invite.</AlertDescription>
              </Alert>
            )}

            {invitation.status.toLowerCase() === 'accepted' && (
              <Alert>
                <AlertTitle>Invite accepted</AlertTitle>
                <AlertDescription>You already accepted this savings invite.</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Unable to continue</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              className="h-12 w-full"
              onClick={() => void handleAccept()}
              disabled={isSubmitting || invitation.status.toLowerCase() !== 'pendingresponse'}
            >
              Accept Invite
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full"
              onClick={() => void handleReject()}
              disabled={isSubmitting || invitation.status.toLowerCase() !== 'pendingresponse'}
            >
              Decline Invite
            </Button>
          </motion.div>
        )}

        {step === 'accepted' && (
          <motion.div key="accepted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center space-y-4 pt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold">Invite accepted</h2>
            <p className="max-w-xs text-sm text-muted-foreground">You accepted the savings invite. You can now start saving inside AjoVault.</p>
            <Button className="h-12 w-full" onClick={() => navigate('/savings')}>
              Go to Savings
            </Button>
          </motion.div>
        )}

        {step === 'declined' && (
          <motion.div key="declined" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center space-y-4 pt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <XCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold">Invite declined</h2>
            <p className="max-w-xs text-sm text-muted-foreground">You declined the savings invite. The sender can invite you again later.</p>
            <Button className="h-12 w-full" onClick={() => navigate('/notifications')}>
              Back to Notifications
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavingsInvitationDecision;
