import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, MoreHorizontal, Eye, Ban, CheckCircle, UserCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockAdminAgents, type AdminAgent } from '@/services/adminMockData';
import { toast } from 'sonner';

const AdminAgents = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<AdminAgent | null>(null);

  const filtered = mockAdminAgents.filter(a => {
    const matchesSearch = `${a.firstName} ${a.lastName} ${a.phone} ${a.agentCode} ${a.location}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColor: Record<string, string> = {
    active: 'bg-success/10 text-success',
    suspended: 'bg-destructive/10 text-destructive',
    pending: 'bg-warning/10 text-warning',
  };

  const tierColor: Record<string, string> = {
    basic: 'bg-muted text-muted-foreground',
    standard: 'bg-accent/10 text-accent',
    super: 'bg-primary/10 text-primary',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Agent Management</h1>
        <p className="text-sm text-muted-foreground">{mockAdminAgents.length} registered agents • {mockAdminAgents.filter(a => a.status === 'pending').length} pending approval</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, code, or location..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {['all', 'active', 'suspended', 'pending'].map(s => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="capitalize">{s}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 font-medium text-muted-foreground">Agent</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Code</th>
                  <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell">Location</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Tier</th>
                  <th className="p-4 font-medium text-muted-foreground text-right hidden sm:table-cell">Customers</th>
                  <th className="p-4 font-medium text-muted-foreground text-right hidden lg:table-cell">Commission</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Status</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(agent => (
                  <tr key={agent.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-foreground">{agent.firstName} {agent.lastName}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{agent.agentCode} • {agent.phone}</p>
                    </td>
                    <td className="p-4 font-mono text-xs text-foreground hidden md:table-cell">{agent.agentCode}</td>
                    <td className="p-4 text-foreground hidden lg:table-cell">{agent.location}</td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge variant="outline" className={`border-0 text-[10px] capitalize ${tierColor[agent.tier]}`}>{agent.tier}</Badge>
                    </td>
                    <td className="p-4 text-right text-foreground hidden sm:table-cell">{agent.totalCustomers}</td>
                    <td className="p-4 text-right font-medium text-foreground hidden lg:table-cell">₦{agent.commissionBalance.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[agent.status]}`}>{agent.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedAgent(agent)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                          {agent.status === 'pending' && (
                            <DropdownMenuItem onClick={() => toast.success(`${agent.firstName} approved`)} className="text-success"><UserCheck className="mr-2 h-4 w-4" />Approve</DropdownMenuItem>
                          )}
                          {agent.status === 'active' ? (
                            <DropdownMenuItem onClick={() => toast.success(`${agent.firstName} suspended`)} className="text-destructive"><Ban className="mr-2 h-4 w-4" />Suspend</DropdownMenuItem>
                          ) : agent.status === 'suspended' ? (
                            <DropdownMenuItem onClick={() => toast.success(`${agent.firstName} reactivated`)} className="text-success"><CheckCircle className="mr-2 h-4 w-4" />Reactivate</DropdownMenuItem>
                          ) : null}
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

      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agent Details</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-lg">
                  {selectedAgent.firstName[0]}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedAgent.firstName} {selectedAgent.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedAgent.agentCode}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Phone', selectedAgent.phone],
                  ['Location', selectedAgent.location],
                  ['State', selectedAgent.state],
                  ['Tier', selectedAgent.tier],
                  ['Status', selectedAgent.status],
                  ['Customers', selectedAgent.totalCustomers],
                  ['Transactions', selectedAgent.totalTransactions],
                  ['Commission', `₦${selectedAgent.commissionBalance.toLocaleString()}`],
                  ['Applied', new Date(selectedAgent.appliedAt).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground capitalize">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAgents;
