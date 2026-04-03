import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AgentRouteGuard = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">Loading agent portal...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" replace state={{ from: location }} />;
  }

  if (user?.role !== 'agent') {
    return <Navigate to="/agent/apply" replace state={{ from: location }} />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AgentRouteGuard;
