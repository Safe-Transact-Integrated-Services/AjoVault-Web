import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const AppLayout = () => {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
