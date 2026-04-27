import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminRouteGuard = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const { isAdminAuthenticated, isAdminInitializing } = useAdminAuth();

  if (isAdminInitializing) {
    return null;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminRouteGuard;
