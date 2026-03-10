import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, AlertTriangle, Trophy, Info } from 'lucide-react';
import { mockNotifications, formatDate, formatTime } from '@/services/mockData';

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

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold mb-4">Notifications</h1>

      <div className="space-y-2">
        {mockNotifications.map(n => {
          const Icon = iconMap[n.type];
          return (
            <button
              key={n.id}
              onClick={() => n.link && navigate(n.link)}
              className={`flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors ${n.read ? 'border-border' : 'border-accent/30 bg-accent/5'}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorMap[n.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? 'text-foreground' : 'text-foreground font-semibold'}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.date)} · {formatTime(n.date)}</p>
              </div>
              {!n.read && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
