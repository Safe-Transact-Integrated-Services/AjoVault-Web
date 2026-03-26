import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Headset, LifeBuoy, LoaderCircle, MessageSquareText, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { notificationKeys } from '@/services/notificationsApi';
import {
  createAgentSupportRequest,
  getMyAgentSupportOverview,
  supportKeys,
  type SupportCategory,
  type SupportPriority,
} from '@/services/supportApi';
import { getApiErrorMessage } from '@/lib/api/http';

const categoryOptions: { value: SupportCategory; label: string; helper: string }[] = [
  { value: 'agent_transaction', label: 'Agent Transactions', helper: 'Cash services, transfer OTP, bill payment, and assisted flow failures.' },
  { value: 'agent_settlement', label: 'Agent Settlements', helper: 'Commission movement, settlement timing, and wallet credit issues.' },
  { value: 'agent_float', label: 'Agent Float', helper: 'Float adjustment, float mismatch, and cash-in availability issues.' },
  { value: 'account', label: 'Account', helper: 'Agent login, linked customers, and portal access issues.' },
  { value: 'verification', label: 'Verification', helper: 'KYC, agent approval, and identity review issues.' },
  { value: 'other', label: 'Other', helper: 'Anything else that needs super-admin review.' },
];

const priorityOptions: { value: SupportPriority; label: string }[] = [
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
  { value: 'low', label: 'Low' },
];

const statusClasses: Record<string, string> = {
  open: 'border-warning/30 bg-warning/10 text-warning',
  in_review: 'border-accent/30 bg-accent/10 text-accent',
  resolved: 'border-success/30 bg-success/10 text-success',
};

const priorityClasses: Record<string, string> = {
  low: 'border-muted bg-muted text-muted-foreground',
  medium: 'border-warning/30 bg-warning/10 text-warning',
  high: 'border-destructive/20 bg-destructive/10 text-destructive',
  critical: 'border-destructive bg-destructive text-destructive-foreground',
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const AgentHelpSupport = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const supportQuery = useQuery({
    queryKey: supportKeys.agentMe,
    queryFn: getMyAgentSupportOverview,
  });
  const [category, setCategory] = useState<SupportCategory>('agent_transaction');
  const [priority, setPriority] = useState<SupportPriority>('medium');
  const [relatedReference, setRelatedReference] = useState('');
  const [relatedCustomerIdentifier, setRelatedCustomerIdentifier] = useState('');
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
      await createAgentSupportRequest({
        category,
        priority,
        subject: trimmedSubject,
        message: trimmedMessage,
        relatedReference,
        relatedCustomerIdentifier,
      });

      setSubject('');
      setMessage('');
      setRelatedReference('');
      setRelatedCustomerIdentifier('');
      setPriority('medium');
      toast('Agent support request submitted.');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: supportKeys.agentMe }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.feed }),
      ]);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to submit agent support request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const requests = supportQuery.data?.requests ?? [];
  const faqs = supportQuery.data?.faqs ?? [];

  return (
    <div className="min-h-screen space-y-6 px-4 py-6 safe-top">
      <button onClick={() => navigate('/agent/more')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/10 via-background to-background p-5">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Headset className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Agent Help & Support</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Raise transaction, float, or settlement issues for super-admin review. Link the customer or reference when the issue is tied to an assisted service.
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
          {getApiErrorMessage(supportQuery.error, 'Unable to load agent support.')}
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
                    {faq.link ? (
                      <Button variant="outline" size="sm" onClick={() => navigate(faq.link)}>
                        Open related page
                      </Button>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          <Card className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-accent" />
              <h2 className="font-semibold text-foreground">Submit an agent issue</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-support-category">Category</Label>
              <Select value={category} onValueChange={value => {
                setCategory(value as SupportCategory);
                setError('');
              }}>
                <SelectTrigger id="agent-support-category" className="h-12">
                  <SelectValue placeholder="Select issue category" />
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
              <Label htmlFor="agent-support-priority">Priority</Label>
              <Select value={priority} onValueChange={value => {
                setPriority(value as SupportPriority);
                setError('');
              }}>
                <SelectTrigger id="agent-support-priority" className="h-12">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agent-related-reference">Transaction Reference</Label>
                <Input
                  id="agent-related-reference"
                  value={relatedReference}
                  onChange={event => {
                    setRelatedReference(event.target.value);
                    setError('');
                  }}
                  placeholder="Optional reference"
                  maxLength={120}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-related-customer">Customer Phone or Email</Label>
                <Input
                  id="agent-related-customer"
                  value={relatedCustomerIdentifier}
                  onChange={event => {
                    setRelatedCustomerIdentifier(event.target.value);
                    setError('');
                  }}
                  placeholder="Optional customer identifier"
                  maxLength={160}
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-support-subject">Subject</Label>
              <Input
                id="agent-support-subject"
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
              <Label htmlFor="agent-support-message">Message</Label>
              <Textarea
                id="agent-support-message"
                value={message}
                onChange={event => {
                  setMessage(event.target.value);
                  setError('');
                }}
                placeholder="Describe what happened, what service was involved, what you already checked, and what needs intervention."
                maxLength={1200}
                className="min-h-[132px] resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Include customer context and the affected flow so super-admin can act quickly.</span>
                <span>{message.trim().length}/1200</span>
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button onClick={handleSubmit} disabled={isSubmitting} className="h-12 w-full">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit issue
                </>
              )}
            </Button>
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground">Recent issues</h2>
                <p className="text-xs text-muted-foreground">Track the status and response on your submitted issues.</p>
              </div>
              <Badge variant="outline">{requests.length} total</Badge>
            </div>

            {requests.length === 0 ? (
              <EmptyTableState
                title="No agent issues yet"
                description="Submit one above when a transaction, float, or settlement flow needs super-admin review."
              />
            ) : null}

            <div className="space-y-3">
              {requests.map(request => (
                <div key={request.requestId} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{request.subject}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline">{request.categoryLabel}</Badge>
                        <Badge variant="outline" className={priorityClasses[request.priority] ?? priorityClasses.medium}>
                          {request.priority}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusClasses[request.status] ?? statusClasses.open}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">{request.message}</p>

                  {request.relatedReference || request.relatedCustomerIdentifier ? (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      {request.relatedReference ? <p>Reference: {request.relatedReference}</p> : null}
                      {request.relatedCustomerIdentifier ? <p>Customer: {request.relatedCustomerIdentifier}</p> : null}
                    </div>
                  ) : null}

                  {request.adminResponse ? (
                    <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-foreground">
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Admin Response</p>
                      <p className="mt-1 text-sm text-muted-foreground">{request.adminResponse}</p>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span>Opened {formatDate(request.createdAtUtc)}</span>
                    <span>Updated {formatDate(request.updatedAtUtc)}</span>
                    {request.resolvedAtUtc ? <span>Resolved {formatDate(request.resolvedAtUtc)}</span> : null}
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

export default AgentHelpSupport;
