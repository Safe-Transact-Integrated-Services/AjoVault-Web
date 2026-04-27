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
  showDirectContactInvite = false,
  className,
  onInvite,
  onInviteContact,
}: PlatformUserInvitePickerProps) => {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<PlatformUserSearchResult | null>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const trimmedQuery = query.trim();
  const canSearchPlatformUsers = deferredQuery.length >= 2 && !selectedUser;

  const usersQuery = useQuery({
    queryKey: platformUsersKeys.search(deferredQuery),
    queryFn: () => searchPlatformUsers(deferredQuery),
    enabled: canSearchPlatformUsers,
  });

  const matchedUsers = usersQuery.data ?? [];
  const hasMatches = matchedUsers.length > 0;
  const canInviteDirectly = showDirectContactInvite
    && !!onInviteContact
    && !selectedUser
    && trimmedQuery.length >= 2
    && !usersQuery.isLoading
    && !hasMatches;
  const canInviteByEmail = canInviteDirectly && isValidEmail(trimmedQuery);
  const canInviteBySms = canInviteDirectly && isValidPhoneNumber(trimmedQuery);

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
    if (!onInviteContact || !trimmedQuery) {
      return;
    }

    try {
      await onInviteContact(trimmedQuery, channel);
      setQuery('');
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
          placeholder={showDirectContactInvite ? "Search AjoVault users or enter email/phone" : "Search by email or phone number"}
          className="h-12 pl-10"
          disabled={disabled || !!selectedUser}
        />
      </div>

      {!selectedUser && trimmedQuery.length < 2 && (
        <p className="text-xs text-muted-foreground">
          {showDirectContactInvite
            ? 'Enter at least 2 characters to search AjoVault users or invite a non-member.'
            : 'Enter at least 2 characters to search platform users.'}
        </p>
      )}

      {!selectedUser && canSearchPlatformUsers && usersQuery.isLoading && (
        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          Searching platform users...
        </div>
      )}

      {!selectedUser && hasMatches && (
        <div className="space-y-2">
          {matchedUsers.map(user => (
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

      {!selectedUser && canInviteDirectly && (canInviteByEmail || canInviteBySms) && (
        <div className="space-y-3 rounded-xl border border-dashed border-border p-3">
          <div>
            <p className="font-medium text-foreground">{directInviteTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{directInviteDescription}</p>
          </div>
          <div className="rounded-lg bg-background px-3 py-3 text-sm text-foreground">
            {trimmedQuery}
          </div>
          <div className={`grid gap-3 ${canInviteByEmail && canInviteBySms ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {canInviteByEmail && (
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2"
                disabled={disabled}
                onClick={() => handleContactInvite('email')}
              >
                <Mail className="h-4 w-4" /> Invite by Email
              </Button>
            )}
            {canInviteBySms && (
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2"
                disabled={disabled}
                onClick={() => handleContactInvite('sms')}
              >
                <MessageSquare className="h-4 w-4" /> Invite by SMS
              </Button>
            )}
          </div>
        </div>
      )}

      {!selectedUser && canSearchPlatformUsers && !usersQuery.isLoading && !hasMatches && !canInviteByEmail && !canInviteBySms && (
        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          No AjoVault user matched that search. Enter a valid email address or phone number to invite a non-member.
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
    </Card>
  );
};

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

export default PlatformUserInvitePicker;
