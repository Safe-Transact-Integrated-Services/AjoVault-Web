import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminRouteGuard = ({ children }: { children?: React.ReactNode }) => {
  const { isAdminAuthenticated } = useAdminAuth();

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminRouteGuard;
