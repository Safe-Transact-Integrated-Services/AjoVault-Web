import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Copy, Mail, MessageSquare, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { circlesKeys, getCircle, sendCircleInvite } from '@/services/circlesApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency } from '@/services/mockData';
import { toast } from 'sonner';

type InviteMethod = 'email' | 'sms' | null;

const CircleInvite = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [method, setMethod] = useState<InviteMethod>(null);
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState('');

  const circleQuery = useQuery({
    queryKey: id ? circlesKeys.detail(id) : circlesKeys.detail('missing'),
    queryFn: () => getCircle(id!),
    enabled: !!id,
  });

  const circle = circleQuery.data;

  if (circleQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading circle...</div>;
  }

  if (!circle) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {getApiErrorMessage(circleQuery.error, 'Circle not found.')}
      </div>
    );
  }

  const handleSend = async () => {
    if (!id || !method || !contact.trim()) {
      return;
    }

    try {
      await sendCircleInvite({
        circleId: id,
        channel: method,
        memberContact: contact,
      });
      setSent(contact);
      toast.success(`${method.toUpperCase()} invite queued.`);
    } catch (inviteError) {
      toast.error(getApiErrorMessage(inviteError, 'Unable to send invite.'));
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 px-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h2 className="font-display text-xl font-bold">Invitation Sent</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {method === 'email' ? `Email sent to ${sent}` : `SMS sent to ${sent}`} with instructions to join {circle.name}.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => { setSent(''); setMethod(null); setContact(''); }}>
              Invite Another
            </Button>
            <Button onClick={() => navigate(`/circles/${id}`)}>Done</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => method ? setMethod(null) : navigate(`/circles/${id}`)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-2 font-display text-2xl font-bold">Invite Members</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {circle.name} - {circle.memberCount}/{circle.maxMembers} members
      </p>

      {!method && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Share2 className="h-4 w-4 text-accent" /> Share Invite Code
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="font-mono text-2xl font-bold tracking-wider text-accent">{circle.inviteCode}</p>
              <p className="mt-1 text-xs text-muted-foreground">Members can join at /circles/join</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(circle.inviteCode); toast.success('Invite code copied.'); }}>
                <Copy className="h-4 w-4" /> Copy Code
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/circles/join/${circle.inviteCode}`); toast.success('Invite link copied.'); }}>
                <Share2 className="h-4 w-4" /> Copy Link
              </Button>
            </div>
          </Card>

          <p className="text-center text-xs text-muted-foreground">Or invite directly via</p>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMethod('email')} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Email</span>
            </button>
            <button onClick={() => setMethod('sms')} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm font-medium text-foreground">SMS</span>
            </button>
          </div>

          <Card className="space-y-2 p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium">{formatCurrency(circle.amount)} / {circle.frequency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Slots Remaining</span><span className="font-medium">{circle.maxMembers - circle.memberCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payout Type</span><span className="font-medium capitalize">{circle.payoutType}</span></div>
          </Card>
        </motion.div>
      )}

      {method && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2 font-medium">
              {method === 'email' ? <Mail className="h-4 w-4 text-primary" /> : <MessageSquare className="h-4 w-4 text-accent" />}
              Invite via {method === 'email' ? 'Email' : 'SMS'}
            </div>
            <div className="space-y-2">
              <Label htmlFor="circle-invite-contact">{method === 'email' ? 'Email Address' : 'Phone Number'}</Label>
              <Input
                id="circle-invite-contact"
                type={method === 'email' ? 'email' : 'tel'}
                value={contact}
                onChange={event => setContact(event.target.value)}
                placeholder={method === 'email' ? 'friend@email.com' : '08012345678'}
                className="h-12"
              />
            </div>
          </Card>
          <Button className="h-12 w-full" onClick={handleSend} disabled={!contact.trim()}>
            Send {method === 'email' ? 'Email' : 'SMS'} Invitation
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default CircleInvite;
