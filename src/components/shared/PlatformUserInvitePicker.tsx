import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, MessageSquare, Search, UserPlus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { platformUsersKeys, searchPlatformUsers, type PlatformUserSearchResult } from '@/services/platformUsersApi';

type DirectInviteChannel = 'email' | 'sms';

interface PlatformUserInvitePickerProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  disabled?: boolean;
  directInviteTitle?: string;
  directInviteDescription?: string;
  directInvitePlaceholder?: string;
  showDirectContactInvite?: boolean;
  className?: string;
  onInvite: (user: PlatformUserSearchResult) => Promise<void>;
  onInviteContact?: (contact: string, channel: DirectInviteChannel) => Promise<void>;
}

const PlatformUserInvitePicker = ({
  title = 'Invite Platform Users',
  description = 'Search by name, email, or phone number, then send an in-app invite.',
  actionLabel = 'Invite on AjoVault',
  disabled = false,
  directInviteTitle = 'Invite Non-Members',
  directInviteDescription = 'If the person is not on AjoVault yet, send an email or SMS invite.',
  directInvitePlaceholder = 'Enter email address or phone number',
  showDirectContactInvite = false,
  className,
  onInvite,
  onInviteContact,
}: PlatformUserInvitePickerProps) => {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<PlatformUserSearchResult | null>(null);
  const [contact, setContact] = useState('');
  const deferredQuery = useDeferredValue(query.trim());

  const usersQuery = useQuery({
    queryKey: platformUsersKeys.search(deferredQuery),
    queryFn: () => searchPlatformUsers(deferredQuery),
    enabled: deferredQuery.length >= 2 && !selectedUser,
  });

  const handleInvite = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      await onInvite(selectedUser);
      setSelectedUser(null);
      setQuery('');
    } catch {
      // Parent handles the visible error state.
    }
  };

  const handleContactInvite = async (channel: DirectInviteChannel) => {
    if (!onInviteContact || !contact.trim()) {
      return;
    }

    try {
      await onInviteContact(contact.trim(), channel);
      setContact('');
    } catch {
      // Parent handles the visible error state.
    }
  };

  return (
    <Card className={cn('space-y-4 p-4', className)}>
      <div>
        <h2 className="font-medium text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search by email or phone number"
          className="h-12 pl-10"
          disabled={disabled || !!selectedUser}
        />
      </div>

      {!selectedUser && deferredQuery.length < 2 && (
        <p className="text-xs text-muted-foreground">Enter at least 2 characters to search platform users.</p>
      )}

      {!selectedUser && deferredQuery.length >= 2 && usersQuery.isLoading && (
        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          Searching platform users...
        </div>
      )}

      {!selectedUser && deferredQuery.length >= 2 && !usersQuery.isLoading && (usersQuery.data?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          No platform user matched that search yet.
        </div>
      )}

      {!selectedUser && (usersQuery.data?.length ?? 0) > 0 && (
        <div className="space-y-2">
          {usersQuery.data!.map(user => (
            <button
              key={user.userId}
              type="button"
              onClick={() => setSelectedUser(user)}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-left transition-colors hover:border-accent"
              disabled={disabled}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{user.fullName}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {user.email && <Badge variant="secondary">{user.email}</Badge>}
                    {user.phoneNumber && <Badge variant="secondary">{user.phoneNumber}</Badge>}
                  </div>
                </div>
                <UserPlus className="mt-0.5 h-4 w-4 text-accent" />
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="space-y-3 rounded-xl border border-border bg-background p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{selectedUser.fullName}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {selectedUser.email && <Badge variant="secondary">{selectedUser.email}</Badge>}
                {selectedUser.phoneNumber && <Badge variant="secondary">{selectedUser.phoneNumber}</Badge>}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setSelectedUser(null);
                setQuery('');
              }}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="button"
            className="h-11 w-full"
            disabled={disabled}
            onClick={() => handleInvite()}
          >
            {actionLabel}
          </Button>
        </div>
      )}

      {showDirectContactInvite && onInviteContact && (
        <div className="space-y-3 rounded-xl border border-dashed border-border p-3">
          <div>
            <p className="font-medium text-foreground">{directInviteTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{directInviteDescription}</p>
          </div>
          <Input
            value={contact}
            onChange={event => setContact(event.target.value)}
            placeholder={directInvitePlaceholder}
            className="h-12"
            disabled={disabled}
          />
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2"
              disabled={disabled || !contact.trim()}
              onClick={() => handleContactInvite('email')}
            >
              <Mail className="h-4 w-4" /> Invite by Email
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2"
              disabled={disabled || !contact.trim()}
              onClick={() => handleContactInvite('sms')}
            >
              <MessageSquare className="h-4 w-4" /> Invite by SMS
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PlatformUserInvitePicker;
