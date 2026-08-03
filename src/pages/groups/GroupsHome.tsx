import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  ChevronDown,
  UserPlus,
  TrendingUp,
  PiggyBank,
  Search,
  Play,
  Bell,
  X,
  ChevronLeft,
  CheckCircle2,
  Trash2,
  Pencil,
  Copy,
  Link,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api/http';
import { getClics, getClic, createClic, updateClic, deleteClic, addClicMember, updateClicMember, updateClicMembersBatch, createClicInvitation, resendClicInvitation, acceptClicInvitation, rejectClicInvitation, removeClicMember, removeClicInvitation, getMyClicInvitations, clicsKeys } from '@/services/clicsApi';
import type { ClicInvitationItem } from '@/services/clicsApi';
import { searchPlatformUsers } from '@/services/platformUsersApi';
import { EmptyTableState } from '@/components/shared/EmptyTableState';

// Self-contained helpers
const formatCurrency = (amount: number, currency: string = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getMemberStatus = (status?: string) => (status || 'active').trim().toLowerCase();

const getMemberStatusLabel = (status?: string) => {
  const normalized = getMemberStatus(status);
  if (normalized === 'pending') return 'Pending Invite';
  if (normalized === 'removed') return 'Removed';
  return 'Joined';
};

const getMemberStatusClassName = (status?: string) => {
  const normalized = getMemberStatus(status);
  if (normalized === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (normalized === 'removed') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const getActiveMemberCount = (members: Array<{ status?: string }> = []) =>
  members.filter(member => getMemberStatus(member.status) === 'active').length;

const getInvitationStatusClassName = (status?: string) => {
  const normalized = (status || 'pending').trim().toLowerCase();
  if (normalized === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (normalized === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

interface GroupMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contact?: string;
  role: 'admin' | 'member';
  status?: 'active' | 'pending' | 'removed' | string;
  hasPaid: boolean;
  payoutPosition: number;
}

interface GroupInvitation {
  id: string;
  inviteeName: string;
  email?: string;
  phone?: string;
  inviteeContact?: string;
  channel: 'platform' | 'email' | 'sms';
  status: 'pending' | 'accepted' | 'rejected';
  reinviteCount: number;
  createdAt: string;
}

interface GroupNotification {
  id: string;
  groupId: string;
  groupName: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'invite';
  createdAt: string;
  read: boolean;
  amount?: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  creatorName?: string;
  description?: string;
  resolved?: boolean;
  actionStatus?: 'accepted' | 'rejected' | null;
}

interface Group {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  role: 'admin' | 'member';
  nextContributionDate: string;
  nextPayoutDate: string;
  status: 'active' | 'pending' | 'completed';
  createdAt: string;
  members: GroupMember[];
}

const initialGroups: Group[] = [
  {
    id: 'grp_001',
    name: 'Youth Empowerment Club',
    description: 'Empowerment club supporting local youth startups.',
    amount: 0,
    currency: 'NGN',
    frequency: 'weekly',
    memberCount: 5,
    maxMembers: 10,
    currentCycle: 2,
    totalCycles: 10,
    role: 'admin',
    nextContributionDate: '2026-07-25',
    nextPayoutDate: '2026-07-28',
    status: 'active',
    createdAt: '2026-07-01',
    members: [
      { id: 'm1', name: 'Adaeze Okafor', email: 'adaeze@email.com', phone: '+234 802 111 2222', contact: 'adaeze@email.com', role: 'admin', hasPaid: true, payoutPosition: 1 },
      { id: 'm2', name: 'Chidi N.', email: 'chidi@email.com', phone: '+234 803 222 3333', contact: 'chidi@email.com', role: 'member', hasPaid: true, payoutPosition: 2 },
      { id: 'm3', name: 'Funke A.', email: 'funke@email.com', phone: '+234 804 333 4444', contact: 'funke@email.com', role: 'member', hasPaid: false, payoutPosition: 3 },
      { id: 'm4', name: 'Ibrahim M.', email: 'ibrahim@email.com', phone: '+234 805 444 5555', contact: 'ibrahim@email.com', role: 'member', hasPaid: true, payoutPosition: 4 },
      { id: 'm5', name: 'Ngozi E.', email: 'ngozi@email.com', phone: '+234 806 555 6666', contact: 'ngozi@email.com', role: 'member', hasPaid: false, payoutPosition: 5 },
    ]
  },
  {
    id: 'grp_002',
    name: 'Tech Founders Cooperative',
    description: 'Cooperative for shared dev server infrastructure.',
    amount: 0,
    currency: 'NGN',
    frequency: 'monthly',
    memberCount: 4,
    maxMembers: 8,
    currentCycle: 1,
    totalCycles: 8,
    role: 'member',
    nextContributionDate: '2026-08-01',
    nextPayoutDate: '2026-08-05',
    status: 'active',
    createdAt: '2026-07-15',
    members: [
      { id: 'm10', name: 'Yusuf K.', email: 'yusuf@email.com', phone: '+234 812 345 6789', contact: 'yusuf@email.com', role: 'admin', hasPaid: true, payoutPosition: 1 },
      { id: 'm11', name: 'Adaeze Okafor', email: 'adaeze@email.com', phone: '+234 802 111 2222', contact: 'adaeze@email.com', role: 'member', hasPaid: true, payoutPosition: 2 },
      { id: 'm12', name: 'Chidi N.', email: 'chidi@email.com', phone: '+234 803 222 3333', contact: 'chidi@email.com', role: 'member', hasPaid: true, payoutPosition: 3 },
      { id: 'm13', name: 'Zainab B.', email: 'zainab@email.com', phone: '+234 807 666 7777', contact: 'zainab@email.com', role: 'member', hasPaid: false, payoutPosition: 4 },
    ]
  },
  {
    id: 'grp_003',
    name: 'Lagos Investment Circle',
    description: 'Circle for mutual support, discussion, and real estate networking.',
    amount: 0,
    currency: 'NGN',
    frequency: 'monthly',
    memberCount: 3,
    maxMembers: 12,
    currentCycle: 0,
    totalCycles: 12,
    role: 'admin',
    nextContributionDate: '2026-08-10',
    nextPayoutDate: '2026-08-15',
    status: 'pending',
    createdAt: '2026-07-20',
    members: [
      { id: 'm20', name: 'Adaeze Okafor', email: 'adaeze@email.com', phone: '+234 802 111 2222', contact: 'adaeze@email.com', role: 'admin', hasPaid: false, payoutPosition: 1 },
      { id: 'm21', name: 'Chinedu O.', email: 'chinedu@email.com', phone: '+234 808 777 8888', contact: 'chinedu@email.com', role: 'member', hasPaid: false, payoutPosition: 2 },
      { id: 'm22', name: 'Tunde W.', email: 'tunde@email.com', phone: '+234 809 888 9999', contact: 'tunde@email.com', role: 'member', hasPaid: false, payoutPosition: 3 },
    ]
  }
];

const initialNotifications: GroupNotification[] = [
  {
    id: 'nt_inv_1',
    groupId: 'none',
    groupName: 'Lagos Techies Circle',
    message: 'Chidi N. invited you to join Lagos Techies Circle',
    type: 'invite',
    createdAt: '2026-07-21T01:10:00Z',
    read: false,
    amount: 0,
    frequency: 'monthly',
    creatorName: 'Chidi N.',
    description: 'A circle of engineers saving for standard certifications.',
    resolved: false,
    actionStatus: null,
  },
  {
    id: 'nt_inv_2',
    groupId: 'none',
    groupName: 'Ibadan Agribusiness Group',
    message: 'Kemi A. invited you to join Ibadan Agribusiness Group',
    type: 'invite',
    createdAt: '2026-07-21T01:12:00Z',
    read: false,
    amount: 0,
    frequency: 'weekly',
    creatorName: 'Kemi A.',
    description: 'Weekly ajo contributions for buying wholesale fertilizers.',
    resolved: false,
    actionStatus: null,
  },
  {
    id: 'nt_1',
    groupId: 'grp_001',
    groupName: 'Youth Empowerment Club',
    message: 'Yusuf K. rejected your invitation to join the Group.',
    type: 'warning',
    createdAt: '2026-07-19T10:16:00Z',
    read: true,
  },
  {
    id: 'nt_2',
    groupId: 'grp_001',
    groupName: 'Youth Empowerment Club',
    message: 'Ibrahim M. accepted your invitation and has joined the Group.',
    type: 'success',
    createdAt: '2026-07-20T14:32:00Z',
    read: true,
  },
  {
    id: 'nt_3',
    groupId: 'grp_002',
    groupName: 'Tech Founders Cooperative',
    message: 'Funke A. accepted your invitation and joined the Group.',
    type: 'success',
    createdAt: '2026-07-20T11:02:00Z',
    read: true,
  },
  {
    id: 'nt_4',
    groupId: 'grp_003',
    groupName: 'Lagos Investment Circle',
    message: 'Tunde W. joined the circle.',
    type: 'success',
    createdAt: '2026-07-20T08:00:00Z',
    read: true,
  },
  {
    id: 'nt_5',
    groupId: 'grp_003',
    groupName: 'Lagos Investment Circle',
    message: 'Welcome to the Lagos Investment Circle! Admin setup is complete.',
    type: 'info',
    createdAt: '2026-07-20T07:30:00Z',
    read: true,
  }
];

interface PhoneContact {
  name: string;
  contact: string;
  circleName?: string;
  adminOf?: string;
  role?: 'admin' | 'member';
}

const mockPhoneContacts: PhoneContact[] = [
  { name: 'Chinedu O.', contact: 'chinedu@email.com', circleName: 'Youth Empowerment Club', adminOf: 'Youth Empowerment Club (Circle)', role: 'admin' },
  { name: 'Tunde W.', contact: 'tunde@email.com', circleName: 'Tech Founders Cooperative', adminOf: 'Tech Founders Cooperative (Circle)', role: 'admin' },
  { name: 'Zainab B.', contact: 'zainab@email.com', circleName: 'Youth Empowerment Club', role: 'member' },
  { name: 'Bisi A.', contact: 'bisi@email.com', circleName: 'Lagos Investment Circle', adminOf: 'Lagos Real Estate Fund (Group Goal)', role: 'admin' },
  { name: 'Kunle S.', contact: '+234 803 111 2222', circleName: 'Tech Founders Cooperative', role: 'member' },
  { name: 'Halima F.', contact: 'halima@email.com', circleName: 'Youth Empowerment Club', adminOf: 'Youth Tech Hub (Group Goal)', role: 'admin' },
];

const GroupsHome = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const clicsQuery = useQuery({
    queryKey: clicsKeys.list,
    queryFn: () => getClics(1, 10),
    retry: 1,
  });

  const clicDetailQuery = useQuery({
    queryKey: clicsKeys.detail(selectedGroupId ?? ''),
    queryFn: () => getClic(selectedGroupId!),
    enabled: !!selectedGroupId,
    retry: 1,
  });

  const receivedInvitationsQuery = useQuery({
    queryKey: ['clic-invitations-me'],
    queryFn: getMyClicInvitations,
    retry: 1,
  });

  const groups = useMemo(() => {
    return (clicsQuery.data as unknown as Group[]) || [];
  }, [clicsQuery.data]);

  // Filtering & searching states
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'member' | 'invitations'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Central Notification state
  const [notifications, setNotifications] = useState<GroupNotification[]>(initialNotifications);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAllNotifsDialogOpen, setIsAllNotifsDialogOpen] = useState(false);

  // Group Details - Members tabs ('accepted' vs 'invitations')
  const [detailsTab, setDetailsTab] = useState<'accepted' | 'invitations'>('accepted');

  // Contact Picker dialog modal
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  // Member editing modal states
  const [editingMember, setEditingMember] = useState<{ id: string; groupId: string; name: string; email: string; phone: string; type: 'member' | 'invite' } | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Remove confirmation modal states
  const [removingItem, setRemovingItem] = useState<{ id: string; altId?: string; groupId: string; name: string; type: 'member' | 'invite' } | null>(null);

  // Create Group Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupAmount, setNewGroupAmount] = useState('');
  const [newGroupFreq, setNewGroupFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [newGroupMaxMembers, setNewGroupMaxMembers] = useState('10');

  // Group creation members state
  const [addedGroupMembers, setAddedGroupMembers] = useState<Array<{ name: string; contact: string; email?: string; phone?: string }>>([]);
  const [isGroupContactDialogOpen, setIsGroupContactDialogOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  // Platform User Import Modal states
  const [importSearchInput, setImportSearchInput] = useState('');
  const [selectedImportClicGroup, setSelectedImportClicGroup] = useState<any | null>(null);
  const [loadingImportGroupId, setLoadingImportGroupId] = useState<string | null>(null);



  // Derive receivedInvites dynamically from unresolved invite notifications
  const receivedInvites = useMemo(() => {
    return notifications.filter(n => n.type === 'invite' && !n.resolved);
  }, [notifications]);

  // Invitation Maps
  const [invitationsMap, setInvitationsMap] = useState<Record<string, GroupInvitation[]>>({
    'grp_001': [
      { id: 'inv_1', inviteeName: 'Ibrahim M.', email: 'ibrahim@email.com', phone: '+234 805 444 5555', inviteeContact: 'ibrahim@email.com', channel: 'email', status: 'accepted', reinviteCount: 1, createdAt: '2026-07-20T14:30:00Z' },
      { id: 'inv_2', inviteeName: 'Yusuf K.', email: 'yusuf@email.com', phone: '+234 812 345 6789', inviteeContact: '+234 812 345 6789', channel: 'sms', status: 'rejected', reinviteCount: 2, createdAt: '2026-07-19T10:15:00Z' },
      { id: 'inv_3', inviteeName: 'Ngozi E.', email: 'ngozi@email.com', phone: '+234 806 555 6666', inviteeContact: 'ngozi@email.com', channel: 'platform', status: 'pending', reinviteCount: 1, createdAt: '2026-07-21T08:00:00Z' },
    ],
    'grp_002': [
      { id: 'inv_4', inviteeName: 'Funke A.', email: 'funke@email.com', phone: '+234 804 333 4444', inviteeContact: 'funke@email.com', channel: 'platform', status: 'accepted', reinviteCount: 1, createdAt: '2026-07-20T11:00:00Z' },
      { id: 'inv_5', inviteeName: 'Yusuf K.', email: 'yusuf@email.com', phone: '+234 812 345 6789', inviteeContact: 'yusuf@email.com', channel: 'email', status: 'rejected', reinviteCount: 1, createdAt: '2026-07-21T09:12:00Z' },
      { id: 'inv_6', inviteeName: 'Ngozi E.', email: 'ngozi@email.com', phone: '+234 806 555 6666', inviteeContact: 'ngozi@email.com', channel: 'platform', status: 'pending', reinviteCount: 1, createdAt: '2026-07-21T08:00:00Z' },
    ]
  });

  // Invitation Form input states
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');

  // Expanded members & invitations inline state & pending card edits state
  const [expandedMembersMap, setExpandedMembersMap] = useState<Record<string, ClicMemberDetail[]>>({});
  const [expandedInvitationsMap, setExpandedInvitationsMap] = useState<Record<string, any[]>>({});
  const [loadingMembersMap, setLoadingMembersMap] = useState<Record<string, boolean>>({});
  const [hasPendingEditsMap, setHasPendingEditsMap] = useState<Record<string, boolean>>({});
  const [pendingMemberEditsMap, setPendingMemberEditsMap] = useState<Record<string, Record<string, { displayName?: string; email?: string; phoneNumber?: string }>>>({});
  const [isSavingCardMap, setIsSavingCardMap] = useState<Record<string, boolean>>({});

  // Unsaved edits confirmation modal state & navigation protection
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  const unsavedGroupId = useMemo(() => {
    return Object.keys(hasPendingEditsMap).find(id => !!hasPendingEditsMap[id]) || null;
  }, [hasPendingEditsMap]);

  const handleProtectedAction = (action: () => void) => {
    if (unsavedGroupId) {
      setPendingNavigationAction(() => action);
    } else {
      action();
    }
  };

  const handleDiscardPendingEdits = (groupId: string) => {
    setHasPendingEditsMap(prev => ({ ...prev, [groupId]: false }));
    setPendingMemberEditsMap(prev => ({ ...prev, [groupId]: {} }));
    queryClient.invalidateQueries({ queryKey: clicsKeys.all });
  };

  // Prevent accidental tab close/refresh if there are unsaved member edits
  useEffect(() => {
    const hasUnsaved = !!unsavedGroupId;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedGroupId]);

  const toggleExpand = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const willExpand = !expandedGroups[id];

    setExpandedGroups(prev => ({
      ...prev,
      [id]: willExpand,
    }));

    if (willExpand) {
      setLoadingMembersMap(prev => ({ ...prev, [id]: true }));
      try {
        const detail = await getClic(id);
        if (detail) {
          if (Array.isArray(detail.members)) {
            setExpandedMembersMap(prev => ({ ...prev, [id]: detail.members }));
          }
          if (Array.isArray(detail.invitations)) {
            setExpandedInvitationsMap(prev => ({ ...prev, [id]: detail.invitations }));
          }
        }
      } catch {
        // Error handling
      } finally {
        setLoadingMembersMap(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  const selectedGroup = useMemo(() => {
    if (clicDetailQuery.data) {
      return clicDetailQuery.data as unknown as Group;
    }
    return groups.find(g => g.id === selectedGroupId || (g as any).clicId === selectedGroupId) || null;
  }, [groups, selectedGroupId, clicDetailQuery.data]);

  // Initializing maps for newly created groups
  useEffect(() => {
    if (selectedGroupId && !invitationsMap[selectedGroupId]) {
      setInvitationsMap(prev => ({
        ...prev,
        [selectedGroupId]: []
      }));
    }
  }, [selectedGroupId]);

  // Filter & Sort computation
  const filteredGroups = useMemo(() => {
    let list = [...groups];

    if (activeTab === 'admin') {
      list = list.filter(g => g.role === 'admin');
    } else if (activeTab === 'member') {
      list = list.filter(g => g.role === 'member');

    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'pool_high') {
        return (b.amount * b.maxMembers) - (a.amount * a.maxMembers);
      }
      return 0;
    });

    return list;
  }, [groups, activeTab, search, sortBy]);

  const filteredReceivedInvitations = useMemo(() => {
    const list = [...(receivedInvitationsQuery.data || [])];
    const query = search.trim().toLowerCase();
    const filtered = query
      ? list.filter(invitation =>
          (invitation.groupName || invitation.clicName || '').toLowerCase().includes(query)
          || (invitation.inviterName || '').toLowerCase().includes(query)
          || invitation.status.toLowerCase().includes(query))
      : list;

    return filtered.sort((a, b) => {
      const aDate = new Date(a.createdAtUtc || a.createdAt || '').getTime();
      const bDate = new Date(b.createdAtUtc || b.createdAt || '').getTime();
      if (sortBy === 'oldest') {
        return aDate - bDate;
      }
      if (sortBy === 'alphabetical') {
        return (a.groupName || a.clicName || '').localeCompare(b.groupName || b.clicName || '');
      }
      return bDate - aDate;
    });
  }, [receivedInvitationsQuery.data, search, sortBy]);


  // Handle creation of a new group from form modal
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name.');
      return;
    }

    try {
      const newClic = await createClic({
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || undefined,
      });

      const newClicId = newClic?.id || newClic?.clicId;
      if (newClicId && addedGroupMembers.length > 0) {
        for (const member of addedGroupMembers) {
          const emailVal = member.email || (member.contact.includes('@') ? member.contact : undefined);
          const phoneVal = member.phone || (!member.contact.includes('@') ? member.contact : undefined);
          const primaryContact = emailVal || phoneVal || member.contact;
          const channel = emailVal ? 'email' : 'sms';

          let platformUserId: string | undefined = undefined;
          try {
            const matches = await searchPlatformUsers(primaryContact);
            const userMatch = matches.find(
              u => (emailVal && u.email && u.email.toLowerCase() === emailVal.toLowerCase()) ||
                   (phoneVal && u.phoneNumber && u.phoneNumber.replace(/\s+/g, '') === phoneVal.replace(/\s+/g, ''))
            );
            if (userMatch) {
              platformUserId = userMatch.userId;
            }
          } catch {
            // Ignore search error
          }

          try {
            await createClicInvitation(newClicId, {
              platformUserId,
              displayName: member.name,
              memberContact: primaryContact,
              email: emailVal,
              phoneNumber: phoneVal,
              channel,
            });
          } catch (err) {
            console.error('Failed to send invitation to member:', member.name, err);
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
      if (newClicId) {
        setSelectedGroupId(newClicId);
      }
      setIsCreateModalOpen(false);

      // Reset Form Fields
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupAmount('');
      setNewGroupFreq('weekly');
      setNewGroupMaxMembers('10');
      setAddedGroupMembers([]);

      toast.success(`Clic "${newGroupName.trim()}" created successfully! Invitations sent.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create Clic. Please try again.'));
    }
  };

  // Edit Clic Modal states
  const [isEditClicModalOpen, setIsEditClicModalOpen] = useState(false);
  const [editClicName, setEditClicName] = useState('');
  const [editClicDesc, setEditClicDesc] = useState('');
  const [isUpdatingClic, setIsUpdatingClic] = useState(false);

  const handleOpenEditClic = (group: Group) => {
    setEditClicName(group.name || '');
    setEditClicDesc(group.description || '');
    setIsEditClicModalOpen(true);
  };

  const handleUpdateClic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !editClicName.trim()) {
      toast.error('Please enter a Clic name.');
      return;
    }

    try {
      setIsUpdatingClic(true);
      await updateClic(selectedGroupId, {
        name: editClicName.trim(),
        description: editClicDesc.trim(),
      });

      await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
      setIsEditClicModalOpen(false);
      toast.success('Clic updated successfully!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update Clic. Please try again.'));
    } finally {
      setIsUpdatingClic(false);
    }
  };

  // Delete Clic Modal states
  const [isDeleteClicConfirmOpen, setIsDeleteClicConfirmOpen] = useState(false);
  const [isDeletingClic, setIsDeletingClic] = useState(false);

  const handleDeleteClic = async () => {
    if (!selectedGroupId) return;

    try {
      setIsDeletingClic(true);
      await deleteClic(selectedGroupId);

      await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
      setIsDeleteClicConfirmOpen(false);
      setSelectedGroupId(null);
      toast.success('Clic deleted successfully!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete Clic. Please try again.'));
    } finally {
      setIsDeletingClic(false);
    }
  };

  // Duplicate existing group
  const handleDuplicateGroup = (group: Group) => {
    setNewGroupName(`${group.name} Copy`);
    setNewGroupDesc(group.description);
    setNewGroupAmount(group.amount.toString());
    setNewGroupFreq(group.frequency);
    setNewGroupMaxMembers(group.maxMembers.toString());
    setIsCreateModalOpen(true);
    toast.info('Autofilled form with previous clic data.');
  };

  // Add Member / Send invite from Contacts list
  const handleSelectContact = async (contact: PhoneContact) => {
    if (!selectedGroupId || !selectedGroup) return;

    const trimmedContact = contact.contact.trim();
    const isEmail = trimmedContact.includes('@');

    try {
      await createClicInvitation(selectedGroupId, {
        displayName: contact.name,
        memberContact: trimmedContact,
        email: isEmail ? trimmedContact : undefined,
        phoneNumber: !isEmail ? trimmedContact : undefined,
        channel: 'platform',
      });

      await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
      setIsContactDialogOpen(false);
      toast.success(`Invitation sent to ${contact.name}!`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send invitation to contact.'));
    }
  };

  // Edit member or invite details
  const triggerEditMember = (item: any, type: 'member' | 'invite', groupId?: string) => {
    const targetGroupId = groupId || selectedGroupId;
    if (!targetGroupId) return;

    const name = type === 'member' ? item.name : item.inviteeName;
    const rawContact = type === 'member' ? item.contact : item.inviteeContact;

    const email = item.email || (rawContact && rawContact.includes('@') ? rawContact : '');
    const phone = item.phone || (rawContact && (rawContact.includes('+') || rawContact.match(/\d/)) ? rawContact : '');

    setEditingMember({
      id: item.id,
      groupId: targetGroupId,
      name,
      email,
      phone,
      type,
    });
    setEditName(name || '');
    setEditEmail(email || '');
    setEditPhone(phone || '');
  };

  const handleDoneModalEdit = () => {
    if (!editingMember) return;
    const targetGroupId = editingMember.groupId;
    if (!targetGroupId) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error('Full Name is required.');
      return;
    }

    const trimmedEmail = editEmail.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const trimmedPhone = editPhone.trim();
    if (trimmedPhone && !isValidPhone(trimmedPhone)) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    if (editingMember.type === 'member') {
      const memberId = editingMember.id;

      // 1. Update local display members map immediately
      setExpandedMembersMap(prev => ({
        ...prev,
        [targetGroupId]: (prev[targetGroupId] || []).map(m =>
          (m.id === memberId || m.memberId === memberId)
            ? {
              ...m,
              name: trimmedName,
              displayName: trimmedName,
              email: trimmedEmail,
              phone: trimmedPhone,
              phoneNumber: trimmedPhone,
            }
            : m
        )
      }));

      // 2. Queue pending edit payload for this group
      setPendingMemberEditsMap(prev => ({
        ...prev,
        [targetGroupId]: {
          ...(prev[targetGroupId] || {}),
          [memberId]: {
            displayName: trimmedName,
            email: trimmedEmail || undefined,
            phoneNumber: trimmedPhone || undefined,
          }
        }
      }));

      // 3. Mark card as having pending edits (changes button from "View Details" to "Save Changes")
      setHasPendingEditsMap(prev => ({
        ...prev,
        [targetGroupId]: true,
      }));

      toast.info("Member updated locally. Click 'Save Changes' on the card to persist.");
    } else {
      const primaryContact = trimmedEmail || trimmedPhone || '';
      setInvitationsMap(prev => ({
        ...prev,
        [targetGroupId]: (prev[targetGroupId] || []).map(inv =>
          (inv.id === editingMember.id || inv.invitationId === editingMember.id) ? {
            ...inv,
            inviteeName: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            inviteeContact: primaryContact
          } : inv
        )
      }));
      toast.success('Invitation details updated.');
    }

    setEditingMember(null);
  };

  // Save changes for a Clic card when "Save Changes" is clicked on the card
  const handleSaveCardChanges = async (targetGroupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pendingEdits = pendingMemberEditsMap[targetGroupId] || {};
    const memberIds = Object.keys(pendingEdits);

    if (memberIds.length === 0) {
      setHasPendingEditsMap(prev => ({ ...prev, [targetGroupId]: false }));
      return;
    }

    setIsSavingCardMap(prev => ({ ...prev, [targetGroupId]: true }));

    try {
      const batchPayload = memberIds.map(id => ({
        memberId: id,
        ...pendingEdits[id],
      }));

      try {
        await updateClicMembersBatch(targetGroupId, { members: batchPayload });
      } catch {
        // Fallback to individual member updates
        for (const memberId of memberIds) {
          try {
            await updateClicMember(targetGroupId, memberId, pendingEdits[memberId]);
          } catch {
            // Graceful fallback
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: clicsKeys.all });

      setPendingMemberEditsMap(prev => ({ ...prev, [targetGroupId]: {} }));
      setHasPendingEditsMap(prev => ({ ...prev, [targetGroupId]: false }));

      toast.success('Clic member changes saved successfully!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save changes.'));
    } finally {
      setIsSavingCardMap(prev => ({ ...prev, [targetGroupId]: false }));
    }
  };

  // Remove member or invite (with confirmation prompt)
  const triggerRemoveItem = (item: any, type: 'member' | 'invite', groupId?: string) => {
    const targetGroupId = groupId || selectedGroupId;
    if (!targetGroupId) return;

    const primaryId = type === 'member'
      ? (item.memberId || item.clicMemberId || item.id || item.userId)
      : (item.invitationId || item.id);
    const secondaryId = type === 'member'
      ? (item.userId || item.platformUserId || item.id)
      : undefined;

    setRemovingItem({
      id: primaryId,
      altId: secondaryId !== primaryId ? secondaryId : undefined,
      groupId: targetGroupId,
      name: type === 'member' ? (item.name || item.displayName || 'Member') : (item.inviteeName || 'Invitee'),
      type,
    });
  };

  const handleConfirmRemove = async () => {
    if (!removingItem) return;
    const targetGroupId = removingItem.groupId;

    try {
      if (removingItem.type === 'member') {
        try {
          await removeClicMember(targetGroupId, removingItem.id);
        } catch (err) {
          if (isApiError(err) && err.status === 404 && removingItem.altId && removingItem.altId !== removingItem.id) {
            await removeClicMember(targetGroupId, removingItem.altId);
          } else {
            throw err;
          }
        }
        setExpandedMembersMap(prev => ({
          ...prev,
          [targetGroupId]: (prev[targetGroupId] || []).filter(m =>
            (m.id || m.memberId) !== removingItem.id &&
            (!removingItem.altId || (m.id || m.memberId || m.userId) !== removingItem.altId)
          )
        }));
        await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
        toast.success(`Removed member ${removingItem.name} from Clic.`);
      } else {
        try {
          await removeClicInvitation(targetGroupId, removingItem.id);
        } catch {
          // Fallback gracefully if invitation endpoint fails
        }
        setInvitationsMap(prev => ({
          ...prev,
          [targetGroupId]: (prev[targetGroupId] || []).filter(inv => (inv.id || inv.invitationId) !== removingItem.id)
        }));
        await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
        toast.success(`Cancelled invitation request to ${removingItem.name}.`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Failed to remove ${removingItem.name}.`));
    } finally {
      setRemovingItem(null);
    }
  };

  // Accept pending invitation received
  const handleAcceptInvite = async (invite: GroupNotification) => {
    try {
      if (invite.clicId && (invite.invitationId || invite.id)) {
        await acceptClicInvitation(invite.clicId, invite.invitationId || invite.id);
      }
      await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
      setNotifications(prev => prev.map(nt =>
        nt.id === invite.id
          ? { ...nt, resolved: true, actionStatus: 'accepted' as const, read: true, message: `You accepted the invitation to join "${invite.groupName}".` }
          : nt
      ));
      toast.success(`Joined "${invite.groupName}" successfully!`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to accept invitation.'));
    }
  };

  const handleAcceptReceivedInvitation = async (invitation: ClicInvitationItem) => {
    try {
      await acceptClicInvitation(invitation.clicId, invitation.invitationId || invitation.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clicsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['clic-invitations-me'] }),
      ]);
      toast.success(`Joined "${invitation.groupName || invitation.clicName || 'Clic'}" successfully!`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to accept invitation.'));
    }
  };

  // Reject pending invitation received
  const handleRejectInvite = async (invite: GroupNotification) => {
    try {
      if (invite.clicId && (invite.invitationId || invite.id)) {
        await rejectClicInvitation(invite.clicId, invite.invitationId || invite.id);
      }
      await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
      setNotifications(prev => prev.map(nt =>
        nt.id === invite.id
          ? { ...nt, resolved: true, actionStatus: 'rejected' as const, read: true, message: `You declined the invitation to join "${invite.groupName}".` }
          : nt
      ));
      toast.info(`Declined invitation to join "${invite.groupName}".`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to decline invitation.'));
    }
  };

  const handleRejectReceivedInvitation = async (invitation: ClicInvitationItem) => {
    try {
      await rejectClicInvitation(invitation.clicId, invitation.invitationId || invitation.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clicsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['clic-invitations-me'] }),
      ]);
      toast.info(`Declined invitation to join "${invitation.groupName || invitation.clicName || 'Clic'}".`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to decline invitation.'));
    }
  };

  const isValidEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const formatNigerianPhoneNumber = (val: string): string => {
    let cleaned = val.trim().replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+234')) {
      cleaned = '0' + cleaned.slice(4);
    } else if (cleaned.startsWith('234') && cleaned.length > 10) {
      cleaned = '0' + cleaned.slice(3);
    }
    return cleaned.replace(/\D/g, '');
  };

  const isValidPhone = (val: string): boolean => {
    const normalized = formatNigerianPhoneNumber(val);
    return /^\d{11}$/.test(normalized);
  };

  // Send invitation request to Clic participant via channel
  // Send invitation request to Clic participant
  const handleSendInvite = async (targetGroupId?: string | React.FormEvent, e?: React.FormEvent) => {
    if (targetGroupId && typeof (targetGroupId as any).preventDefault === 'function') {
      (targetGroupId as React.FormEvent).preventDefault();
      targetGroupId = undefined;
    } else if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const groupId = (typeof targetGroupId === 'string' ? targetGroupId : null) || selectedGroupId;
    if (!groupId) return;

    const trimmedName = inviteName.trim();
    if (!trimmedName) {
      toast.error("Please enter the participant's name.");
      return;
    }

    const trimmedEmail = inviteEmail.trim();
    const trimmedPhone = invitePhone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      toast.error('Please enter an email address or phone number.');
      return;
    }

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (trimmedPhone && !isValidPhone(trimmedPhone)) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    const primaryContact = trimmedEmail || trimmedPhone;
    const channel = trimmedEmail ? 'email' : 'sms';

    let matchedPlatformUserId: string | undefined = undefined;
    try {
      const searchResults = await searchPlatformUsers(primaryContact);
      const matchedUser = searchResults.find(
        u => (trimmedEmail && u.email && u.email.toLowerCase() === trimmedEmail.toLowerCase()) ||
          (trimmedPhone && u.phoneNumber && u.phoneNumber.replace(/\s+/g, '') === trimmedPhone.replace(/\s+/g, ''))
      );
      if (matchedUser) {
        matchedPlatformUserId = matchedUser.userId;
      }
    } catch {
      // Proceed with contact details if search fails
    }

    try {
      await createClicInvitation(groupId, {
        platformUserId: matchedPlatformUserId,
        displayName: trimmedName,
        memberContact: primaryContact,
        email: trimmedEmail || undefined,
        phoneNumber: trimmedPhone || undefined,
        channel: channel,
      });

      await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
      try {
        const updatedDetail = await getClic(groupId);
        if (updatedDetail && Array.isArray(updatedDetail.invitations)) {
          setExpandedInvitationsMap(prev => ({ ...prev, [groupId]: updatedDetail.invitations }));
        }
      } catch {
        // Fallback
      }
      toast.success(`Invitation sent to "${trimmedName}"!`);
      setInviteName('');
      setInviteEmail('');
      setInvitePhone('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send invitation.'));
    }
  };

  // Resend or re-create invitation request for participant
  const handleReinvite = async (target: any, groupId?: string) => {
    if (!target) return;
    const inv = typeof target === 'object' ? target : { id: target, invitationId: target };
    const targetGroupId = groupId || inv.clicId || selectedGroupId;
    if (!targetGroupId) return;

    const invitationId = inv.id || inv.invitationId;
    const reinviteCount = inv.reinviteCount ?? inv.reInvitesCount ?? 0;

    if (inv.status === 'pending') {
      return;
    }

    if (reinviteCount >= 2) {
      toast.error("Maximum reinvite attempts (3/3) reached for this participant.");
      return;
    }

    try {
      if (inv.status === 'rejected') {
        let targetPlatformUserId = inv.platformUserId || inv.invitedUserId;
        const lookupQuery = inv.email && inv.email !== 'N/A' ? inv.email : inv.phone && inv.phone !== 'N/A' ? inv.phone : inv.inviteeName;

        if (!targetPlatformUserId && lookupQuery && lookupQuery !== 'N/A') {
          try {
            const searchResults = await searchPlatformUsers(lookupQuery);
            const matchedUser = searchResults.find(
              u => (u.email && inv.email && u.email.toLowerCase() === inv.email.toLowerCase()) ||
                (u.phoneNumber && inv.phone && u.phoneNumber.replace(/\s+/g, '') === inv.phone.replace(/\s+/g, '')) ||
                (u.fullName && inv.inviteeName && u.fullName.toLowerCase() === inv.inviteeName.toLowerCase())
            ) || searchResults[0];

            if (matchedUser) {
              targetPlatformUserId = matchedUser.userId;
            }
          } catch {
            // Ignore search error
          }
        }

        // Backend restricts /resend endpoint to PENDING status only; re-create invitation for REJECTED invites
        await createClicInvitation(targetGroupId, {
          platformUserId: targetPlatformUserId,
          displayName: inv.inviteeName || inv.displayName || 'Invitee',
          memberContact: inv.memberContact || inv.inviteeContact || inv.email || inv.phone || '',
          email: inv.email && inv.email !== 'N/A' ? inv.email : undefined,
          phoneNumber: inv.phone && inv.phone !== 'N/A' ? inv.phone : undefined,
          channel: inv.channel || 'platform',
        });
        toast.success(`Invitation re-sent to "${inv.inviteeName || 'Invitee'}"!`);
      } else {
        await resendClicInvitation(targetGroupId, invitationId);
        toast.success('Invitation resent successfully!');
      }
      await queryClient.invalidateQueries({ queryKey: clicsKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['clic-invitations-me'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to reinvite participant.'));
    }
  };

  const handleDismissNotification = (notifId: string) => {
    setNotifications(prev => prev.filter(nt => nt.id !== notifId));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(nt => ({ ...nt, read: true })));
    toast.success('All notifications marked as read.');
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(nt => !nt.read).length;
  }, [notifications]);

  return (
    <div className="px-4 py-6 safe-top pb-24 max-w-2xl mx-auto">
      {!selectedGroupId ? (
        /* Left Pane: Groups List */
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Clics</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage contribution clics and invitation requests.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Create Group Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground shadow-sm transition-all hover:bg-accent/90"
              >
                <Plus className="h-4 w-4" /> Create Clic
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground mt-1">{groups.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Admin</p>
              <p className="text-lg font-bold text-accent mt-1">
                {groups.filter(g => g.role === 'admin').length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Joined</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{groups.filter(g => g.role === 'member').length}</p>
            </div>
          </div>


          {/* Filter Tabs */}
          <div className="flex border-b border-border w-full justify-between pb-0.5">
            {['all', 'admin', 'member', 'invitations'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  handleProtectedAction(() => setActiveTab(tab as any));
                }}
                className={`flex-1 text-center pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 capitalize ${activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab === 'member' ? 'Member' : tab === 'invitations' ? 'Invitations' : tab}
              </button>
            ))}
          </div>

          {/* Search Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={activeTab === 'invitations' ? 'Search invitations...' : 'Search clics...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <SelectTrigger className="h-10 w-[120px] rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground transition-all shrink-0">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl border border-border bg-popover shadow-xl min-w-[140px]">
                <SelectItem value="newest" className="text-xs font-semibold cursor-pointer">Newest</SelectItem>
                <SelectItem value="oldest" className="text-xs font-semibold cursor-pointer">Oldest</SelectItem>
                <SelectItem value="alphabetical" className="text-xs font-semibold cursor-pointer">A-Z Name</SelectItem>
                <SelectItem value="pool_high" className="text-xs font-semibold cursor-pointer">Pool Size</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Groups Listing */}
          <div className="space-y-3">
            {activeTab === 'invitations' ? (
              receivedInvitationsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  <span>Loading invitations...</span>
                </div>
              ) : filteredReceivedInvitations.length === 0 ? (
                <EmptyTableState
                  title="No invitations received"
                  description="Clic invitations sent to you will appear here."
                />
              ) : (
                filteredReceivedInvitations.map(invitation => {
                  const invitationId = invitation.invitationId || invitation.id;
                  const clicName = invitation.groupName || invitation.clicName || 'Clic';
                  const isPending = invitation.status === 'pending';

                  return (
                    <div key={invitationId} className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/40 hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                              <Bell className="h-5 w-5 text-accent" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="truncate font-bold text-foreground">{clicName}</h4>
                              <p className="text-xs text-muted-foreground">
                                {invitation.inviterName ? `${invitation.inviterName} invited you` : 'Invitation received'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                            <span>{formatDate(invitation.createdAtUtc || invitation.createdAt || '')}</span>
                            <span className={`rounded-full border px-2 py-0.5 uppercase tracking-wide ${getInvitationStatusClassName(invitation.status)}`}>
                              {invitation.status}
                            </span>
                          </div>
                        </div>

                        {isPending && (
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-xl border-rose-200 bg-rose-50 px-3 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                              onClick={() => handleRejectReceivedInvitation(invitation)}
                            >
                              Decline
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 rounded-xl bg-accent px-3 text-[10px] font-bold text-accent-foreground hover:bg-accent/90"
                              onClick={() => handleAcceptReceivedInvitation(invitation)}
                            >
                              Accept
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            ) : filteredGroups.length === 0 ? (
              <EmptyTableState
                title="No clics found"
                description="Create a clic or accept an invitation to get started."
              />
            ) : (
              filteredGroups.map((group, idx) => {
                const groupKey = group.id || (group as any).clicId || (group as any).groupId || `clic_${idx}`;
                const isExpanded = activeTab === 'invites' ? true : !!expandedGroups[groupKey];
                const isSelected = selectedGroupId === groupKey || selectedGroupId === group.id;
                const percent = Math.round((group.currentCycle / group.totalCycles) * 100) || 0;

                return (
                  <div
                    key={groupKey}
                    onClick={() => handleProtectedAction(() => setSelectedGroupId(groupKey))}
                    className={`group w-full rounded-2xl border p-4 text-left transition-all hover:shadow-md cursor-pointer ${isSelected
                      ? 'border-accent bg-accent/5 ring-1 ring-accent'
                      : 'border-border bg-card hover:border-accent/40'
                      }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                          <Users className="h-5 w-5 text-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-foreground group-hover:text-accent transition-colors truncate">
                            {group.name}
                          </h4>
                          {group.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{group.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => toggleExpand(groupKey, e)}
                          className="p-1.5 hover:bg-muted rounded-full transition-colors shrink-0"
                        >
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 14 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-border/50 pt-3.5 space-y-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Expanded Card Content: Members Table */}
                          <div className="max-h-[245px] overflow-y-auto overflow-x-auto rounded-xl border border-border bg-card [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                              <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm text-[10px] font-bold uppercase text-muted-foreground border-b border-border z-10">
                                  <tr>
                                    <th className="p-2.5">Name</th>
                                    {group.role === 'admin' && (
                                      <>
                                        <th className="p-2.5">Email</th>
                                        <th className="p-2.5">Phone Number</th>
                                        <th className="p-2.5">Status</th>
                                        <th className="p-2.5 text-right">Actions</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                  {(() => {
                                    const targetId = group.id || (group as any).clicId || groupKey;
                                    const isMemberLoading = !!loadingMembersMap[targetId];
                                    const currentMembers = (expandedMembersMap[targetId] && expandedMembersMap[targetId].length > 0 ? expandedMembersMap[targetId] : null) ||
                                      (clicDetailQuery.data && (clicDetailQuery.data.id === targetId || clicDetailQuery.data.clicId === targetId) && clicDetailQuery.data.members && clicDetailQuery.data.members.length > 0 ? clicDetailQuery.data.members : null) ||
                                      (group.members && group.members.length > 0 ? group.members : []);

                                    if (isMemberLoading) {
                                      return (
                                        <tr>
                                          <td colSpan={group.role === 'admin' ? 5 : 1} className="p-4 text-center text-xs text-muted-foreground">
                                            <div className="flex items-center justify-center gap-2 py-2">
                                              <Loader2 className="h-4 w-4 animate-spin text-accent" />
                                              <span>Loading members...</span>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    }

                                    if (currentMembers.length === 0) {
                                      return (
                                        <tr>
                                          <td colSpan={group.role === 'admin' ? 5 : 1} className="p-4 text-center text-xs text-muted-foreground">
                                            No members listed for this clic.
                                          </td>
                                        </tr>
                                      );
                                    }

                                    const sortedCurrentMembers = [...currentMembers].sort((a: any, b: any) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0));
                                    return sortedCurrentMembers.map((m: any) => {
                                      const emailStr = m.email || (m.contact?.includes('@') ? m.contact : 'N/A');
                                      const phoneStr = m.phone || m.phoneNumber || (m.contact && (m.contact.includes('+') || m.contact.match(/\d/)) ? m.contact : 'N/A');
                                      const displayName = m.name || m.displayName || 'Member';
                                      const statusLabel = getMemberStatusLabel(m.status);

                                      return (
                                        <tr key={m.id || m.memberId || displayName} className="hover:bg-muted/30 transition-colors">
                                          <td className="p-2.5 font-bold text-foreground">
                                            <div className="flex items-center gap-1.5">
                                              <span>{displayName}</span>
                                              {m.role === 'admin' && (
                                                <span className="text-[8px] bg-[#126989]/15 text-[#126989] px-1.5 py-0.5 rounded font-extrabold uppercase">
                                                  Admin
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          {group.role === 'admin' && (
                                            <>
                                              <td className="p-2.5 text-muted-foreground">{formatEmailForDisplay(emailStr)}</td>
                                              <td className="p-2.5 text-muted-foreground">{phoneStr}</td>
                                              <td className="p-2.5">
                                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getMemberStatusClassName(m.status)}`}>
                                                  {statusLabel}
                                                </span>
                                              </td>
                                              <td className="p-2.5 text-right">
                                                {m.role !== 'admin' && (
                                                  <div className="flex items-center justify-end gap-1">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        triggerEditMember(m, 'member', group.id);
                                                      }}
                                                      className="p-1 hover:text-accent rounded-full hover:bg-muted"
                                                      title="Edit member details"
                                                    >
                                                      <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        triggerRemoveItem(m, 'member', group.id);
                                                      }}
                                                      className="p-1 hover:text-destructive rounded-full hover:bg-muted"
                                                      title="Remove member"
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                  </div>
                                                )}
                                              </td>
                                            </>
                                          )}
                                        </tr>
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                          </div>

                          {(() => {
                            const targetId = group.id || (group as any).clicId || groupKey;
                            const hasEdits = !!hasPendingEditsMap[targetId] || !!hasPendingEditsMap[group.id];
                            const isSaving = !!isSavingCardMap[targetId] || !!isSavingCardMap[group.id];

                            if (hasEdits) {
                              return (
                                <Button
                                  className="w-full mt-2 h-9 text-xs font-bold bg-accent text-accent-foreground shadow-sm transition-all hover:bg-accent/90"
                                  disabled={isSaving}
                                  onClick={(e) => handleSaveCardChanges(targetId, e)}
                                >
                                  {isSaving ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      <span>Saving Changes...</span>
                                    </div>
                                  ) : (
                                    'Save Changes'
                                  )}
                                </Button>
                              );
                            }

                            return (
                              <Button
                                className="w-full mt-2 h-9 text-xs font-bold bg-accent text-accent-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProtectedAction(() => setSelectedGroupId(targetId));
                                }}
                              >
                                View Details
                              </Button>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Right Pane: Selected Group Details */
        <div className="w-full max-w-lg mx-auto">
          <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-md space-y-6">

            {/* Back to list & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleProtectedAction(() => setSelectedGroupId(null))}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex items-center gap-2">
                {selectedGroup && selectedGroup.role === 'admin' && (
                  <>
                    <button
                      onClick={() => handleOpenEditClic(selectedGroup)}
                      className="h-8 px-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-semibold transition-all shrink-0 shadow-sm flex items-center gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit Clic
                    </button>
                    <button
                      onClick={() => setIsDeleteClicConfirmOpen(true)}
                      className="h-8 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-all shrink-0 shadow-sm flex items-center gap-1.5"
                      title="Delete Clic"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete
                    </button>
                  </>
                )}
                {selectedGroup && selectedGroup.role === 'admin' && (
                  <button
                    onClick={() => handleDuplicateGroup(selectedGroup)}
                    className="h-8 px-3.5 rounded-xl border border-[#126989]/30 text-[#126989] hover:bg-[#126989]/5 text-xs font-bold transition-all shrink-0 shadow-sm"
                  >
                    Duplicate Clic
                  </button>
                )}
              </div>
            </div>

            {clicDetailQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <span>Loading clic details...</span>
              </div>
            ) : !selectedGroup ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Select a group from the list to view members and invite requests.
              </div>
            ) : (
              <>
                {/* Group Core Metadata */}
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-xl font-bold text-foreground">{selectedGroup.name}</h2>
                    <Badge variant="secondary" className={selectedGroup.role === 'admin' ? 'bg-[#126989]/10 text-[#126989]' : 'bg-muted text-muted-foreground'}>
                      {selectedGroup.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{selectedGroup.description}</p>
                </div>

                {/* Member Lists & Invitations Tab Switcher */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between border-b border-border pb-2 gap-2">
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => setDetailsTab('accepted')}
                        className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${detailsTab === 'accepted' ? 'border-[#126989] text-[#126989]' : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        Members ({selectedGroup.memberCount ?? getActiveMemberCount(selectedGroup.members || [])})
                      </button>
                      {selectedGroup.role === 'admin' && (
                        <button
                          onClick={() => setDetailsTab('invitations')}
                          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${detailsTab === 'invitations' ? 'border-[#126989] text-[#126989]' : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          Invitations ({(selectedGroup as any).invitations?.length ?? invitationsMap[selectedGroupId]?.length ?? 0})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content under Accepted tab */}
                  {detailsTab === 'accepted' && (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {(selectedGroup.members || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No members listed yet.</p>
                      ) : (
                        [...(selectedGroup.members || [])].sort((a: any, b: any) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0)).map((member: any) => {
                          const displayEmail = member.email || (member.contact?.includes('@') ? member.contact : 'N/A');
                          const displayPhone = member.phone || member.phoneNumber || (member.contact && (member.contact.includes('+') || member.contact.match(/\d/)) ? member.contact : 'N/A');
                          const displayName = member.name || member.displayName || 'Member';
                          const memberStatus = getMemberStatus(member.status);
                          const StatusIcon = memberStatus === 'pending' ? Clock : CheckCircle2;

                          return (
                            <div key={member.id || member.memberId} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-muted-foreground">Name:</span>
                                  <span className="font-bold text-foreground">{displayName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="font-semibold text-muted-foreground">Email:</span>
                                  <span className="text-foreground">{selectedGroup.role === 'admin' ? displayEmail : '••••••••'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="font-semibold text-muted-foreground">Phone:</span>
                                  <span className="text-foreground">{selectedGroup.role === 'admin' ? displayPhone : '••••••••'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getMemberStatusClassName(member.status)}`}>
                                  <StatusIcon className="h-3.5 w-3.5" /> {getMemberStatusLabel(member.status)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Content under Invite Participant tab: Only Invitation Form */}
                  {selectedGroup.role === 'admin' && detailsTab === 'invitations' && (
                    <div className="space-y-4">
                      {/* Sending invitations form */}
                      <form onSubmit={handleSendInvite} className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invite Participant</p>
                        <div className="flex flex-col gap-3">
                          <Input
                            placeholder="Name"
                            value={inviteName}
                            onChange={e => setInviteName(e.target.value)}
                            className="h-10 text-xs rounded-xl w-full block"
                          />
                          <Input
                            placeholder="Email Address"
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            className="h-10 text-xs rounded-xl w-full block"
                          />
                          <Input
                            placeholder="Phone Number"
                            type="tel"
                            value={invitePhone}
                            onChange={e => setInvitePhone(e.target.value)}
                            className="h-10 text-xs rounded-xl w-full block"
                          />
                        </div>
                        <div className="flex justify-end pt-1">
                          <Button type="submit" size="sm" className="h-10 text-xs font-bold px-6 shrink-0 bg-accent text-accent-foreground rounded-xl w-full sm:w-auto">
                            Send Invitation
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* CREATE / DUPLICATE GROUP DIALOG MODAL FORM */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-[92%] max-w-[450px] rounded-3xl p-6 gap-5 bg-card">
          <DialogHeader className="text-left font-display">
            <DialogTitle className="text-xl font-bold text-foreground">Create New Clic</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Start a new peer-to-peer contribution group with custom contribution details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGroup} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clic Name</label>
              <Input
                placeholder="e.g. Lagos Investors Guild"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="h-11 rounded-xl text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
              <Input
                placeholder="e.g. A community group for friends"
                value={newGroupDesc}
                onChange={e => setNewGroupDesc(e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Add Members</label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupContactDialogOpen(true)}
                  className="text-xs h-9 font-bold flex-1 flex items-center justify-center gap-1.5 border border-[#126989]/30 text-[#126989] hover:bg-[#126989]/5 rounded-xl transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Import Platform Users
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(true)}
                  className="text-xs h-9 font-bold flex-1 flex items-center justify-center gap-1.5 border border-[#126989]/30 text-[#126989] hover:bg-[#126989]/5 rounded-xl transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Add non-platform users
                </button>
              </div>

              {/* Displaying selected members list */}
              {addedGroupMembers.length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto bg-muted/20 p-2.5 rounded-xl border border-border">
                  {addedGroupMembers.map((m, idx) => {
                    const displayContact = m.email && m.phone
                      ? `${m.email} • ${m.phone}`
                      : m.email || m.phone || formatEmailForDisplay(m.contact);

                    return (
                      <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-card rounded-xl border border-border shadow-sm">
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{displayContact}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAddedGroupMembers(prev => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setAddedGroupMembers([]);
                }}
                className="h-11 flex-1 rounded-xl font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 flex-1 rounded-xl font-bold bg-accent text-accent-foreground"
              >
                Create Clic
              </Button>
            </div>

          </form>
        </DialogContent>
      </Dialog>



      {/* MEMBER / INVITATION EDIT DIALOG MODAL */}
      <Dialog open={editingMember !== null} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="w-[90%] max-w-[400px] rounded-3xl p-6 bg-card gap-4">
          <DialogHeader className="text-left font-display">
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingMember?.type === 'member' ? 'Edit Member Details' : 'Edit Invite Details'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update full name, email address, or phone number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Full Name"
                className="h-11 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <Input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-11 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
              <Input
                type="tel"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+234 812 345 6789"
                className="h-11 rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingMember(null)}
                className="h-10 flex-1 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDoneModalEdit}
                className="h-10 flex-1 rounded-xl text-xs font-bold bg-accent text-accent-foreground"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MEMBER / INVITATION REMOVE CONFIRMATION DIALOG */}
      <Dialog open={removingItem !== null} onOpenChange={(open) => !open && setRemovingItem(null)}>
        <DialogContent className="w-[90%] max-w-[400px] rounded-3xl p-6 bg-card gap-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto mb-1">
            <Trash2 className="h-5 w-5" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-lg font-bold text-foreground">Remove from Clic</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to remove <strong className='font-semibold text-black'>{removingItem?.name}</strong>? This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setRemovingItem(null)}
              className="h-11 flex-1 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRemove}
              className="h-11 flex-1 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/95"
            >
              Yes, Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* UNSAVED MEMBER EDITS WARNING DIALOG MODAL */}
      <Dialog
        open={pendingNavigationAction !== null}
        onOpenChange={(open) => !open && setPendingNavigationAction(null)}
      >
        <DialogContent className="w-[90%] max-w-[420px] rounded-3xl p-6 bg-card gap-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mx-auto mb-1">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-lg font-bold text-foreground">Unsaved Member Edits</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have unsaved changes to member details in this Clic. If you leave without saving, your changes will be lost.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 mt-2">
            <Button
              onClick={async (e) => {
                if (unsavedGroupId) {
                  await handleSaveCardChanges(unsavedGroupId, e);
                }
                const action = pendingNavigationAction;
                setPendingNavigationAction(null);
                if (action) action();
              }}
              className="h-11 w-full rounded-xl text-xs font-bold bg-accent text-accent-foreground shadow-sm"
            >
              Save & Continue
            </Button>
            <Button
              variant="outline"
              onClick={() => setPendingNavigationAction(null)}
              className="h-10 w-full rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ALL NOTIFICATIONS CENTER DIALOG MODAL */}
      <Dialog open={isAllNotifsDialogOpen} onOpenChange={setIsAllNotifsDialogOpen}>
        <DialogContent className="w-[92%] max-w-[500px] rounded-3xl p-6 bg-card gap-4">
          <DialogHeader className="text-left font-display">
            <div className="flex items-center justify-between gap-3 pr-8 mt-5">
              <DialogTitle className="text-lg font-bold text-foreground">Notification</DialogTitle>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-[#126989] hover:underline font-bold"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Review all system activity logs and group invitation requests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No notifications found.</p>
            ) : (
              notifications.map(nt => {
                const isInvite = nt.type === 'invite';
                const isResolved = nt.resolved;

                return (
                  <div
                    key={nt.id}
                    className={`p-3 rounded-2xl border transition-all text-xs ${nt.read ? 'bg-card border-border' : 'bg-accent/5 border-accent/20'
                      }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{nt.groupName}</span>
                          {!nt.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{nt.message}</p>

                        {/* Show action status or action buttons if it is an invite */}
                        {isInvite && (
                          <div className="mt-3">
                            {isResolved ? (
                              <div className="flex items-center gap-1.5">
                                {nt.actionStatus === 'accepted' ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold py-0.5 px-2 rounded-md">
                                    Joined Group
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold py-0.5 px-2 rounded-md">
                                    Declined
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectInvite(nt)}
                                  className="h-8 px-4 rounded-lg border border-[#126989]/30 text-[#126989] hover:bg-[#126989]/5 transition-colors font-bold text-[10px] uppercase"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleAcceptInvite(nt)}
                                  className="h-8 px-4 rounded-lg bg-[#126989] text-white hover:bg-[#126989]/90 transition-colors font-bold text-[10px] uppercase"
                                >
                                  Accept
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(nt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => handleDismissNotification(nt.id)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                          title="Dismiss notification"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* GROUP CREATION: IMPORT FROM CLICS DIALOG */}
      <Dialog
        open={isGroupContactDialogOpen}
        onOpenChange={(open) => {
          setIsGroupContactDialogOpen(open);
          if (!open) {
            setSelectedImportClicGroup(null);
            setImportSearchInput('');
          }
        }}
      >
        <DialogContent className="w-[90%] max-w-[440px] rounded-3xl p-6 bg-card gap-4">
          {!selectedImportClicGroup ? (
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
                  value={importSearchInput}
                  onChange={(e) => setImportSearchInput(e.target.value)}
                  className="pl-9 pr-8 h-10 rounded-xl text-xs"
                />
                {importSearchInput && (
                  <button
                    type="button"
                    onClick={() => setImportSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Clic Groups List calling api/clics */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {groups.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No Clics found.</p>
                ) : (
                  groups
                    .filter(g => !importSearchInput.trim() || g.name.toLowerCase().includes(importSearchInput.trim().toLowerCase()))
                    .map((group: any) => {
                      const targetId = group.id || group.clicId;
                      const isLoadingThis = loadingImportGroupId === targetId;

                      return (
                        <div
                          key={targetId}
                          onClick={async () => {
                            setLoadingImportGroupId(targetId);
                            try {
                              const detail = await getClic(targetId);
                              setSelectedImportClicGroup(detail || group);
                            } catch {
                              setSelectedImportClicGroup(group);
                            } finally {
                              setLoadingImportGroupId(null);
                            }
                          }}
                          className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:border-accent/40 hover:shadow-sm cursor-pointer transition-all text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-foreground truncate">{group.name}</p>
                              {group.role === 'admin' && (
                                <span className="text-[9px] font-extrabold bg-[#126989]/15 text-[#126989] border border-[#126989]/20 px-1.5 py-0.5 rounded uppercase">
                                  Admin
                                </span>
                              )}
                            </div>
                            {group.description && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{group.description}</p>}
                            <p className="text-[10px] text-accent font-semibold mt-0.5">
                              {(group.members?.length || group.maxMembers || 0)} Members
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-accent font-bold text-xs shrink-0">
                            {isLoadingThis ? (
                              <Loader2 className="h-4 w-4 animate-spin text-accent" />
                            ) : (
                              <span>View &gt;</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </>
          ) : (
            /* STEP 2: SELECT MEMBERS FROM SELECTED CLIC GROUP */
            <>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedImportClicGroup(null)}
                  className="text-xs text-muted-foreground hover:text-foreground font-bold flex items-center gap-1"
                >
                  &larr; Back to Clics
                </button>
              </div>

              <DialogHeader className="text-left font-display">
                <DialogTitle className="text-lg font-bold text-foreground">{selectedImportClicGroup.name}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Select members to add to your new Clic.
                </DialogDescription>
              </DialogHeader>

              {/* Members List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {(!selectedImportClicGroup.members || selectedImportClicGroup.members.length === 0) ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No members listed in this Clic.</p>
                ) : (
                  selectedImportClicGroup.members.map((member: any, idx: number) => {
                    const memberName = member.name || member.displayName || 'Member';
                    const contactStr = member.email || member.phone || member.phoneNumber || (member.contact?.includes('@') ? member.contact : '') || 'N/A';
                    const isAdded = addedGroupMembers.some(m => m.contact === contactStr || m.name === memberName);

                    return (
                      <div
                        key={member.id || member.memberId || idx}
                        onClick={() => {
                          if (isAdded) {
                            setAddedGroupMembers(prev => prev.filter(m => m.contact !== contactStr && m.name !== memberName));
                          } else {
                            setAddedGroupMembers(prev => [...prev, { name: memberName, contact: contactStr }]);
                          }
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all text-xs ${isAdded
                          ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                          : 'border-border bg-card hover:border-accent/40'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-foreground truncate">{memberName}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{formatEmailForDisplay(contactStr)}</p>
                        </div>
                        <button
                          type="button"
                          className={`h-8 px-3.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border transition-all shrink-0 ${isAdded
                            ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                          }`}
                        >
                          {isAdded ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <Button
                onClick={() => {
                  setSelectedImportClicGroup(null);
                  setIsGroupContactDialogOpen(false);
                }}
                className="w-full h-11 rounded-xl text-xs font-bold bg-accent text-accent-foreground mt-1 shadow-md"
              >
                Done
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* GROUP CREATION: ADD INDIVIDUAL DIALOG */}
      <Dialog open={isManualAddOpen} onOpenChange={setIsManualAddOpen}>
        <DialogContent className="w-[90%] max-w-[400px] rounded-3xl p-6 bg-card gap-4">
          <DialogHeader className="text-left font-display">
            <DialogTitle className="text-lg font-bold text-foreground">Add Member Manually</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manually input a new participant's name and contact details to invite them.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmedName = manualName.trim();
              const trimmedEmail = manualEmail.trim();
              const trimmedPhone = manualPhone.trim();

              if (!trimmedName) {
                toast.error("Please enter a full name.");
                return;
              }

              if (trimmedName.length < 2) {
                toast.error("Full name must be at least 2 characters long.");
                return;
              }

              if (!trimmedEmail) {
                toast.error("Please enter an email address.");
                return;
              }

              if (!isValidEmail(trimmedEmail)) {
                toast.error("Please enter a valid email address (e.g. user@example.com).");
                return;
              }

              if (!trimmedPhone) {
                toast.error("Please enter a phone number.");
                return;
              }

              if (!isValidPhone(trimmedPhone)) {
                toast.error("Phone number must be exactly 11 digits (e.g. 08012345678 or +234 801 234 5678).");
                return;
              }

              const normalizedPhone = formatNigerianPhoneNumber(trimmedPhone);

              const isDuplicate = addedGroupMembers.some(m =>
                (m.email && m.email.toLowerCase() === trimmedEmail.toLowerCase()) ||
                (m.phone && formatNigerianPhoneNumber(m.phone) === normalizedPhone)
              );

              if (isDuplicate) {
                toast.error("A member with this email address or phone number is already added.");
                return;
              }

              const primaryContact = trimmedEmail;
              setAddedGroupMembers(prev => [
                ...prev,
                {
                  name: trimmedName,
                  contact: primaryContact,
                  email: trimmedEmail,
                  phone: normalizedPhone,
                }
              ]);
              setManualName('');
              setManualEmail('');
              setManualPhone('');
              setIsManualAddOpen(false);
              toast.success(`Added ${trimmedName} to clic list.`);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. John Doe"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                className="h-11 rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. john@email.com"
                type="email"
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                className="h-11 rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. +234 801 234 5678"
                type="tel"
                value={manualPhone}
                onChange={e => setManualPhone(e.target.value)}
                className="h-11 rounded-xl text-xs"
                required
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsManualAddOpen(false);
                  setManualName('');
                  setManualEmail('');
                  setManualPhone('');
                }}
                className="h-11 flex-1 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 flex-1 rounded-xl text-xs font-bold bg-accent text-accent-foreground"
              >
                Add Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT CLIC DIALOG MODAL FORM */}
      <Dialog open={isEditClicModalOpen} onOpenChange={setIsEditClicModalOpen}>
        <DialogContent className="w-[92%] max-w-[450px] rounded-3xl p-6 gap-5 bg-card">
          <DialogHeader className="text-left font-display">
            <DialogTitle className="text-xl font-bold text-foreground">Edit Clic</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Update the name and description of this Clic.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateClic} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clic Name</label>
              <Input
                placeholder="Clic name"
                value={editClicName}
                onChange={e => setEditClicName(e.target.value)}
                className="h-11 rounded-xl text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
              <Input
                placeholder="Clic description"
                value={editClicDesc}
                onChange={e => setEditClicDesc(e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditClicModalOpen(false)}
                className="h-11 rounded-xl px-5 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingClic}
                className="h-11 rounded-xl px-6 text-xs font-bold bg-accent text-accent-foreground"
              >
                {isUpdatingClic ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CLIC CONFIRMATION DIALOG MODAL */}
      <Dialog open={isDeleteClicConfirmOpen} onOpenChange={setIsDeleteClicConfirmOpen}>
        <DialogContent className="w-[92%] max-w-[400px] rounded-3xl p-6 gap-5 bg-card text-center">
          <DialogHeader className="text-center font-display">
            <DialogTitle className="text-xl font-bold text-foreground">Delete Clic?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to delete <span className="font-bold text-foreground">{selectedGroup?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteClicConfirmOpen(false)}
              className="h-11 rounded-xl px-5 text-xs font-bold flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingClic}
              onClick={handleDeleteClic}
              className="h-11 rounded-xl px-6 text-xs font-bold flex-1 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeletingClic ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default GroupsHome;
