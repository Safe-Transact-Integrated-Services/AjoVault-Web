import { useState } from 'react';
import { ArrowLeft, Copy, Mail, MessageSquare, Share2, CheckCircle, Users } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { mockCircles, formatCurrency } from '@/services/mockData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type InviteMethod = 'code' | 'email' | 'sms';

const CircleInvite = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const circle = mockCircles.find(c => c.id === id);
  const [method, setMethod] = useState<InviteMethod | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const inviteCode = 'AJO-' + (id || '').slice(-3).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase();

  if (!circle) { navigate(-1); return null; }

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(inviteCode);
    toast.success('Invite code copied!');
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/circles/join/${inviteCode}`;
    navigator.clipboard?.writeText(link);
    toast.success('Invite link copied!');
  };

  const handleSendEmail = async () => {
    if (!email) return;
    setSent(true);
    toast.success(`Invitation sent to ${email}`);
  };

  const handleSendSMS = async () => {
    if (!phone) return;
    setSent(true);
    toast.success(`SMS invitation sent to ${phone}`);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center space-y-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h2 className="font-display text-xl font-bold">Invitation Sent!</h2>
          <p className="text-sm text-muted-foreground max-w-xs mt-2">
            {method === 'email' ? `Email sent to ${email}` : `SMS sent to ${phone}`} with instructions to join {circle.name}.
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => { setSent(false); setMethod(null); setEmail(''); setPhone(''); }}>
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

      <h1 className="font-display text-2xl font-bold mb-2">Invite Members</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {circle.name} · {circle.memberCount}/{circle.maxMembers} members
      </p>

      {!method && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Invite Code Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Share2 className="h-4 w-4 text-accent" /> Share Invite Code
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-accent tracking-wider">{inviteCode}</p>
              <p className="text-xs text-muted-foreground mt-1">Members can join at /circles/join</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyCode}>
                <Copy className="h-4 w-4" /> Copy Code
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyLink}>
                <Share2 className="h-4 w-4" /> Copy Link
              </Button>
            </div>
          </Card>

          {/* Other invite methods */}
          <p className="text-xs text-muted-foreground text-center">Or invite directly via</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod('email')}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Email</span>
            </button>
            <button
              onClick={() => setMethod('sms')}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm font-medium text-foreground">SMS</span>
            </button>
          </div>

          {/* Circle summary */}
          <Card className="p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium">{formatCurrency(circle.amount)} / {circle.frequency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Slots Remaining</span><span className="font-medium">{circle.maxMembers - circle.memberCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payout Type</span><span className="font-medium capitalize">{circle.payoutType}</span></div>
          </Card>
        </motion.div>
      )}

      {method === 'email' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4 text-primary" /> Invite via Email
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="friend@email.com" className="h-12" />
            </div>
            <p className="text-xs text-muted-foreground">
              They'll receive an email with the invite code and a link to join {circle.name}.
            </p>
          </Card>
          <Button className="w-full h-12" onClick={handleSendEmail} disabled={!email || !email.includes('@')}>
            Send Email Invitation
          </Button>
        </motion.div>
      )}

      {method === 'sms' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <MessageSquare className="h-4 w-4 text-accent" /> Invite via SMS
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 801 234 5678" className="h-12" />
            </div>
            <p className="text-xs text-muted-foreground">
              They'll receive an SMS with the invite code to join {circle.name}.
            </p>
          </Card>
          <Button className="w-full h-12" onClick={handleSendSMS} disabled={!phone || phone.length < 10}>
            Send SMS Invitation
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default CircleInvite;

