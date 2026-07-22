import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, Bell, Info, LoaderCircle, Trophy, Users, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { dashboardKeys } from '@/services/dashboardApi';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
} from '@/services/notificationsApi';
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
  return `${date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} | ${date.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
};

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: notificationKeys.feed,
    queryFn: getMyNotifications,
  });

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  // Local state to track interactive group invite responses
  const [inviteStatusMap, setInviteStatusMap] = useState<Record<string, 'pending' | 'accepted' | 'rejected'>>({});

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

  const handleAcceptInvite = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    setInviteStatusMap(prev => ({ ...prev, [notification.id]: 'accepted' }));
    await markNotificationRead(notification.id);
    toast.success('Invitation accepted! You joined the group.');
    setTimeout(() => {
      navigate(notification.link || '/groups');
    }, 800);
  };

  const handleRejectInvite = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setInviteStatusMap(prev => ({ ...prev, [notificationId]: 'rejected' }));
    await markNotificationRead(notificationId);
    toast.info('Group invitation declined.');
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0 || notificationsQuery.isLoading}>
          Mark all read
        </Button>
      </div>

      {notificationsQuery.isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading notifications...
        </div>
      )}

      {!notificationsQuery.isLoading && notifications.length === 0 && (
        <EmptyTableState
          title="No notifications yet"
          description="Savings, circles, groups, and account activity will appear here."
        />
      )}

      <div className="space-y-2">
        {notifications.map(notification => {
          const isGroup = notification.category === 'group' || notification.link === '/groups';
          const Icon = isGroup ? Users : iconMap[notification.type];
          const colorClass = isGroup ? 'bg-[#126989]/15 text-[#126989]' : colorMap[notification.type];
          
          const currentInviteStatus = inviteStatusMap[notification.id] || notification.inviteStatus;

          return (
            <div
              key={notification.id}
              onClick={() => void handleNotificationClick(notification.id, notification.link)}
              className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-accent/40 ${
                notification.read ? 'border-border' : 'border-accent/30 bg-accent/5'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${notification.read ? 'font-medium' : 'font-semibold'} text-foreground`}>
                    {notification.title}
                  </p>
                  {isGroup && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#126989] bg-[#126989]/10 px-2 py-0.5 rounded-full border border-[#126989]/20 shrink-0">
                      Group
                    </span>
                  )}
                </div>

                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>

                {/* Interactive Accept / Decline Actions for Group Invitations */}
                {currentInviteStatus === 'pending' && (
                  <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={(e) => handleAcceptInvite(e, notification)}
                      className="h-7 px-3 text-xs font-bold bg-[#126989] hover:bg-[#126989]/90 text-white rounded-lg gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <button
                      type="button"
                      onClick={(e) => handleRejectInvite(e, notification.id)}
                      className="h-7 px-3 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 transition-colors rounded-lg flex items-center gap-1"
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </button>
                  </div>
                )}

                {currentInviteStatus === 'accepted' && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-md border border-emerald-200">
                    <Check className="h-3 w-3" /> Accepted
                  </div>
                )}

                {currentInviteStatus === 'rejected' && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 w-fit px-2 py-0.5 rounded-md border border-rose-200">
                    <X className="h-3 w-3" /> Declined
                  </div>
                )}

                <p className="mt-2 text-[10px] text-muted-foreground">{formatNotificationDate(notification.date)}</p>
              </div>

              {!notification.read && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
