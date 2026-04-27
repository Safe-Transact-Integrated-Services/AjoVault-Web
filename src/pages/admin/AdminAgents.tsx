import { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle, Eye, Filter, MoreHorizontal, Search, UserCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TableEmptyStateRow } from '@/components/shared/EmptyTableState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  approveAdminAgentApplication,
  getAdminAgents,
  rejectAdminAgentApplication,
  updateAdminAgentFloat,
  updateAdminAgentStatus,
  type AdminAgentListItem,
  type AdminAgentProfile,
} from '@/services/adminAgentsApi';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const getItemStatus = (item: AdminAgentListItem) =>
  item.profile?.status ?? item.application?.status ?? 'pending';

const getLocation = (item: AdminAgentListItem) =>
  item.profile?.location ?? item.application?.location ?? 'Not available';

const getState = (item: AdminAgentListItem) =>
  item.profile?.state ?? item.application?.state ?? 'Not available';

const AdminAgents = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [items, setItems] = useState<AdminAgentListItem[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AdminAgentListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [approvalTier, setApprovalTier] = useState<AdminAgentProfile['tier']>('basic');
  const [reviewNote, setReviewNote] = useState('');
  const [floatBalance, setFloatBalance] = useState('');

  const loadAgents = async () => {
    setLoading(true);
    setError('');

    try {
      setItems(await getAdminAgents());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load agents.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, []);

  useEffect(() => {
    if (!selectedAgent) {
      return;
    }

    setApprovalTier(selectedAgent.profile?.tier ?? 'basic');
    setReviewNote(selectedAgent.application?.reviewNote ?? '');
    setFloatBalance(selectedAgent.profile ? String(selectedAgent.profile.floatBalance) : '');
  }, [selectedAgent]);

  const filtered = useMemo(
    () =>
      items.filter(item => {
        const haystack = [
          item.fullName,
          item.phoneNumber,
          item.email,
          item.profile?.agentCode,
          getLocation(item),
          getState(item),
        ]
          .join(' ')
          .toLowerCase();

        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || getItemStatus(item) === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [items, search, statusFilter],
  );

  const pendingCount = items.filter(item => getItemStatus(item) === 'pending').length;

  const statusColor: Record<string, string> = {
    active: 'bg-success/10 text-success',
    suspended: 'bg-destructive/10 text-destructive',
    pending: 'bg-warning/10 text-warning',
    rejected: 'bg-muted text-muted-foreground',
    approved: 'bg-accent/10 text-accent',
  };

  const tierColor: Record<string, string> = {
    basic: 'bg-muted text-muted-foreground',
    standard: 'bg-accent/10 text-accent',
    super: 'bg-primary/10 text-primary',
  };

  const handleApprove = async () => {
    if (!selectedAgent?.application) {
      return;
    }

    setSubmitting(true);
    try {
      await approveAdminAgentApplication(selectedAgent.application.applicationId, approvalTier, reviewNote);
      toast.success(`${selectedAgent.fullName} approved`);
      await loadAgents();
      setSelectedAgent(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to approve this agent application.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAgent?.application) {
      return;
    }

    setSubmitting(true);
    try {
      await rejectAdminAgentApplication(selectedAgent.application.applicationId, reviewNote);
      toast.success(`${selectedAgent.fullName} rejected`);
      await loadAgents();
      setSelectedAgent(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to reject this agent application.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: AdminAgentProfile['status']) => {
    if (!selectedAgent?.profile) {
      return;
    }

    setSubmitting(true);
    try {
      await updateAdminAgentStatus(selectedAgent.profile.agentUserId, status);
      toast.success(
        status === 'active'
          ? `${selectedAgent.fullName} reactivated`
          : `${selectedAgent.fullName} suspended`,
      );
      await loadAgents();
      setSelectedAgent(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to update agent status.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFloatUpdate = async () => {
    if (!selectedAgent?.profile) {
      return;
    }

    const nextFloat = Number.parseFloat(floatBalance);
    if (!Number.isFinite(nextFloat) || nextFloat < 0) {
      toast.error('Enter a valid non-negative float balance.');
      return;
    }

    setSubmitting(true);
    try {
      await updateAdminAgentFloat(selectedAgent.profile.agentUserId, nextFloat);
      toast.success('Agent float updated');
      await loadAgents();
      setSelectedAgent(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to update agent float.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Agent Management</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} agent records - {pendingCount} pending approval
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, phone, code, or location..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {['all', 'pending', 'active', 'suspended', 'rejected'].map(status => (
              <DropdownMenuItem
                key={status}
                className="capitalize"
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 font-medium text-muted-foreground">Agent</th>
                  <th className="hidden p-4 font-medium text-muted-foreground md:table-cell">Code</th>
                  <th className="hidden p-4 font-medium text-muted-foreground lg:table-cell">Location</th>
                  <th className="hidden p-4 font-medium text-muted-foreground md:table-cell">Tier</th>
                  <th className="hidden p-4 text-right font-medium text-muted-foreground lg:table-cell">Float</th>
                  <th className="p-4 text-right font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={7}>
                      Loading agents...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <TableEmptyStateRow
                    colSpan={7}
                    title="No agents to show"
                    description="No agents matched this filter yet. Try another status or search term."
                  />
                ) : (
                  filtered.map(item => {
                    const status = getItemStatus(item);
                    const tier = item.profile?.tier ?? 'basic';

                    return (
                      <tr
                        key={item.userId}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="p-4">
                          <p className="font-medium text-foreground">{item.fullName}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {item.profile?.agentCode ?? 'Pending code'} - {item.phoneNumber ?? 'No phone'}
                          </p>
                        </td>
                        <td className="hidden p-4 font-mono text-xs text-foreground md:table-cell">
                          {item.profile?.agentCode ?? 'Pending'}
                        </td>
                        <td className="hidden p-4 text-foreground lg:table-cell">{getLocation(item)}</td>
                        <td className="hidden p-4 md:table-cell">
                          <Badge
                            variant="outline"
                            className={`border-0 text-[10px] capitalize ${tierColor[tier]}`}
                          >
                            {tier}
                          </Badge>
                        </td>
                        <td className="hidden p-4 text-right font-medium text-foreground lg:table-cell">
                          {item.profile ? currency.format(item.profile.floatBalance) : '--'}
                        </td>
                        <td className="p-4 text-right">
                          <Badge
                            variant="outline"
                            className={`border-0 text-[10px] capitalize ${statusColor[status]}`}
                          >
                            {status}
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
                              <DropdownMenuItem onClick={() => setSelectedAgent(item)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {item.application?.status === 'pending' && (
                                <DropdownMenuItem
                                  className="text-success"
                                  onClick={() => setSelectedAgent(item)}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Approve / Reject
                                </DropdownMenuItem>
                              )}
                              {item.profile?.status === 'active' && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setSelectedAgent(item)}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend / Adjust Float
                                </DropdownMenuItem>
                              )}
                              {item.profile?.status === 'suspended' && (
                                <DropdownMenuItem
                                  className="text-success"
                                  onClick={() => setSelectedAgent(item)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Reactivate / Adjust Float
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agent Details</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Full Name', selectedAgent.fullName],
                  ['Phone', selectedAgent.phoneNumber ?? 'Not provided'],
                  ['Email', selectedAgent.email ?? 'Not provided'],
                  ['Role', selectedAgent.role],
                  ['State', getState(selectedAgent)],
                  ['Location', getLocation(selectedAgent)],
                  ['Status', getItemStatus(selectedAgent)],
                  ['Agent Code', selectedAgent.profile?.agentCode ?? 'Pending'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium capitalize text-foreground">{String(value)}</p>
                  </div>
                ))}
              </div>

              {selectedAgent.application?.idDocumentDataUrl && (
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">Uploaded ID document</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedAgent.application.idDocumentName ?? 'Applicant document'}
                  </p>
                  <Button variant="outline" className="mt-3" asChild>
                    <a href={selectedAgent.application.idDocumentDataUrl} target="_blank" rel="noreferrer">
                      <Eye className="mr-2 h-4 w-4" />
                      View document
                    </a>
                  </Button>
                </div>
              )}

              {selectedAgent.profile && (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold">Float Management</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floatBalance">Float Balance</Label>
                    <Input
                      id="floatBalance"
                      inputMode="decimal"
                      value={floatBalance}
                      onChange={event => setFloatBalance(event.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" disabled={submitting} onClick={() => void handleFloatUpdate()}>
                      Update Float
                    </Button>
                    <Button
                      variant={selectedAgent.profile.status === 'active' ? 'destructive' : 'default'}
                      disabled={submitting}
                      onClick={() =>
                        void handleStatusUpdate(
                          selectedAgent.profile?.status === 'active' ? 'suspended' : 'active',
                        )
                      }
                    >
                      {selectedAgent.profile.status === 'active' ? 'Suspend Agent' : 'Reactivate Agent'}
                    </Button>
                  </div>
                </div>
              )}

              {selectedAgent.application?.status === 'pending' && (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">Pending Application</p>
                  <div className="space-y-2">
                    <Label>Tier</Label>
                    <Select
                      value={approvalTier}
                      onValueChange={value => setApprovalTier(value as AdminAgentProfile['tier'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="super">Super</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewNote">Review Note</Label>
                    <Input
                      id="reviewNote"
                      placeholder="Optional for approval, required for rejection"
                      value={reviewNote}
                      onChange={event => setReviewNote(event.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button disabled={submitting} onClick={() => void handleApprove()}>
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={submitting || !reviewNote.trim()}
                      onClick={() => void handleReject()}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAgents;
