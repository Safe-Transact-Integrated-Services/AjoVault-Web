import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const AppLayout = () => {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/dashboard' || pathname === '/';

  return (
    <div className="mx-auto min-h-screen bg-background">
      <main className={`mx-auto w-full pb-20 lg:px-8 lg:pt-8 ${isDashboard ? 'max-w-7xl' : 'max-w-2xl'}`}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
