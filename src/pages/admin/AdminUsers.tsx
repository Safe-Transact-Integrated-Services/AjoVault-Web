import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, MoreHorizontal, Eye, Ban, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockAdminUsers, type AdminUser } from '@/services/adminMockData';
import { toast } from 'sonner';

const AdminUsers = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filtered = mockAdminUsers.filter(u => {
    const matchesSearch = `${u.firstName} ${u.lastName} ${u.phone} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColor: Record<string, string> = {
    active: 'bg-success/10 text-success',
    suspended: 'bg-destructive/10 text-destructive',
    flagged: 'bg-warning/10 text-warning',
  };

  const kycColor: Record<string, string> = {
    none: 'bg-muted text-muted-foreground',
    basic: 'bg-accent/10 text-accent',
    verified: 'bg-success/10 text-success',
    premium: 'bg-primary/10 text-primary',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">{mockAdminUsers.length} registered users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, or email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {['all', 'active', 'suspended', 'flagged'].map(s => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="capitalize">{s}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 font-medium text-muted-foreground">User</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                  <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell">KYC</th>
                  <th className="p-4 font-medium text-muted-foreground text-right hidden sm:table-cell">Balance</th>
                  <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell text-right">Credit Score</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Status</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{user.phone}</p>
                    </td>
                    <td className="p-4 text-foreground hidden md:table-cell">{user.phone}</td>
                    <td className="p-4 hidden lg:table-cell">
                      <Badge variant="outline" className={`border-0 text-[10px] ${kycColor[user.kycTier]}`}>{user.kycTier}</Badge>
                    </td>
                    <td className="p-4 text-right font-medium text-foreground hidden sm:table-cell">₦{user.walletBalance.toLocaleString()}</td>
                    <td className="p-4 text-right text-foreground hidden lg:table-cell">{user.creditScore}</td>
                    <td className="p-4 text-right">
                      <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[user.status]}`}>{user.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedUser(user)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                          {user.status === 'active' ? (
                            <DropdownMenuItem onClick={() => toast.success(`${user.firstName} suspended`)} className="text-destructive"><Ban className="mr-2 h-4 w-4" />Suspend</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => toast.success(`${user.firstName} activated`)} className="text-success"><CheckCircle className="mr-2 h-4 w-4" />Activate</DropdownMenuItem>
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

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {selectedUser.firstName[0]}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Phone', selectedUser.phone],
                  ['KYC Tier', selectedUser.kycTier],
                  ['Status', selectedUser.status],
                  ['Credit Score', selectedUser.creditScore],
                  ['Balance', `₦${selectedUser.walletBalance.toLocaleString()}`],
                  ['Transactions', selectedUser.totalTransactions],
                  ['Joined', new Date(selectedUser.joinedAt).toLocaleDateString()],
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

export default AdminUsers;
