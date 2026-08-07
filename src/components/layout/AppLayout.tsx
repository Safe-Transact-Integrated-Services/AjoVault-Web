import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import PublicNavbar from './PublicNavbar';
import { useAuth } from '@/contexts/AuthContext';

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isFullWidthPage = location.pathname.startsWith('/fundraising');

  return (
    <div className="mx-auto min-h-screen bg-background">
      {!isAuthenticated && <PublicNavbar />}

      <main
        className={
          isFullWidthPage
            ? isAuthenticated
              ? 'w-full pb-20'
              : 'w-full pb-0'
            : isAuthenticated
            ? 'mx-auto w-full max-w-2xl pb-20 lg:px-8 lg:pt-8'
            : 'mx-auto w-full max-w-2xl pb-4 lg:px-8 lg:pt-8'
        }
      >
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
