import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, Bell, Info, LoaderCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { dashboardKeys } from '@/services/dashboardApi';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
} from '@/services/notificationsApi';

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
          description="Savings, circles, group-goal, and account activity will appear here."
        />
      )}

      <div className="space-y-2">
        {notifications.map(notification => {
          const Icon = iconMap[notification.type];
          return (
            <button
              key={notification.id}
              onClick={() => void handleNotificationClick(notification.id, notification.link)}
              className={`flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors ${
                notification.read ? 'border-border' : 'border-accent/30 bg-accent/5'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorMap[notification.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${notification.read ? 'font-medium' : 'font-semibold'} text-foreground`}>
                  {notification.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{formatNotificationDate(notification.date)}</p>
              </div>
              {!notification.read && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
