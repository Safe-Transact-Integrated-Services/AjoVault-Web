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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

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

interface GroupMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contact?: string;
  role: 'admin' | 'member';
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
  payoutType: 'rotation' | 'random' | 'bidding';
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
    payoutType: 'rotation',
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
    payoutType: 'bidding',
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
    payoutType: 'bidding',
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
}

const mockPhoneContacts: PhoneContact[] = [
  { name: 'Chinedu O.', contact: 'chinedu@email.com' },
  { name: 'Tunde W.', contact: 'tunde@email.com' },
  { name: 'Zainab B.', contact: 'zainab@email.com' },
  { name: 'Bisi A.', contact: 'bisi@email.com' },
  { name: 'Kunle S.', contact: '+234 803 111 2222' },
  { name: 'Halima F.', contact: 'halima@email.com' },
];

const GroupsHome = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Filtering & searching states
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'member' | 'invites'>('all');
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
  const [removingItem, setRemovingItem] = useState<{ id: string; groupId: string; name: string; type: 'member' | 'invite' } | null>(null);

  // Create Group Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupAmount, setNewGroupAmount] = useState('');
  const [newGroupFreq, setNewGroupFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [newGroupMaxMembers, setNewGroupMaxMembers] = useState('10');
  const [newGroupPayoutType, setNewGroupPayoutType] = useState<'rotation' | 'random' | 'bidding'>('rotation');

  // Group creation members state
  const [addedGroupMembers, setAddedGroupMembers] = useState<Array<{ name: string; contact: string }>>([]);
  const [isGroupContactDialogOpen, setIsGroupContactDialogOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualContact, setManualContact] = useState('');

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
  const [inviteContact, setInviteContact] = useState('');
  const [inviteChannel, setInviteChannel] = useState<'platform' | 'email' | 'sms'>('platform');

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedGroup = useMemo(() => {
    return groups.find(g => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

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
    } else if (activeTab === 'invites') {
      list = list.filter(g => g.role === 'admin' && (invitationsMap[g.id] || []).length > 0);
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

  // Handle creation of a new group from form modal
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name.');
      return;
    }

    const newId = `grp_${Date.now()}`;
    const amountVal = parseFloat(newGroupAmount) || 5000;
    const maxVal = parseInt(newGroupMaxMembers) || 10;

    // Map added members to group members
    const mappedMembers: GroupMember[] = [
      { id: 'm_creator', name: 'Adaeze Okafor', contact: 'adaeze@email.com', role: 'admin', hasPaid: false, payoutPosition: 1 },
      ...addedGroupMembers.map((m, idx) => ({
        id: `m_added_${idx}_${Date.now()}`,
        name: m.name,
        contact: m.contact,
        email: m.contact.includes('@') ? m.contact : undefined,
        phone: !m.contact.includes('@') ? m.contact : undefined,
        role: 'member' as const,
        hasPaid: false,
        payoutPosition: idx + 2
      }))
    ];

    const createdGroup: Group = {
      id: newId,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || 'Custom Group',
      amount: amountVal,
      currency: 'NGN',
      frequency: newGroupFreq,
      memberCount: mappedMembers.length,
      maxMembers: maxVal,
      currentCycle: 0,
      totalCycles: maxVal,
      role: 'admin',
      nextContributionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextPayoutDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      payoutType: newGroupPayoutType,
      createdAt: new Date().toISOString().split('T')[0],
      members: mappedMembers
    };

    setGroups(prev => [createdGroup, ...prev]);
    setSelectedGroupId(newId);
    setIsCreateModalOpen(false);

    // Reset Form Fields
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupAmount('');
    setNewGroupFreq('weekly');
    setNewGroupMaxMembers('10');
    setNewGroupPayoutType('rotation');
    setAddedGroupMembers([]);

    toast.success(`Group "${createdGroup.name}" created successfully!`);
  };

  // Duplicate existing group
  const handleDuplicateGroup = (group: Group) => {
    setNewGroupName(`${group.name} Copy`);
    setNewGroupDesc(group.description);
    setNewGroupAmount(group.amount.toString());
    setNewGroupFreq(group.frequency);
    setNewGroupMaxMembers(group.maxMembers.toString());
    setNewGroupPayoutType(group.payoutType);
    setIsCreateModalOpen(true);
    toast.info('Autofilled form with previous group data.');
  };

  // Re-invite Workflow (maximum 5 attempts)
  const handleReinvite = (inviteId: string, groupId?: string) => {
    const targetGroupId = groupId || selectedGroupId;
    if (!targetGroupId) return;

    const targetGroup = groups.find(g => g.id === targetGroupId);
    const invites = invitationsMap[targetGroupId] || [];
    const target = invites.find(inv => inv.id === inviteId);
    if (!target) return;

    if (target.reinviteCount >= 5) {
      toast.error('Maximum limit of 5 reinvitation attempts reached for this contact.');
      return;
    }

    const nextCount = target.reinviteCount + 1;

    setInvitationsMap(prev => ({
      ...prev,
      [targetGroupId]: (prev[targetGroupId] || []).map(inv =>
        inv.id === inviteId ? { ...inv, status: 'pending', reinviteCount: nextCount } : inv
      )
    }));

    // Trigger Notification
    const reinviteNotif: GroupNotification = {
      id: `nt_re_${Date.now()}`,
      groupId: targetGroupId,
      groupName: targetGroup?.name || 'Group',
      message: `Re-sent invitation to ${target.inviteeName} (Attempt ${nextCount}/5).`,
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [reinviteNotif, ...prev]);
    toast.success(`Re-sent invitation to ${target.inviteeName} (${nextCount}/5).`);

    // Simulate response after 5 seconds
    setTimeout(() => {
      const isAccepted = Math.random() > 0.4;
      const finalStatus = isAccepted ? 'accepted' : 'rejected';

      setInvitationsMap(prev => {
        const list = prev[targetGroupId] || [];
        return {
          ...prev,
          [targetGroupId]: list.map(inv => inv.id === inviteId ? { ...inv, status: finalStatus } : inv)
        };
      });

      const responseNotif: GroupNotification = {
        id: `nt_resp_${Date.now()}`,
        groupId: targetGroupId,
        groupName: targetGroup?.name || 'Group',
        message: isAccepted
          ? `${target.inviteeName} accepted your invitation to join ${targetGroup?.name || 'the Group'}.`
          : `${target.inviteeName} rejected your invitation to join ${targetGroup?.name || 'the Group'}.`,
        type: isAccepted ? 'success' : 'warning',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications(prev => [responseNotif, ...prev]);

      if (isAccepted) {
        setGroups(prevGroups => {
          return prevGroups.map(grp => {
            if (grp.id === targetGroupId) {
              const nextPos = grp.members.length + 1;
              return {
                ...grp,
                memberCount: grp.memberCount + 1,
                members: [
                  ...grp.members,
                  {
                    id: `m_dyn_${Date.now()}`,
                    name: target.inviteeName,
                    email: target.email,
                    phone: target.phone,
                    contact: target.inviteeContact,
                    role: 'member',
                    hasPaid: false,
                    payoutPosition: nextPos
                  }
                ]
              };
            }
            return grp;
          });
        });
        toast.success(`${target.inviteeName} joined the Group!`);
      } else {
        toast.error(`${target.inviteeName} declined the invitation.`);
      }
    }, 5000);
  };

  // Add Member from Contacts list
  const handleSelectContact = (contact: PhoneContact) => {
    if (!selectedGroupId || !selectedGroup) return;

    // Check if they are already in the accepted members
    if (selectedGroup.members.some(m => m.name.toLowerCase() === contact.name.toLowerCase() || m.contact === contact.contact)) {
      toast.error(`${contact.name} is already a member of this group.`);
      return;
    }

    // Check if they have an active invitation
    const groupInvites = invitationsMap[selectedGroupId] || [];
    if (groupInvites.some(inv => inv.inviteeName.toLowerCase() === contact.name.toLowerCase() && inv.status === 'pending')) {
      toast.error(`There is already a pending invitation sent to ${contact.name}.`);
      return;
    }

    const newInviteId = `inv_${Date.now()}`;
    const newInvite: GroupInvitation = {
      id: newInviteId,
      inviteeName: contact.name,
      inviteeContact: contact.contact,
      channel: 'platform',
      status: 'pending',
      reinviteCount: 1,
      createdAt: new Date().toISOString(),
    };

    setInvitationsMap(prev => ({
      ...prev,
      [selectedGroupId]: [newInvite, ...(prev[selectedGroupId] || [])]
    }));

    const newNotif: GroupNotification = {
      id: `nt_add_${Date.now()}`,
      groupId: selectedGroupId,
      groupName: selectedGroup.name,
      message: `Sent invitation to ${contact.name} from your contacts list.`,
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotif, ...prev]);
    setIsContactDialogOpen(false);
    toast.success(`Invitation sent to ${contact.name}!`);

    // Simulate response after 5 seconds
    setTimeout(() => {
      const isAccepted = Math.random() > 0.4;
      const finalStatus = isAccepted ? 'accepted' : 'rejected';

      setInvitationsMap(prev => {
        const list = prev[selectedGroupId] || [];
        return {
          ...prev,
          [selectedGroupId]: list.map(inv => inv.id === newInviteId ? { ...inv, status: finalStatus } : inv)
        };
      });

      const responseNotif: GroupNotification = {
        id: `nt_resp_${Date.now()}`,
        groupId: selectedGroupId,
        groupName: selectedGroup.name,
        message: isAccepted
          ? `${contact.name} accepted your invitation to join ${selectedGroup.name}.`
          : `${contact.name} rejected your invitation to join ${selectedGroup.name}.`,
        type: isAccepted ? 'success' : 'warning',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications(prev => [responseNotif, ...prev]);

      if (isAccepted) {
        setGroups(prevGroups => {
          return prevGroups.map(grp => {
            if (grp.id === selectedGroupId) {
              const nextPos = grp.members.length + 1;
              return {
                ...grp,
                memberCount: grp.memberCount + 1,
                members: [
                  ...grp.members,
                  {
                    id: `m_dyn_${Date.now()}`,
                    name: contact.name,
                    contact: contact.contact,
                    role: 'member',
                    hasPaid: false,
                    payoutPosition: nextPos
                  }
                ]
              };
            }
            return grp;
          });
        });
        toast.success(`${contact.name} joined the Group!`);
      } else {
        toast.error(`${contact.name} declined the invitation.`);
      }
    }, 5000);
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

  const handleSaveEdit = () => {
    if (!editingMember) return;
    const targetGroupId = editingMember.groupId;
    if (!targetGroupId) return;

    if (!editName.trim()) {
      toast.error('Full Name is required.');
      return;
    }

    const primaryContact = editEmail.trim() || editPhone.trim() || '';

    if (editingMember.type === 'member') {
      setGroups(prev => prev.map(g => {
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: g.members.map(m => m.id === editingMember.id ? {
              ...m,
              name: editName.trim(),
              email: editEmail.trim(),
              phone: editPhone.trim(),
              contact: primaryContact
            } : m)
          };
        }
        return g;
      }));
    } else {
      setInvitationsMap(prev => ({
        ...prev,
        [targetGroupId]: (prev[targetGroupId] || []).map(inv =>
          inv.id === editingMember.id ? {
            ...inv,
            inviteeName: editName.trim(),
            email: editEmail.trim(),
            phone: editPhone.trim(),
            inviteeContact: primaryContact
          } : inv
        )
      }));
    }

    toast.success('User details updated successfully.');
    setEditingMember(null);
  };

  // Remove member or invite (with confirmation prompt)
  const triggerRemoveItem = (item: any, type: 'member' | 'invite', groupId?: string) => {
    const targetGroupId = groupId || selectedGroupId;
    if (!targetGroupId) return;

    setRemovingItem({
      id: item.id,
      groupId: targetGroupId,
      name: type === 'member' ? item.name : item.inviteeName,
      type,
    });
  };

  const handleConfirmRemove = () => {
    if (!removingItem) return;
    const targetGroupId = removingItem.groupId;

    if (removingItem.type === 'member') {
      setGroups(prev => prev.map(g => {
        if (g.id === targetGroupId) {
          return {
            ...g,
            memberCount: Math.max(1, g.memberCount - 1),
            members: g.members.filter(m => m.id !== removingItem.id)
          };
        }
        return g;
      }));
      toast.success(`Removed member ${removingItem.name} from group.`);
    } else {
      setInvitationsMap(prev => ({
        ...prev,
        [targetGroupId]: (prev[targetGroupId] || []).filter(inv => inv.id !== removingItem.id)
      }));
      toast.success(`Cancelled invitation request to ${removingItem.name}.`);
    }

    setRemovingItem(null);
  };

  // Accept pending invitation received
  const handleAcceptInvite = (invite: GroupNotification) => {
    const newId = `grp_rec_${Date.now()}`;
    const newGroup: Group = {
      id: newId,
      name: invite.groupName,
      description: invite.description || 'Custom savings group',
      amount: invite.amount || 10000,
      currency: 'NGN',
      frequency: invite.frequency || 'weekly',
      memberCount: 6,
      maxMembers: 12,
      currentCycle: 1,
      totalCycles: 12,
      role: 'member',
      nextContributionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextPayoutDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      payoutType: 'rotation',
      createdAt: new Date().toISOString().split('T')[0],
      members: [
        { id: 'm1', name: invite.creatorName || 'Chidi N.', contact: 'creator@email.com', role: 'admin', hasPaid: true, payoutPosition: 1 },
        { id: 'm2', name: 'Adaeze Okafor', contact: 'adaeze@email.com', role: 'member', hasPaid: false, payoutPosition: 6 }
      ]
    };

    setGroups(prev => [newGroup, ...prev]);
    setSelectedGroupId(newId);
    
    // Update notification resolved status
    setNotifications(prev => prev.map(nt => 
      nt.id === invite.id 
        ? { ...nt, resolved: true, actionStatus: 'accepted' as const, read: true } 
        : nt
    ));

    toast.success(`Joined "${invite.groupName}" successfully!`);
  };

  // Reject pending invitation received
  const handleRejectInvite = (invite: GroupNotification) => {
    setNotifications(prev => prev.map(nt => 
      nt.id === invite.id 
        ? { ...nt, resolved: true, actionStatus: 'rejected' as const, read: true } 
        : nt
    ));
    toast.info(`Declined invitation to join "${invite.groupName}".`);
  };

  // Add manually typed invitation request
  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !inviteName.trim() || !inviteContact.trim() || !selectedGroup) {
      toast.error('Please fill out invitee name and contact details.');
      return;
    }

    const newInviteId = `inv_${Date.now()}`;
    const newInvite: GroupInvitation = {
      id: newInviteId,
      inviteeName: inviteName.trim(),
      inviteeContact: inviteContact.trim(),
      channel: inviteChannel,
      status: 'pending',
      reinviteCount: 1,
      createdAt: new Date().toISOString(),
    };

    setInvitationsMap(prev => ({
      ...prev,
      [selectedGroupId]: [newInvite, ...(prev[selectedGroupId] || [])]
    }));

    const newNotif: GroupNotification = {
      id: `nt_add_${Date.now()}`,
      groupId: selectedGroupId,
      groupName: selectedGroup.name,
      message: `Sent invitation to ${inviteName} via ${inviteChannel.toUpperCase()}.`,
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotif, ...prev]);
    toast.success(`Invitation sent to ${inviteName} via ${inviteChannel.toUpperCase()}`);
    setInviteName('');
    setInviteContact('');

    // Simulate response after 5 seconds
    setTimeout(() => {
      const isAccepted = Math.random() > 0.4;
      const finalStatus = isAccepted ? 'accepted' : 'rejected';

      setInvitationsMap(prev => {
        const list = prev[selectedGroupId] || [];
        return {
          ...prev,
          [selectedGroupId]: list.map(inv => inv.id === newInviteId ? { ...inv, status: finalStatus } : inv)
        };
      });

      const responseNotif: GroupNotification = {
        id: `nt_resp_${Date.now()}`,
        groupId: selectedGroupId,
        groupName: selectedGroup.name,
        message: isAccepted
          ? `${inviteName} accepted your invitation to join ${selectedGroup.name}.`
          : `${inviteName} rejected your invitation to join ${selectedGroup.name}.`,
        type: isAccepted ? 'success' : 'warning',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications(prev => [responseNotif, ...prev]);

      if (isAccepted) {
        setGroups(prevGroups => {
          return prevGroups.map(grp => {
            if (grp.id === selectedGroupId) {
              const nextPos = grp.members.length + 1;
              return {
                ...grp,
                memberCount: grp.memberCount + 1,
                members: [
                  ...grp.members,
                  {
                    id: `m_dyn_${Date.now()}`,
                    name: inviteName,
                    contact: inviteContact,
                    role: 'member',
                    hasPaid: false,
                    payoutPosition: nextPos
                  }
                ]
              };
            }
            return grp;
          });
        });
        toast.success(`${inviteName} joined the Group!`);
      } else {
        toast.error(`${inviteName} declined the invitation.`);
      }
    }, 5000);
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
              <h1 className="font-display text-2xl font-bold text-foreground">Groups</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage contribution groups and invitation requests.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Create Group Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground shadow-sm transition-all hover:bg-accent/90"
              >
                <Plus className="h-4 w-4" /> Create Group
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
            {['all', 'admin', 'member', 'invites'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as any);
                }}
                className={`flex-1 text-center pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 capitalize ${activeTab === tab
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab === 'member' ? 'Member' : tab === 'invites' ? 'Invites' : tab}
              </button>
            ))}
          </div>

          {/* Search Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search groups..."
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
            {filteredGroups.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
                No groups found. Create one to get started!
              </div>
            ) : (
              filteredGroups.map(group => {
                const isExpanded = !!expandedGroups[group.id];
                const isSelected = selectedGroupId === group.id;
                const percent = Math.round((group.currentCycle / group.totalCycles) * 100) || 0;

                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`group w-full rounded-2xl border p-4 text-left transition-all hover:shadow-md cursor-pointer ${
                      isSelected
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
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => toggleExpand(group.id, e)}
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
                          {/* Expanded Card Content: Invites View if top tab is 'invites', else Members Table */}
                          {activeTab === 'invites' ? (
                            /* INVITES View under top 'Invites' tab */
                            <div className="space-y-4">
                              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {!invitationsMap[group.id] || invitationsMap[group.id].length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-4">No active invitations sent.</p>
                                ) : (
                                  invitationsMap[group.id].map(inv => {
                                    const displayEmail = inv.email || (inv.inviteeContact?.includes('@') ? inv.inviteeContact : 'N/A');
                                    const displayPhone = inv.phone || (inv.inviteeContact && (inv.inviteeContact.includes('+') || inv.inviteeContact.match(/\d/)) ? inv.inviteeContact : 'N/A');

                                    return (
                                      <div key={inv.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-xs bg-card">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-semibold text-muted-foreground">Name:</span>
                                            <span className="font-bold text-foreground">{inv.inviteeName}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px]">
                                            <span className="font-semibold text-muted-foreground">Email:</span>
                                            <span className="text-foreground">{group.role === 'admin' ? displayEmail : '••••••••'}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px]">
                                            <span className="font-semibold text-muted-foreground">Phone:</span>
                                            <span className="text-foreground">{group.role === 'admin' ? displayPhone : '••••••••'}</span>
                                          </div>
                                          <span className="inline-block text-[9px] text-muted-foreground font-medium pt-0.5">Channel: {inv.channel.toUpperCase()}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div className="text-right">
                                            <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border tracking-wide ${
                                              inv.status === 'accepted'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : inv.status === 'rejected'
                                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                              {inv.status}
                                            </span>
                                            <p className="text-[8px] text-muted-foreground mt-0.5">
                                              Attempts: {inv.reinviteCount}/5
                                            </p>
                                          </div>

                                          {group.role === 'admin' && (inv.status === 'rejected' || inv.status === 'pending') && (
                                            <div className="border-l border-border pl-2.5">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleReinvite(inv.id);
                                                }}
                                                disabled={inv.status === 'pending' || inv.reinviteCount >= 5}
                                                className={`text-[9px] font-extrabold uppercase px-2.5 py-1.5 rounded transition-all ${
                                                  inv.status === 'pending' || inv.reinviteCount >= 5
                                                    ? 'bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60'
                                                    : 'bg-accent/10 hover:bg-accent/25 text-accent border border-accent/20'
                                                }`}
                                              >
                                                {inv.status === 'pending' ? 'Pending' : 'Reinvite'}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Inline Invitation Form for Admin */}
                              {group.role === 'admin' && (
                                <div className="rounded-xl border border-border bg-card p-3 space-y-3 mt-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Invite Participant via Channel</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Name"
                                      value={inviteName}
                                      onChange={(e) => setInviteName(e.target.value)}
                                      className="h-9 text-xs rounded-xl"
                                    />
                                    <Input
                                      placeholder="Email or Phone"
                                      value={inviteContact}
                                      onChange={(e) => setInviteContact(e.target.value)}
                                      className="h-9 text-xs rounded-xl"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <select
                                      value={inviteChannel}
                                      onChange={(e) => setInviteChannel(e.target.value as any)}
                                      className="h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                                    >
                                      <option value="platform">In-App</option>
                                      <option value="email">Email</option>
                                      <option value="sms">SMS</option>
                                    </select>

                                    <Button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendInvite(group.id);
                                      }}
                                      className="h-9 px-4 text-xs font-bold bg-accent text-accent-foreground rounded-xl"
                                    >
                                      Send Invitation
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* MEMBERS View for All / Admin / Member tabs */
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
                                  {group.members.map(m => {
                                    const emailStr = m.email || (m.contact?.includes('@') ? m.contact : 'N/A');
                                    const phoneStr = m.phone || (m.contact && (m.contact.includes('+') || m.contact.match(/\d/)) ? m.contact : 'N/A');
                                    return (
                                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-2.5 font-bold text-foreground">
                                          <div className="flex items-center gap-1.5">
                                            <span>{m.name}</span>
                                            {m.role === 'admin' && (
                                              <span className="text-[8px] bg-[#126989]/15 text-[#126989] px-1.5 py-0.5 rounded font-extrabold uppercase">
                                                Admin
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        {group.role === 'admin' && (
                                          <>
                                            <td className="p-2.5 text-muted-foreground">{emailStr}</td>
                                            <td className="p-2.5 text-muted-foreground">{phoneStr}</td>
                                            <td className="p-2.5">
                                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border bg-sky-50 text-sky-700 border-sky-200">
                                                Joined
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
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          <Button
                            className="w-full mt-2 h-9 text-xs font-bold bg-accent text-accent-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroupId(group.id);
                            }}
                          >
                            View Details
                          </Button>
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
                  onClick={() => setSelectedGroupId(null)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                  {selectedGroup && (
                    <button
                      onClick={() => handleDuplicateGroup(selectedGroup)}
                      className="h-8 px-3.5 rounded-xl border border-[#126989]/30 text-[#126989] hover:bg-[#126989]/5 text-xs font-bold transition-all shrink-0 shadow-sm"
                    >
                      Duplicate Group
                    </button>
                  )}

                </div>
              </div>

              {!selectedGroup ? (
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
                          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                            detailsTab === 'accepted' ? 'border-[#126989] text-[#126989]' : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Members ({selectedGroup.members.length})
                        </button>
                        <button
                          onClick={() => setDetailsTab('invitations')}
                          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                            detailsTab === 'invitations' ? 'border-[#126989] text-[#126989]' : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Invites ({invitationsMap[selectedGroupId]?.length || 0})
                        </button>
                      </div>

                      {/* Plus sign button to invite from Contacts */}
                      {selectedGroup.role === 'admin' && (
                        <button
                          onClick={() => setIsContactDialogOpen(true)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#126989]/30 text-[#126989] hover:bg-[#126989]/5 transition-all shrink-0 mb-1"
                          title="Invite from contacts"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Content under Accepted tab */}
                    {detailsTab === 'accepted' && (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {selectedGroup.members.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No members have joined yet.</p>
                        ) : (
                          selectedGroup.members.map(member => {
                            const displayEmail = member.email || (member.contact?.includes('@') ? member.contact : 'N/A');
                            const displayPhone = member.phone || (member.contact && (member.contact.includes('+') || member.contact.match(/\d/)) ? member.contact : 'N/A');

                            return (
                              <div key={member.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-muted-foreground">Name:</span>
                                    <span className="font-bold text-foreground">{member.name}</span>
                                    {member.role === 'admin' && (
                                      <span className="text-[9px] bg-[#126989]/15 text-[#126989] border border-[#126989]/20 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                        {member.role}
                                      </span>
                                    )}
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
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" /> Joined
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Content under Invitations tab */}
                    {detailsTab === 'invitations' && (
                      <div className="space-y-4">
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {!invitationsMap[selectedGroupId] || invitationsMap[selectedGroupId].length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">No active invitations sent.</p>
                          ) : (
                            invitationsMap[selectedGroupId].map(inv => {
                              const displayEmail = inv.email || (inv.inviteeContact?.includes('@') ? inv.inviteeContact : 'N/A');
                              const displayPhone = inv.phone || (inv.inviteeContact && (inv.inviteeContact.includes('+') || inv.inviteeContact.match(/\d/)) ? inv.inviteeContact : 'N/A');

                              return (
                                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-xs bg-card">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-semibold text-muted-foreground">Name:</span>
                                      <span className="font-bold text-foreground">{inv.inviteeName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                      <span className="font-semibold text-muted-foreground">Email:</span>
                                      <span className="text-foreground">{selectedGroup.role === 'admin' ? displayEmail : '••••••••'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                      <span className="font-semibold text-muted-foreground">Phone:</span>
                                      <span className="text-foreground">{selectedGroup.role === 'admin' ? displayPhone : '••••••••'}</span>
                                    </div>
                                    <span className="inline-block text-[9px] text-muted-foreground font-medium pt-0.5">Channel: {inv.channel.toUpperCase()}</span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border tracking-wide ${
                                        inv.status === 'accepted'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : inv.status === 'rejected'
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                        {inv.status}
                                      </span>
                                      <p className="text-[8px] text-muted-foreground mt-0.5">
                                        Attempts: {inv.reinviteCount}/5
                                      </p>
                                    </div>

                                    {/* Reinvite Action button workflow */}
                                    {selectedGroup.role === 'admin' && (inv.status === 'rejected' || inv.status === 'pending') && (
                                      <div className="border-l border-border pl-2.5">
                                        <button
                                          onClick={() => handleReinvite(inv.id)}
                                          disabled={inv.status === 'pending' || inv.reinviteCount >= 5}
                                          className={`text-[9px] font-extrabold uppercase px-2.5 py-1.5 rounded transition-all ${
                                            inv.status === 'pending' || inv.reinviteCount >= 5
                                              ? 'bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60'
                                              : 'bg-accent/10 hover:bg-accent/25 text-accent border border-accent/20'
                                          }`}
                                          title={inv.status === 'pending' ? 'Invitation pending response' : 'Re-invite participant'}
                                        >
                                          {inv.reinviteCount >= 5 ? 'Limit (5/5)' : 'Reinvite'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Sending invitations form with channels (in-app, sms, email) */}
                        {selectedGroup.role === 'admin' && (
                          <form onSubmit={handleSendInvite} className="bg-muted/30 p-3 rounded-xl border border-border space-y-3">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invite Participant via Channel</p>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Name"
                                value={inviteName}
                                onChange={e => setInviteName(e.target.value)}
                                className="h-9 text-xs"
                              />
                              <Input
                                placeholder="Email or Phone"
                                value={inviteContact}
                                onChange={e => setInviteContact(e.target.value)}
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <Select
                                value={inviteChannel}
                                onValueChange={val => setInviteChannel(val as typeof inviteChannel)}
                              >
                                <SelectTrigger className="h-9 text-xs w-[120px]">
                                  <SelectValue placeholder="Channel" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="platform">In-App</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="sms">SMS</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button type="submit" size="sm" className="h-9 text-xs font-bold px-4 shrink-0 bg-accent text-accent-foreground">
                                Send Invitation
                              </Button>
                            </div>
                          </form>
                        )}
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
            <DialogTitle className="text-xl font-bold text-foreground">Create New Group</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Start a new peer-to-peer contribution group with custom frequencies and rules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGroup} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Group Name</label>
              <Input
                placeholder="e.g. Lagos Investors Guild"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="h-11 rounded-xl text-sm"
                required
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
                  <Plus className="h-3.5 w-3.5" /> Add Individual
                </button>
              </div>

              {/* Displaying selected members list */}
              {addedGroupMembers.length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto bg-muted/20 p-2.5 rounded-xl border border-border">
                  {addedGroupMembers.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-card rounded-xl border border-border shadow-sm">
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.contact}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddedGroupMembers(prev => prev.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
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
                Create Group
              </Button>
            </div>

          </form>
        </DialogContent>
      </Dialog>

      {/* CONTACT SELECTION MODAL DIALOG */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="w-[90%] max-w-[400px] rounded-3xl p-6 bg-card gap-4">
          <DialogHeader className="text-left font-display">
            <DialogTitle className="text-lg font-bold text-foreground">Select from Contacts</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a phone/email contact to invite to the contribution group.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {mockPhoneContacts.map((contact, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectContact(contact)}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer hover:border-accent hover:bg-accent/5 transition-all text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">{contact.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{contact.contact}</p>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase tracking-wide">Select</Badge>
              </div>
            ))}
          </div>
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
                onClick={handleSaveEdit}
                className="h-10 flex-1 rounded-xl text-xs font-bold bg-accent text-accent-foreground"
              >
                Save Changes
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
            <h3 className="font-display text-lg font-bold text-foreground">Remove from Group</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to remove <strong>{removingItem?.name}</strong>? This action cannot be undone.
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
                    className={`p-3 rounded-2xl border transition-all text-xs ${
                      nt.read ? 'bg-card border-border' : 'bg-accent/5 border-accent/20'
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

      {/* GROUP CREATION: IMPORT PLATFORM USERS DIALOG */}
      <Dialog open={isGroupContactDialogOpen} onOpenChange={setIsGroupContactDialogOpen}>
        <DialogContent className="w-[90%] max-w-[400px] rounded-3xl p-6 bg-card gap-4">
          <DialogHeader className="text-left font-display">
            <DialogTitle className="text-lg font-bold text-foreground">Import Platform Users</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select existing registered users from the system to import into the group.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {mockPhoneContacts.map((contact, idx) => {
              const isAdded = addedGroupMembers.some(m => m.contact === contact.contact);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isAdded) {
                      setAddedGroupMembers(prev => prev.filter(m => m.contact !== contact.contact));
                    } else {
                      setAddedGroupMembers(prev => [...prev, { name: contact.name, contact: contact.contact }]);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                    isAdded
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-card hover:border-accent hover:bg-accent/5'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-foreground">{contact.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{contact.contact}</p>
                  </div>
                  <Badge variant={isAdded ? "default" : "outline"} className="text-[9px] uppercase tracking-wide">
                    {isAdded ? 'Added' : 'Select'}
                  </Badge>
                </div>
              );
            })}
          </div>

          <Button
            onClick={() => setIsGroupContactDialogOpen(false)}
            className="w-full h-11 rounded-xl text-xs font-bold bg-accent text-accent-foreground mt-2"
          >
            Done
          </Button>
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

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <Input
                placeholder="e.g. John Doe"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                className="h-11 rounded-xl text-xs"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email or Phone Number</label>
              <Input
                placeholder="e.g. john@email.com or +234..."
                value={manualContact}
                onChange={e => setManualContact(e.target.value)}
                className="h-11 rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsManualAddOpen(false);
                  setManualName('');
                  setManualContact('');
                }}
                className="h-11 flex-1 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const trimmedName = manualName.trim();
                  const trimmedContact = manualContact.trim();

                  if (!trimmedName) {
                    toast.error('Please enter a full name.');
                    return;
                  }
                  if (trimmedName.length < 2) {
                    toast.error('Full name must be at least 2 characters long.');
                    return;
                  }
                  const nameRegex = /^[a-zA-Z\s'.]+$/;
                  if (!nameRegex.test(trimmedName)) {
                    toast.error('Full name should only contain letters, spaces, apostrophes, or periods.');
                    return;
                  }

                  if (!trimmedContact) {
                    toast.error('Please enter an email or phone number.');
                    return;
                  }

                  const isEmail = trimmedContact.includes('@');
                  if (isEmail) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(trimmedContact)) {
                      toast.error('Please enter a valid email address.');
                      return;
                    }
                  } else {
                    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
                    if (!phoneRegex.test(trimmedContact)) {
                      toast.error('Please enter a valid phone number (at least 7 digits).');
                      return;
                    }
                  }

                  setAddedGroupMembers(prev => [...prev, { name: trimmedName, contact: trimmedContact }]);
                  setManualName('');
                  setManualContact('');
                  setIsManualAddOpen(false);
                  toast.success(`Added ${trimmedName} to group list.`);
                }}
                className="h-11 flex-1 rounded-xl text-xs font-bold bg-accent text-accent-foreground"
              >
                Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default GroupsHome;
