import { Outlet } from 'react-router-dom';
import AgentBottomNav from './AgentBottomNav';

const AgentLayout = () => {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <main className="pb-20">
        <Outlet />
      </main>
      <AgentBottomNav />
    </div>
  );
};

export default AgentLayout;
