import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Headset, LifeBuoy, LoaderCircle, MessageSquareText, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboardKeys } from '@/services/dashboardApi';
import { notificationKeys } from '@/services/notificationsApi';
import {
  createSupportRequest,
  getMySupportOverview,
  supportKeys,
  type SupportCategory,
} from '@/services/supportApi';
import { getApiErrorMessage } from '@/lib/api/http';

const categoryOptions: { value: SupportCategory; label: string; helper: string }[] = [
  { value: 'account', label: 'Account', helper: 'Login, profile, or account access issues.' },
  { value: 'payment', label: 'Payments', helper: 'Wallet funding, transfers, and Paystack issues.' },
  { value: 'savings', label: 'Savings', helper: 'Plan setup, contributions, and withdrawals.' },
  { value: 'circle', label: 'Circles', helper: 'Members, payouts, and contribution problems.' },
  { value: 'group_goal', label: 'Group Goals', helper: 'Invites, goal progress, and contributions.' },
  { value: 'fundraising', label: 'Fundraising', helper: 'Campaign setup, donations, and campaign status.' },
  { value: 'verification', label: 'Verification', helper: 'KYC, identity checks, and approval issues.' },
  { value: 'other', label: 'Other', helper: 'Anything else that does not fit the main categories.' },
];

const statusClasses: Record<string, string> = {
  open: 'border-warning/30 bg-warning/10 text-warning',
  in_review: 'border-accent/30 bg-accent/10 text-accent',
  resolved: 'border-success/30 bg-success/10 text-success',
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const HelpSupport = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const supportQuery = useQuery({
    queryKey: supportKeys.me,
    queryFn: getMySupportOverview,
  });
  const [category, setCategory] = useState<SupportCategory>('account');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject) {
      setError('Subject is required.');
      return;
    }

    if (!trimmedMessage) {
      setError('Message is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createSupportRequest({
        category,
        subject: trimmedSubject,
        message: trimmedMessage,
      });

      setSubject('');
      setMessage('');
      toast('Support request submitted.');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: supportKeys.me }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.feed }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to submit support request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const requests = supportQuery.data?.requests ?? [];
  const faqs = supportQuery.data?.faqs ?? [];

  return (
    <div className="min-h-screen space-y-6 px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/10 via-background to-background p-5">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Headset className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Help & Support</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Find quick answers, then send a support request if you still need help. Your request history stays here.
        </p>
      </Card>

      {supportQuery.isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading support centre...
        </div>
      )}

      {supportQuery.isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(supportQuery.error, 'Unable to load help and support.')}
        </div>
      )}

      {!supportQuery.isLoading && !supportQuery.isError && (
        <>
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-accent" />
              <h2 className="font-semibold text-foreground">Quick answers</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map(faq => (
                <AccordionItem key={faq.faqId} value={faq.faqId}>
                  <AccordionTrigger className="text-left text-sm text-foreground">{faq.question}</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{faq.answer}</p>
                    {faq.link && (
                      <Button variant="outline" size="sm" onClick={() => navigate(faq.link!)}>
                        Open related page
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          <Card className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-accent" />
              <h2 className="font-semibold text-foreground">Submit a request</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-category">Category</Label>
              <Select value={category} onValueChange={value => {
                setCategory(value as SupportCategory);
                setError('');
              }}>
                <SelectTrigger id="support-category" className="h-12">
                  <SelectValue placeholder="Select support category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {categoryOptions.find(option => option.value === category)?.helper}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-subject">Subject</Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={event => {
                  setSubject(event.target.value);
                  setError('');
                }}
                placeholder="Briefly describe the issue"
                maxLength={120}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-message">Message</Label>
              <Textarea
                id="support-message"
                value={message}
                onChange={event => {
                  setMessage(event.target.value);
                  setError('');
                }}
                placeholder="Include what happened, what you expected, and any amount or flow involved."
                maxLength={1200}
                className="min-h-[132px] resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Be specific so support can act without asking basic follow-up questions.</span>
                <span>{message.trim().length}/1200</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleSubmit} disabled={isSubmitting} className="h-12 w-full">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit support request
                </>
              )}
            </Button>
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground">Recent requests</h2>
                <p className="text-xs text-muted-foreground">Track the status of your submitted issues.</p>
              </div>
              <Badge variant="outline">{requests.length} total</Badge>
            </div>

            {requests.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No support requests yet. Submit one above if you need help with payments, savings, circles, or access.
              </div>
            )}

            <div className="space-y-3">
              {requests.map(request => (
                <div key={request.requestId} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{request.subject}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{request.categoryLabel}</p>
                    </div>
                    <Badge variant="outline" className={statusClasses[request.status] ?? statusClasses.open}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{request.message}</p>
                  {request.adminResponse && (
                    <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-foreground">
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Admin Response</p>
                      <p className="mt-1 text-sm text-muted-foreground">{request.adminResponse}</p>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span>Opened {formatDate(request.createdAtUtc)}</span>
                    <span>Updated {formatDate(request.updatedAtUtc)}</span>
                    {request.resolvedAtUtc && <span>Resolved {formatDate(request.resolvedAtUtc)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default HelpSupport;
