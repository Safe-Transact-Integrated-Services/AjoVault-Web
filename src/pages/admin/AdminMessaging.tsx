import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  adminMessagingKeys,
  getAdminMessagingDispatches,
  retryAdminMessagingDispatch,
  type AdminMessagingDispatch,
} from '@/services/adminMessagingApi';

const statusBadgeClass: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  sending: 'bg-accent/10 text-accent',
  sent: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
};

const channelIcon: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
};

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const takeOptions = ['25', '50', '100', '200'] as const;

const AdminMessaging = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all');
  const [channel, setChannel] = useState('all');
  const [purpose, setPurpose] = useState('all');
  const [take, setTake] = useState('100');

  const filters = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      channel: channel === 'all' ? undefined : channel,
      purpose: purpose === 'all' ? undefined : purpose,
      take: Number.parseInt(take, 10),
    }),
    [channel, purpose, status, take],
  );

  const dispatchesQuery = useQuery({
    queryKey: adminMessagingKeys.dispatches(filters),
    queryFn: () => getAdminMessagingDispatches(filters),
  });

  const retryMutation = useMutation({
    mutationFn: retryAdminMessagingDispatch,
    onSuccess: async () => {
      toast.success('Dispatch queued for retry.');
      await queryClient.invalidateQueries({ queryKey: adminMessagingKeys.all });
    },
    onError: error => {
      toast.error(getApiErrorMessage(error, 'Unable to retry this dispatch.'));
    },
  });

  const data = dispatchesQuery.data;

  const renderRecipient = (dispatch: AdminMessagingDispatch) => {
    if (dispatch.userFullName) {
      return (
        <div>
          <p className="text-sm font-medium text-foreground">{dispatch.userFullName}</p>
          <p className="text-xs text-muted-foreground">{dispatch.recipient}</p>
        </div>
      );
    }

    return (
      <div>
        <p className="text-sm font-medium text-foreground">{dispatch.recipient}</p>
        <p className="text-xs text-muted-foreground">Direct outbound recipient</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Messaging</h1>
        <p className="text-sm text-muted-foreground">
          Review outbound email and SMS delivery records, then retry failed dispatches without touching the database.
        </p>
      </div>

      {dispatchesQuery.isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading outbound dispatches...
          </CardContent>
        </Card>
      ) : null}

      {dispatchesQuery.isError ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {getApiErrorMessage(dispatchesQuery.error, 'Unable to load outbound dispatches.')}
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { label: 'Pending', value: data.summary.pending, tone: 'bg-warning/10 text-warning' },
              { label: 'Sending', value: data.summary.sending, tone: 'bg-accent/10 text-accent' },
              { label: 'Sent', value: data.summary.sent, tone: 'bg-primary/10 text-primary' },
              { label: 'Delivered', value: data.summary.delivered, tone: 'bg-success/10 text-success' },
              { label: 'Failed', value: data.summary.failed, tone: 'bg-destructive/10 text-destructive' },
            ].map(card => (
              <Card key={card.label}>
                <CardContent className="p-4">
                  <p className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${card.tone}`}>
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-foreground">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All channels</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All purposes</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rows</Label>
                <Select value={take} onValueChange={setTake}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {takeOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outbound Dispatches</CardTitle>
            </CardHeader>
            <CardContent>
              {data.items.length === 0 ? (
                <EmptyTableState
                  title="No dispatches to show"
                  description="There are no outbound messages for the current filters yet. Broaden the filters or wait for new delivery activity."
                />
              ) : (
                <div className="space-y-4">
                  {data.items.map(dispatch => {
                    const Icon = channelIcon[dispatch.channel] ?? Mail;
                    return (
                      <div
                        key={dispatch.dispatchId}
                        className="rounded-lg border border-border p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <p className="truncate text-sm font-medium text-foreground">{dispatch.subject}</p>
                              <Badge variant="outline" className={`border-0 text-[10px] ${statusBadgeClass[dispatch.status] ?? statusBadgeClass.pending}`}>
                                {dispatch.status}
                              </Badge>
                            </div>

                            {renderRecipient(dispatch)}

                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>{dispatch.channel.toUpperCase()}</span>
                              <span>{dispatch.provider}</span>
                              <span>{dispatch.purpose}</span>
                              {dispatch.templateKey ? <span>{dispatch.templateKey}</span> : null}
                              {dispatch.feature ? <span>{dispatch.feature}</span> : null}
                            </div>

                            <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                              <span>Created: {dateFormatter.format(new Date(dispatch.createdAtUtc))}</span>
                              <span>Updated: {dateFormatter.format(new Date(dispatch.updatedAtUtc))}</span>
                              <span>Attempts: {dispatch.attemptCount}</span>
                              {dispatch.providerMessageId ? <span>Provider message ID: {dispatch.providerMessageId}</span> : null}
                            </div>

                            {dispatch.lastError ? (
                              <div className="rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">
                                {dispatch.lastError}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <Input
                              readOnly
                              value={dispatch.dispatchId}
                              className="hidden w-[220px] font-mono text-xs md:block"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={dispatch.status !== 'failed' || retryMutation.isPending}
                              onClick={() => retryMutation.mutate(dispatch.dispatchId)}
                            >
                              {retryMutation.isPending ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                              )}
                              Retry
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default AdminMessaging;
