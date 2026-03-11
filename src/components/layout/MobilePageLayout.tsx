import { Outlet } from 'react-router-dom';

const MobilePageLayout = () => {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <Outlet />
    </div>
  );
};

export default MobilePageLayout;
