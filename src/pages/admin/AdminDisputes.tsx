import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, MoreHorizontal, Eye, CheckCircle, ArrowUpCircle, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { mockAdminDisputes, type AdminDispute } from '@/services/adminMockData';
import { toast } from 'sonner';

const AdminDisputes = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null);
  const [responseText, setResponseText] = useState('');

  const filtered = mockAdminDisputes.filter(d => {
    const matchesSearch = `${d.subject} ${d.userName} ${d.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || d.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statusColor: Record<string, string> = {
    open: 'bg-warning/10 text-warning',
    in_progress: 'bg-accent/10 text-accent',
    escalated: 'bg-destructive/10 text-destructive',
    resolved: 'bg-success/10 text-success',
  };

  const priorityColor: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-warning/10 text-warning',
    high: 'bg-destructive/20 text-destructive',
    critical: 'bg-destructive text-destructive-foreground',
  };

  const typeLabel: Record<string, string> = {
    failed_transaction: 'Failed Transaction',
    wrong_debit: 'Wrong Debit',
    fraud_report: 'Fraud Report',
    agent_complaint: 'Agent Complaint',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Disputes & Issues</h1>
        <p className="text-sm text-muted-foreground">{mockAdminDisputes.filter(d => d.status !== 'resolved').length} active disputes</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['open', 'in_progress', 'escalated', 'resolved'] as const).map(status => {
          const count = mockAdminDisputes.filter(d => d.status === status).length;
          return (
            <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}>
              <CardContent className="p-4">
                <Badge variant="outline" className={`border-0 text-[10px] mb-2 ${statusColor[status]}`}>{status.replace('_', ' ')}</Badge>
                <p className="text-2xl font-bold text-foreground">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search disputes..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" />{priorityFilter === 'all' ? 'Priority' : priorityFilter}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['all', 'low', 'medium', 'high', 'critical'].map(p => (
                <DropdownMenuItem key={p} onClick={() => setPriorityFilter(p)} className="capitalize">{p}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 font-medium text-muted-foreground">Subject</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell">User</th>
                  <th className="p-4 font-medium text-muted-foreground">Priority</th>
                  <th className="p-4 font-medium text-muted-foreground text-right hidden sm:table-cell">Amount</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Status</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(dispute => (
                  <tr key={dispute.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-foreground truncate max-w-[200px]">{dispute.subject}</p>
                      <p className="text-xs text-muted-foreground lg:hidden">{dispute.userName}</p>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{typeLabel[dispute.type]}</td>
                    <td className="p-4 text-foreground hidden lg:table-cell">{dispute.userName}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={`border-0 text-[10px] ${priorityColor[dispute.priority]}`}>{dispute.priority}</Badge>
                    </td>
                    <td className="p-4 text-right font-medium text-foreground hidden sm:table-cell">
                      {dispute.amount ? `₦${dispute.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[dispute.status]}`}>{dispute.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedDispute(dispute); setResponseText(''); }}><Eye className="mr-2 h-4 w-4" />View & Respond</DropdownMenuItem>
                          {dispute.status === 'open' && (
                            <DropdownMenuItem onClick={() => toast.success('Dispute assigned')}><Clock className="mr-2 h-4 w-4" />Assign to me</DropdownMenuItem>
                          )}
                          {dispute.status !== 'resolved' && dispute.status !== 'escalated' && (
                            <DropdownMenuItem onClick={() => toast.info('Dispute escalated')} className="text-destructive"><ArrowUpCircle className="mr-2 h-4 w-4" />Escalate</DropdownMenuItem>
                          )}
                          {dispute.status !== 'resolved' && (
                            <DropdownMenuItem onClick={() => toast.success('Dispute resolved')} className="text-success"><CheckCircle className="mr-2 h-4 w-4" />Mark Resolved</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{selectedDispute.subject}</p>
                  <p className="text-sm text-muted-foreground">{selectedDispute.userName} • {typeLabel[selectedDispute.type]}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={`border-0 text-[10px] ${priorityColor[selectedDispute.priority]}`}>{selectedDispute.priority}</Badge>
                  <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[selectedDispute.status]}`}>{selectedDispute.status.replace('_', ' ')}</Badge>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-foreground">{selectedDispute.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Amount</p>
                  <p className="font-medium text-foreground">{selectedDispute.amount ? `₦${selectedDispute.amount.toLocaleString()}` : 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Assigned To</p>
                  <p className="font-medium text-foreground">{selectedDispute.assignedTo || 'Unassigned'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground">{new Date(selectedDispute.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Last Updated</p>
                  <p className="font-medium text-foreground">{new Date(selectedDispute.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedDispute.status !== 'resolved' && (
                <div className="space-y-2">
                  <Textarea placeholder="Write a response or internal note..." value={responseText} onChange={e => setResponseText(e.target.value)} rows={3} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { toast.success('Response sent'); setSelectedDispute(null); }} disabled={!responseText.trim()}>Send Response</Button>
                    <Button size="sm" variant="outline" onClick={() => { toast.success('Dispute resolved'); setSelectedDispute(null); }}>Mark Resolved</Button>
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

export default AdminDisputes;
