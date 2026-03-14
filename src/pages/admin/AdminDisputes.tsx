import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Filter, LoaderCircle, MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  getAdminSupportRequests,
  supportKeys,
  updateAdminSupportRequest,
  type AdminSupportRequest,
  type SupportPriority,
  type SupportStatus,
} from '@/services/supportApi';

const statusColor: Record<string, string> = {
  open: 'bg-warning/10 text-warning',
  in_review: 'bg-accent/10 text-accent',
  resolved: 'bg-success/10 text-success',
};

const priorityColor: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
  critical: 'bg-destructive text-destructive-foreground',
};

const roleColor: Record<string, string> = {
  customer: 'bg-primary/10 text-primary',
  agent: 'bg-accent/10 text-accent',
};

const AdminDisputes = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SupportStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | SupportPriority>('all');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const disputesQuery = useQuery({
    queryKey: supportKeys.adminAll,
    queryFn: getAdminSupportRequests,
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminSupportRequest,
    onSuccess: async (_, variables) => {
      toast(variables.status === 'resolved' ? 'Support request resolved.' : 'Support request updated.');
      await queryClient.invalidateQueries({ queryKey: supportKeys.adminAll });
    },
  });

  const requests = disputesQuery.data ?? [];
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return requests.filter(request => {
      const matchesSearch = !normalizedSearch
        || [
          request.subject,
          request.message,
          request.requesterFullName,
          request.requesterEmail,
          request.requesterPhoneNumber,
          request.relatedReference,
          request.relatedCustomerIdentifier,
          request.categoryLabel,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [priorityFilter, requests, search, statusFilter]);

  const selectedRequest = requests.find(request => request.requestId === selectedRequestId) ?? null;

  const statusCounts = {
    open: requests.filter(request => request.status === 'open').length,
    in_review: requests.filter(request => request.status === 'in_review').length,
    resolved: requests.filter(request => request.status === 'resolved').length,
  };

  const handleOpenRequest = (request: AdminSupportRequest) => {
    setSelectedRequestId(request.requestId);
    setResponseText(request.adminResponse ?? '');
  };

  const handleUpdate = async (status: SupportStatus) => {
    if (!selectedRequest) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        requestId: selectedRequest.requestId,
        status,
        adminResponse: responseText,
      });
      setSelectedRequestId(null);
      setResponseText('');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Unable to update this support request.'));
    }
  };

  const handleQuickUpdate = async (request: AdminSupportRequest, status: SupportStatus) => {
    try {
      await updateMutation.mutateAsync({
        requestId: request.requestId,
        status,
        adminResponse: request.adminResponse ?? '',
      });
    } catch (error) {
      toast(getApiErrorMessage(error, 'Unable to update this support request.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Disputes & Issues</h1>
        <p className="text-sm text-muted-foreground">{statusCounts.open + statusCounts.in_review} active issues</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {([
          ['open', statusCounts.open],
          ['in_review', statusCounts.in_review],
          ['resolved', statusCounts.resolved],
        ] as const).map(([status, count]) => (
          <Card
            key={status}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
          >
            <CardContent className="p-4">
              <Badge variant="outline" className={`mb-2 border-0 text-[10px] ${statusColor[status]}`}>
                {status.replace('_', ' ')}
              </Badge>
              <p className="text-2xl font-bold text-foreground">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues, requester, reference..."
            className="pl-9"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {priorityFilter === 'all' ? 'Priority' : priorityFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(['all', 'low', 'medium', 'high', 'critical'] as const).map(priority => (
                <DropdownMenuItem key={priority} onClick={() => setPriorityFilter(priority)}>
                  {priority}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {disputesQuery.isLoading ? (
        <Card className="p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading disputes...
          </div>
        </Card>
      ) : null}

      {disputesQuery.isError ? (
        <Card className="border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(disputesQuery.error, 'Unable to load support requests.')}
        </Card>
      ) : null}

      {!disputesQuery.isLoading && !disputesQuery.isError ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-4 font-medium text-muted-foreground">Subject</th>
                    <th className="hidden p-4 font-medium text-muted-foreground md:table-cell">Category</th>
                    <th className="hidden p-4 font-medium text-muted-foreground lg:table-cell">Requester</th>
                    <th className="p-4 font-medium text-muted-foreground">Priority</th>
                    <th className="hidden p-4 font-medium text-muted-foreground sm:table-cell">Updated</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Status</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(request => (
                    <tr key={request.requestId} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <p className="max-w-[240px] truncate font-medium text-foreground">{request.subject}</p>
                        <div className="mt-1 flex flex-wrap gap-2 lg:hidden">
                          <Badge variant="outline" className={`border-0 text-[10px] ${roleColor[request.requesterRole] ?? roleColor.customer}`}>
                            {request.requesterRole}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{request.requesterFullName}</span>
                        </div>
                      </td>
                      <td className="hidden p-4 text-muted-foreground md:table-cell">{request.categoryLabel}</td>
                      <td className="hidden p-4 lg:table-cell">
                        <div>
                          <p className="font-medium text-foreground">{request.requesterFullName}</p>
                          <p className="text-xs text-muted-foreground">{request.requesterPhoneNumber ?? request.requesterEmail ?? 'No contact'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`border-0 text-[10px] ${priorityColor[request.priority] ?? priorityColor.medium}`}>
                          {request.priority}
                        </Badge>
                      </td>
                      <td className="hidden p-4 text-muted-foreground sm:table-cell">
                        {new Date(request.updatedAtUtc).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[request.status] ?? statusColor.open}`}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenRequest(request)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View & Respond
                            </DropdownMenuItem>
                            {request.status !== 'in_review' ? (
                              <DropdownMenuItem onClick={() => void handleQuickUpdate(request, 'in_review')}>
                                Mark In Review
                              </DropdownMenuItem>
                            ) : null}
                            {request.status !== 'resolved' ? (
                              <DropdownMenuItem onClick={() => handleOpenRequest(request)}>
                                Resolve
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!filtered.length ? (
              <div className="p-4 text-sm text-muted-foreground">No disputes matched the current filters.</div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={!!selectedRequest} onOpenChange={open => {
        if (!open) {
          setSelectedRequestId(null);
          setResponseText('');
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>

          {selectedRequest ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{selectedRequest.subject}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.requesterFullName}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={`border-0 text-[10px] ${roleColor[selectedRequest.requesterRole] ?? roleColor.customer}`}>
                    {selectedRequest.requesterRole}
                  </Badge>
                  <Badge variant="outline" className={`border-0 text-[10px] ${priorityColor[selectedRequest.priority] ?? priorityColor.medium}`}>
                    {selectedRequest.priority}
                  </Badge>
                  <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[selectedRequest.status] ?? statusColor.open}`}>
                    {selectedRequest.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-foreground">{selectedRequest.message}</p>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Category</p>
                  <p className="font-medium text-foreground">{selectedRequest.categoryLabel}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Contact</p>
                  <p className="font-medium text-foreground">{selectedRequest.requesterPhoneNumber ?? selectedRequest.requesterEmail ?? 'No contact'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Reference</p>
                  <p className="font-medium text-foreground">{selectedRequest.relatedReference ?? 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Related Customer</p>
                  <p className="font-medium text-foreground">{selectedRequest.relatedCustomerIdentifier ?? 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Opened</p>
                  <p className="font-medium text-foreground">{new Date(selectedRequest.createdAtUtc).toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Updated</p>
                  <p className="font-medium text-foreground">{new Date(selectedRequest.updatedAtUtc).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Write a response or resolution note..."
                  value={responseText}
                  onChange={event => setResponseText(event.target.value)}
                  rows={4}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={updateMutation.isPending} onClick={() => void handleUpdate('in_review')}>
                    {updateMutation.isPending ? 'Saving...' : 'Mark In Review'}
                  </Button>
                  <Button size="sm" variant="outline" disabled={updateMutation.isPending} onClick={() => void handleUpdate('resolved')}>
                    Mark Resolved
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputes;
