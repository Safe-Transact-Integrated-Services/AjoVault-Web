import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, Bell, Info, LoaderCircle, Trophy, Users, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { dashboardKeys } from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
} from '@/services/notificationsApi';
import {
  getMyClicInvitations,
  acceptClicInvitation,
  rejectClicInvitation,
  clicsKeys,
} from '@/services/clicsApi';
import type { Notification } from '@/types';

const iconMap = {
  reminder: Bell,
  alert: AlertTriangle,
  milestone: Trophy,
  info: Info,
};

const colorMap = {
  reminder: 'bg-accent/10 text-accent',
  alert: 'bg-destructive/10 text-destructive',
  milestone: 'bg-success/10 text-success',
  info: 'bg-primary/10 text-primary',
};

const formatNotificationDate = (value: string) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const dayMonth = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dayMonth} | ${time}`;
};

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: notificationKeys.feed,
    queryFn: getMyNotifications,
  });

  const clicInvitationsQuery = useQuery({
    queryKey: ['clic-invitations-me'],
    queryFn: getMyClicInvitations,
    retry: 1,
  });

  const notifications = notificationsQuery.data?.items ?? [];

  // Local state to track interactive group invite responses
  const [inviteStatusMap, setInviteStatusMap] = useState<Record<string, 'pending' | 'accepted' | 'rejected'>>({});

  // Merge Clic invitations from GET /api/clics/invitations/me into notification feed
  const displayNotifications = useMemo(() => {
    const clicInvs = clicInvitationsQuery.data || [];

    // Map interactive Clic invitation items
    const interactiveClicItems = clicInvs.map((inv) => {
      const currentStatus = inviteStatusMap[inv.id] || inviteStatusMap[inv.invitationId || ''] || inv.status;
      const groupName = inv.groupName || 'this Clic group';

      let title = 'Clic Invitation';
      let message = inv.inviterName
        ? `${inv.inviterName} invited you to join "${groupName}".`
        : `You have been invited to join "${groupName}".`;
      let type = 'info';

      if (currentStatus === 'rejected') {
        title = 'Invitation Declined';
        message = `You declined the invitation to join "${groupName}".`;
        type = 'alert';
      } else if (currentStatus === 'accepted') {
        title = 'Invitation Accepted';
        message = `You accepted the invitation to join "${groupName}".`;
        type = 'milestone';
      }

      return {
        id: inv.id || inv.invitationId || `clic_inv_${inv.clicId}`,
        title,
        message,
        type,
        category: 'clic',
        read: currentStatus !== 'pending',
        date: inv.createdAtUtc || inv.createdAt || new Date().toISOString(),
        link: '/clics?tab=invitations',
        inviteStatus: currentStatus,
        clicId: inv.clicId,
        invitationId: inv.invitationId || inv.id,
        groupName: inv.groupName,
      } as any;
    });

    // Filter out duplicate generic notifications (e.g., "Clic invite received") if interactive card exists
    const filteredGenericNotifications = notifications.filter((n) => {
      const isClicInviteNotification =
        n.title?.toLowerCase().includes('clic invite') ||
        (n.message?.toLowerCase().includes('invited you to join') && (n.category === 'clic' || n.category === 'group' || !n.category));

      if (isClicInviteNotification) {
        const hasInteractiveMatch = interactiveClicItems.some(
          item => (item.groupName && n.message?.includes(item.groupName)) || (item.clicId && item.clicId === (n as any).clicId)
        );
        if (hasInteractiveMatch || interactiveClicItems.length > 0) return false;
      }
      return true;
    });

    return [...interactiveClicItems, ...filteredGenericNotifications];
  }, [notifications, clicInvitationsQuery.data, inviteStatusMap]);

  const unreadCount = useMemo(() => {
    const normalUnread = notificationsQuery.data?.unreadCount ?? 0;
    const pendingClicInvs = displayNotifications.filter(
      n => (n.inviteStatus === 'pending' || n.category === 'group' && n.inviteStatus === 'pending') && !n.read
    ).length;
    return Math.max(normalUnread, pendingClicInvs);
  }, [notificationsQuery.data, displayNotifications]);

  const handleNotificationClick = async (notificationId: string, link?: string) => {
    await markNotificationRead(notificationId);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationKeys.feed }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
    ]);

    if (link) {
      navigate(link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationKeys.feed }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
    ]);
  };

  const handleAcceptInvite = async (e: React.MouseEvent, notification: any) => {
    e.stopPropagation();
    const clicId = notification.clicId;
    const invitationId = notification.invitationId || notification.id;

    try {
      if (clicId && invitationId) {
        await acceptClicInvitation(clicId, invitationId);
      }
      setInviteStatusMap(prev => ({ ...prev, [notification.id]: 'accepted' }));
      await markNotificationRead(notification.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clicsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['clic-invitations-me'] }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.feed }),
      ]);
      toast.success('Invitation accepted! You joined the group.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to accept invitation.'));
    }
  };

  const handleRejectInvite = async (e: React.MouseEvent, notification: any) => {
    e.stopPropagation();
    const clicId = notification.clicId;
    const invitationId = notification.invitationId || notification.id;

    try {
      if (clicId && invitationId) {
        await rejectClicInvitation(clicId, invitationId);
      }
      setInviteStatusMap(prev => ({ ...prev, [notification.id]: 'rejected' }));
      await markNotificationRead(notification.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clicsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['clic-invitations-me'] }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.feed }),
      ]);
      toast.info('Invitation declined.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to decline invitation.'));
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0 || notificationsQuery.isLoading} className="rounded-xl text-xs font-medium">
          Mark all read
        </Button>
      </div>

      {notificationsQuery.isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading notifications...
        </div>
      )}

      {!notificationsQuery.isLoading && displayNotifications.length === 0 && (
        <EmptyTableState
          title="No notifications yet"
          description="Savings, circles, groups, and account activity will appear here."
        />
      )}

      <div className="space-y-3">
        {displayNotifications.map(notification => {
          const categoryLower = (notification.category || '').toLowerCase();
          const linkLower = (notification.link || '').toLowerCase();

          const isClic = categoryLower === 'clic' || linkLower.startsWith('/clics');
          const isCircle = categoryLower === 'circle' || linkLower.startsWith('/circles');
          const isGoal = categoryLower === 'goal' || linkLower.startsWith('/goals') || linkLower.startsWith('/group-goals');
          const isGroup = isClic || isCircle || isGoal || categoryLower === 'group' || linkLower.startsWith('/groups');

          const badgeLabel = isClic
            ? 'CLIC'
            : isCircle
            ? 'CIRCLE'
            : isGoal
            ? 'GOAL'
            : isGroup
            ? 'GROUP'
            : notification.category
            ? notification.category.toUpperCase()
            : null;

          const Icon = isGroup ? Users : iconMap[notification.type as keyof typeof iconMap] || Bell;
          const colorClass = isGroup ? 'bg-[#126989]/10 text-[#126989]' : colorMap[notification.type as keyof typeof colorMap] || 'bg-primary/10 text-primary';
          
          const currentInviteStatus = inviteStatusMap[notification.id] || notification.inviteStatus;
          const isUnread = !notification.read && currentInviteStatus === 'pending';

          return (
            <div
              key={notification.id}
              onClick={() => void handleNotificationClick(notification.id, notification.link)}
              className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all hover:border-accent/40 ${
                isUnread ? 'border-accent/30 bg-accent/5' : 'border-border'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${isUnread ? 'font-bold' : 'font-semibold'} text-foreground`}>
                    {notification.title}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {badgeLabel && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#126989] bg-[#126989]/10 px-2.5 py-0.5 rounded-full shrink-0">
                        {badgeLabel}
                      </span>
                    )}
                    {isUnread && <div className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />}
                  </div>
                </div>

                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{notification.message}</p>

                {/* Interactive Accept / Decline Actions for Group Invitations */}
                {currentInviteStatus === 'pending' && (
                  <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={(e) => handleAcceptInvite(e, notification)}
                      className="h-8 px-4 text-xs font-semibold bg-[#126989] hover:bg-[#0f5873] text-white rounded-lg gap-1.5 shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <button
                      type="button"
                      onClick={(e) => handleRejectInvite(e, notification)}
                      className="h-8 px-4 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors rounded-lg flex items-center gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </button>
                  </div>
                )}

                {currentInviteStatus === 'accepted' && (
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                    <Check className="h-3 w-3" /> Accepted
                  </div>
                )}

                {currentInviteStatus === 'rejected' && (
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 w-fit px-2.5 py-0.5 rounded-md border border-rose-200/80">
                    <X className="h-3 w-3" /> Declined
                  </div>
                )}

                <p className="mt-2 text-[11px] text-muted-foreground/80">{formatNotificationDate(notification.date)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
