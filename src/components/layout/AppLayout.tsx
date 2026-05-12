import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const AppLayout = () => {
  return (
    <div className="mx-auto min-h-screen bg-background">
      <main className="mx-auto w-full max-w-7xl pb-20 lg:px-8 lg:pt-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
