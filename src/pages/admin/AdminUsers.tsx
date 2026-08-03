import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle, Eye, Filter, LoaderCircle, MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  adminUsersKeys,
  getAdminUsers,
  type AdminUserListItem,
  updateAdminUserStatus,
} from '@/services/adminUsersApi';

const statusColor: Record<string, string> = {
  active: 'bg-success/10 text-success',
  suspended: 'bg-destructive/10 text-destructive',
};

const roleColor: Record<string, string> = {
  user: 'bg-accent/10 text-accent',
  agent: 'bg-primary/10 text-primary',
  'super-admin': 'bg-warning/10 text-warning',
};

const kycColor: Record<string, string> = {
  none: 'bg-muted text-muted-foreground',
  basic: 'bg-accent/10 text-accent',
  verified: 'bg-success/10 text-success',
  premium: 'bg-primary/10 text-primary',
};

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const normalizeStatus = (user: AdminUserListItem) => (user.isActive ? 'active' : 'suspended');

const getDisplayEmail = (email: string) =>
  email.endsWith('@phone.ajovault.local') ? 'Not provided' : email;

const getInitials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'A';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);

  const usersQuery = useQuery({
    queryKey: adminUsersKeys.list(),
    queryFn: () => getAdminUsers(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateAdminUserStatus(userId, isActive),
    onSuccess: updatedUser => {
      setSelectedUser(current => (current?.userId === updatedUser.userId ? updatedUser : current));
      void queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
      toast.success(updatedUser.isActive ? 'User activated.' : 'User suspended.');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error, 'Unable to update the user status.'));
    },
  });

  const users = usersQuery.data?.items ?? [];

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter(user => {
      const matchesSearch = !term || [
        user.fullName,
        user.phoneNumber ?? '',
        getDisplayEmail(user.email),
        user.role,
      ].join(' ').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'all' || normalizeStatus(user) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, users]);

  const toggleUserStatus = (user: AdminUserListItem) => {
    updateStatusMutation.mutate({
      userId: user.userId,
      isActive: !user.isActive,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">
          {usersQuery.data?.totalCount ?? 0} registered users
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, or role..."
            className="pl-9"
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
            {(['all', 'active', 'suspended'] as const).map(status => (
              <DropdownMenuItem
                key={status}
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {usersQuery.isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading users...
          </CardContent>
        </Card>
      ) : null}

      {usersQuery.isError ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {getApiErrorMessage(usersQuery.error, 'Unable to load users.')}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 && !usersQuery.isLoading ? (
            <div className="p-4">
              <EmptyTableState
                title="No users to show"
                description="No users matched the current filters yet. Adjust the search or status filter to widen the result."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-4 font-medium text-muted-foreground">User</th>
                    <th className="hidden p-4 font-medium text-muted-foreground md:table-cell">Phone</th>
                    <th className="hidden p-4 font-medium text-muted-foreground lg:table-cell">Role</th>
                    <th className="hidden p-4 font-medium text-muted-foreground lg:table-cell">KYC</th>
                    <th className="hidden p-4 text-right font-medium text-muted-foreground sm:table-cell">Joined</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Status</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const status = normalizeStatus(user);

                    return (
                      <tr
                        key={user.userId}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-medium text-foreground">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{getDisplayEmail(user.email)}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{user.phoneNumber || 'No phone number'}</p>
                        </td>
                        <td className="hidden p-4 text-foreground md:table-cell">{user.phoneNumber || 'Not provided'}</td>
                        <td className="hidden p-4 lg:table-cell">
                          <Badge variant="outline" className={`border-0 text-[10px] ${roleColor[user.role] ?? roleColor.user}`}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="hidden p-4 lg:table-cell">
                          <Badge variant="outline" className={`border-0 text-[10px] ${kycColor[user.kycTier]}`}>
                            {user.kycTier}
                          </Badge>
                        </td>
                        <td className="hidden p-4 text-right text-foreground sm:table-cell">
                          {dateFormatter.format(new Date(user.createdAtUtc))}
                        </td>
                        <td className="p-4 text-right">
                          <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[status]}`}>
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
                              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {status === 'active' ? (
                                <DropdownMenuItem
                                  onClick={() => toggleUserStatus(user)}
                                  className="text-destructive"
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => toggleUserStatus(user)}
                                  className="text-success"
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {getInitials(selectedUser.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{selectedUser.fullName}</p>
                  <p className="truncate text-sm text-muted-foreground">{getDisplayEmail(selectedUser.email)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Phone', selectedUser.phoneNumber || 'Not provided'],
                  ['Role', selectedUser.role],
                  ['KYC Tier', selectedUser.kycTier],
                  ['Status', normalizeStatus(selectedUser)],
                  ['Joined', dateFormatter.format(new Date(selectedUser.createdAtUtc))],
                  ['Last login', selectedUser.lastLoginAtUtc ? dateFormatter.format(new Date(selectedUser.lastLoginAtUtc)) : 'Never'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium capitalize text-foreground">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
