import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, CheckSquare, ChevronRight, Loader2, Mail, MessageSquare, Search, UserPlus, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { platformUsersKeys, searchPlatformUsers, type PlatformUserSearchResult } from '@/services/platformUsersApi';
import { getClics, getClic, clicsKeys } from '@/services/clicsApi';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/lib/api/http';

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
  actionLabel = 'Invite to Circle',
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

  // Import Clics Modal State
  const [isImportClicModalOpen, setIsImportClicModalOpen] = useState(false);
  const [selectedClicGroup, setSelectedClicGroup] = useState<any | null>(null);
  const [clicSearchInput, setClicSearchInput] = useState('');
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [invitedMemberIds, setInvitedMemberIds] = useState<Set<string>>(new Set());
  const [loadingGroupDetailId, setLoadingGroupDetailId] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query.trim());
  const trimmedQuery = query.trim();
  const canSearchPlatformUsers = deferredQuery.length >= 2 && !selectedUser;

  // Search Platform Users Query
  const usersQuery = useQuery({
    queryKey: platformUsersKeys.search(deferredQuery),
    queryFn: () => searchPlatformUsers(deferredQuery),
    enabled: canSearchPlatformUsers,
  });

  // Fetch Clics List Query
  const clicsListQuery = useQuery({
    queryKey: clicsKeys.list,
    queryFn: () => getClics(1, 10),
    enabled: isImportClicModalOpen,
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

  // Computed Clic groups for display from real backend API only
  const displayedClicGroups = useMemo(() => {
    const rawList = clicsListQuery.data ?? [];
    const q = clicSearchInput.trim().toLowerCase();

    return rawList.filter((group: any) =>
      !q || (group.name && group.name.toLowerCase().includes(q)) || (group.description && group.description.toLowerCase().includes(q))
    );
  }, [clicsListQuery.data, clicSearchInput]);

  // Computed members of selected Clic group
  const filteredGroupMembers = useMemo(() => {
    if (!selectedClicGroup) return [];
    const members = selectedClicGroup.members || [];
    const q = clicSearchInput.trim().toLowerCase();

    return members.filter((m: any) => {
      if (!q) return true;
      const name = (m.name || m.displayName || '').toLowerCase();
      const phone = (m.phone || m.phoneNumber || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [selectedClicGroup, clicSearchInput]);

  const handleInvite = async () => {
    if (!selectedUser) return;
    try {
      await onInvite(selectedUser);
      setSelectedUser(null);
      setQuery('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send invite.'));
    }
  };

  const handleContactInvite = async (channel: DirectInviteChannel) => {
    if (!onInviteContact || !trimmedQuery) return;
    try {
      await onInviteContact(trimmedQuery, channel);
      setQuery('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send invite.'));
    }
  };

  return (
    <>
      <Card className={cn('space-y-4 p-4', className)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsImportClicModalOpen(true);
              setSelectedClicGroup(null);
              setClicSearchInput('');
            }}
            className="h-9 px-3 gap-1.5 border-[#126989] bg-white text-[#126989] hover:bg-[#126989] hover:text-white font-bold text-xs shrink-0 shadow-sm transition-all"
          >
            <Users className="h-4 w-4" /> Import Clic
          </Button>
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

      {/* IMPORT FROM CLICS DIALOG MODAL */}
      <Dialog
        open={isImportClicModalOpen}
        onOpenChange={(open) => {
          setIsImportClicModalOpen(open);
          if (!open) {
            setSelectedClicGroup(null);
            setClicSearchInput('');
          }
        }}
      >
        <DialogContent className="w-[92%] max-w-[460px] rounded-3xl p-6 bg-card gap-4">
          {!selectedClicGroup ? (
            /* STEP 1: SELECT A CLIC GROUP */
            <>
              <DialogHeader className="text-left font-display">
                <DialogTitle className="text-lg font-bold text-foreground">Import from Clics</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Select a Clic group to view its members.
                </DialogDescription>
              </DialogHeader>

              {/* Search Box */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search Clic groups..."
                  value={clicSearchInput}
                  onChange={(e) => setClicSearchInput(e.target.value)}
                  className="pl-9 pr-8 h-10 rounded-xl text-xs"
                />
                {clicSearchInput && (
                  <button
                    type="button"
                    onClick={() => setClicSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Clic Groups List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {clicsListQuery.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    <p className="text-xs">Loading Clic groups...</p>
                  </div>
                ) : displayedClicGroups.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No Clics found.</p>
                ) : (
                  displayedClicGroups.map((group: any) => {
                    const groupId = group.id || group.clicId;
                    const isLoadingThisGroup = loadingGroupDetailId === groupId;

                    return (
                      <button
                        key={groupId}
                        type="button"
                        disabled={isLoadingThisGroup}
                        onClick={async () => {
                          setLoadingGroupDetailId(groupId);
                          try {
                            const detail = await getClic(groupId);
                            setSelectedClicGroup(detail || group);
                          } catch {
                            setSelectedClicGroup(group);
                          } finally {
                            setLoadingGroupDetailId(null);
                          }
                        }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border bg-background hover:border-accent transition-all text-left group shadow-sm disabled:opacity-60"
                      >
                        <div className="min-w-0 pr-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground text-xs truncate group-hover:text-accent transition-colors">
                              {group.name}
                            </p>
                            {group.role === 'admin' && (
                              <span className="text-[9px] font-extrabold bg-amber-500/15 text-amber-600 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">
                                Admin
                              </span>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-[11px] text-muted-foreground truncate">{group.description}</p>
                          )}
                          <p className="text-[10px] text-accent font-semibold">
                            {(group.members || []).length || group.memberCount || 0} Members
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-accent shrink-0">
                          {isLoadingThisGroup ? (
                            <Loader2 className="h-4 w-4 animate-spin text-accent" />
                          ) : (
                            <>
                              <span>View</span>
                              <ChevronRight className="h-4 w-4" />
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* STEP 2: VIEW MEMBERS & SELECT ALL / SELECT INDIVIDUALS */
            <>
              <DialogHeader className="text-left font-display">
                <div className="flex items-center justify-between gap-2 pr-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClicGroup(null);
                      setClicSearchInput('');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <span className="text-[10px] font-extrabold bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded-full uppercase">
                    {(selectedClicGroup.members || []).length} Members
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold text-foreground mt-2">{selectedClicGroup.name}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Select members below or use "Select All" to invite everyone in this Clic.
                </DialogDescription>
              </DialogHeader>

              {/* Action Bar: Select All & Search */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const members = selectedClicGroup.members || [];
                    if (members.length === 0) return;
                    setIsSelectingAll(true);
                    try {
                      for (const member of members) {
                        const userId = member.userId || member.id || member.memberId;
                        const fullName = member.name || member.displayName || 'Member';
                        const email = member.email || '';
                        const phoneNumber = member.phone || member.phoneNumber || '';
                        await onInvite({ userId, fullName, email, phoneNumber });
                        setInvitedMemberIds((prev) => new Set(prev).add(userId));
                      }
                      toast.success(`Invited all ${members.length} members from ${selectedClicGroup.name}!`);
                      setIsImportClicModalOpen(false);
                      setSelectedClicGroup(null);
                    } catch (err) {
                      toast.error(getApiErrorMessage(err, 'Failed to invite some members.'));
                    } finally {
                      setIsSelectingAll(false);
                    }
                  }}
                  disabled={isSelectingAll || (selectedClicGroup.members || []).length === 0}
                  className="h-9 px-3 gap-1.5 border-[#126989] bg-[#126989]/10 text-[#126989] hover:bg-[#126989]/20 font-bold text-xs shrink-0"
                >
                  <CheckSquare className="h-4 w-4" />
                  {isSelectingAll ? 'Inviting All...' : `Select All (${(selectedClicGroup.members || []).length})`}
                </Button>

                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search member..."
                    value={clicSearchInput}
                    onChange={(e) => setClicSearchInput(e.target.value)}
                    className="pl-8 pr-7 h-9 rounded-xl text-xs"
                  />
                  {clicSearchInput && (
                    <button
                      type="button"
                      onClick={() => setClicSearchInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Member List with Phone Numbers */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredGroupMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No members matched your search.</p>
                ) : (
                  filteredGroupMembers.map((member: any) => {
                    const memberId = member.userId || member.id || member.memberId;
                    const fullName = member.name || member.displayName || 'Member';
                    const email = member.email || '';
                    const phone = member.phone || member.phoneNumber || '';
                    const isAlreadyInvited = invitedMemberIds.has(memberId);

                    const isGroupAdmin = selectedClicGroup?.role === 'admin';
                    const displayEmail = isGroupAdmin ? email : (email && email.includes('@') ? `${email.split('@')[0]}@....` : '');
                    const displayPhone = isGroupAdmin ? phone : (phone ? '••••••••' : '');

                    return (
                      <div
                        key={memberId}
                        className="flex items-center justify-between p-3 rounded-2xl border border-border bg-background text-xs"
                      >
                        <div className="min-w-0 pr-2 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-foreground truncate">{fullName}</p>
                            {member.role === 'admin' && (
                              <span className="text-[9px] font-extrabold bg-amber-500/15 text-amber-600 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">
                                Admin
                              </span>
                            )}
                          </div>
                          {displayPhone && (
                            <p className="text-[11px] font-medium text-muted-foreground truncate">
                              Phone: <span className="text-foreground font-semibold">{displayPhone}</span>
                            </p>
                          )}
                          {displayEmail && (
                            <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
                          )}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          disabled={isAlreadyInvited}
                          onClick={async () => {
                            try {
                              await onInvite({ userId: memberId, fullName, email, phoneNumber: phone });
                              setInvitedMemberIds((prev) => new Set(prev).add(memberId));
                              toast.success(`Selected ${fullName}.`);
                            } catch (err) {
                              toast.error(getApiErrorMessage(err, 'Failed to send invite.'));
                            }
                          }}
                          className={cn(
                            'h-8 px-3 text-[10px] font-bold uppercase rounded-full shrink-0',
                            isAlreadyInvited ? 'bg-muted text-muted-foreground' : ''
                          )}
                        >
                          {isAlreadyInvited ? (
                            <>
                              <Check className="mr-1 h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-700">Added</span>
                            </>
                          ) : (
                            'Select'
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const formatNigerianPhoneNumber = (val: string): string => {
  let cleaned = val.trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+234')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('234') && cleaned.length > 10) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned.replace(/\D/g, '');
};

const isValidPhoneNumber = (value: string): boolean => {
  const normalized = formatNigerianPhoneNumber(value);
  return /^\d{11}$/.test(normalized);
};

export default PlatformUserInvitePicker;
