import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminRouteGuard = ({ children }: { children?: React.ReactNode }) => {
  const { isAdminAuthenticated, isAdminInitializing } = useAdminAuth();

  if (isAdminInitializing) {
    return null;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminRouteGuard;
