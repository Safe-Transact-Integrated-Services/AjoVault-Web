import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';

import AppLayout from '@/components/layout/AppLayout';
import AgentLayout from '@/components/layout/AgentLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminRouteGuard from '@/components/layout/AdminRouteGuard';
import AuthRouteGuard from '@/components/layout/AuthRouteGuard';

import Welcome from '@/pages/Welcome';
import Signup from '@/pages/Signup';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import WalletHome from '@/pages/wallet/WalletHome';
import FundWallet from '@/pages/wallet/FundWallet';
import Transfer from '@/pages/wallet/Transfer';
import BillPayment from '@/pages/wallet/BillPayment';
import TransactionHistory from '@/pages/wallet/TransactionHistory';
import SavingsHome from '@/pages/savings/SavingsHome';
import CreateSavings from '@/pages/savings/CreateSavings';
import SavingsDetail from '@/pages/savings/SavingsDetail';
import CirclesHome from '@/pages/circles/CirclesHome';
import CreateCircle from '@/pages/circles/CreateCircle';
import JoinCircle from '@/pages/circles/JoinCircle';
import CircleDetail from '@/pages/circles/CircleDetail';
import CircleContribute from '@/pages/circles/CircleContribute';
import CircleInvite from '@/pages/circles/CircleInvite';
import CircleJoinInvite from '@/pages/circles/CircleJoinInvite';
import CirclePayout from '@/pages/circles/CirclePayout';
import Notifications from '@/pages/Notifications';
import MorePage from '@/pages/more/MorePage';
import Profile from '@/pages/more/Profile';
import KycUpgrade from '@/pages/more/KycUpgrade';
import Settings from '@/pages/more/Settings';
import NotFound from '@/pages/NotFound';

import AgentLogin from '@/pages/agent/AgentLogin';
import AgentDashboard from '@/pages/agent/AgentDashboard';
import AgentTransact from '@/pages/agent/AgentTransact';
import AgentRegister from '@/pages/agent/AgentRegister';
import AgentHistory from '@/pages/agent/AgentHistory';
import AgentMore from '@/pages/agent/AgentMore';
import AgentCustomers from '@/pages/agent/AgentCustomers';
import AgentCommissions from '@/pages/agent/AgentCommissions';
import BecomeAgent from '@/pages/agent/BecomeAgent';
import AgentLedger from '@/pages/agent/AgentLedger';
import AgentSettlements from '@/pages/agent/AgentSettlements';
import CreditPassport from '@/pages/CreditPassport';
import CooperativeHome from '@/pages/cooperative/CooperativeHome';
import CooperativeMembers from '@/pages/cooperative/CooperativeMembers';
import CooperativePrograms from '@/pages/cooperative/CooperativePrograms';
import CooperativeLoans from '@/pages/cooperative/CooperativeLoans';

import GroupGoalsHome from '@/pages/groupgoals/GroupGoalsHome';
import CreateGroupGoal from '@/pages/groupgoals/CreateGroupGoal';
import GroupGoalDetail from '@/pages/groupgoals/GroupGoalDetail';
import GroupGoalContribute from '@/pages/groupgoals/GroupGoalContribute';
import FundraisingHome from '@/pages/fundraising/FundraisingHome';
import CreateFundraiser from '@/pages/fundraising/CreateFundraiser';
import FundraiserDetail from '@/pages/fundraising/FundraiserDetail';
import DonateFundraiser from '@/pages/fundraising/DonateFundraiser';

import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminAgents from '@/pages/admin/AdminAgents';
import AdminTransactions from '@/pages/admin/AdminTransactions';
import AdminDisputes from '@/pages/admin/AdminDisputes';
import AdminSettings from '@/pages/admin/AdminSettings';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/agent/login" element={<AgentLogin />} />
              <Route path="/agent/apply" element={<BecomeAgent />} />

              <Route element={<AuthRouteGuard />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/wallet" element={<WalletHome />} />
                  <Route path="/savings" element={<SavingsHome />} />
                  <Route path="/circles" element={<CirclesHome />} />
                  <Route path="/more" element={<MorePage />} />
                </Route>

                <Route path="/wallet/fund" element={<FundWallet />} />
                <Route path="/wallet/transfer" element={<Transfer />} />
                <Route path="/wallet/bills" element={<BillPayment />} />
                <Route path="/wallet/history" element={<TransactionHistory />} />
                <Route path="/savings/create" element={<CreateSavings />} />
                <Route path="/savings/:id" element={<SavingsDetail />} />
                <Route path="/circles/create" element={<CreateCircle />} />
                <Route path="/circles/join" element={<JoinCircle />} />
                <Route path="/circles/:id" element={<CircleDetail />} />
                <Route path="/circles/:id/contribute" element={<CircleContribute />} />
                <Route path="/circles/:id/invite" element={<CircleInvite />} />
                <Route path="/circles/:id/payout" element={<CirclePayout />} />
                <Route path="/circles/join/:code" element={<CircleJoinInvite />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/more/profile" element={<Profile />} />
                <Route path="/more/kyc" element={<KycUpgrade />} />
                <Route path="/more/settings" element={<Settings />} />
                <Route path="/credit-passport" element={<CreditPassport />} />

                <Route path="/cooperative" element={<CooperativeHome />} />
                <Route path="/cooperative/members" element={<CooperativeMembers />} />
                <Route path="/cooperative/programs" element={<CooperativePrograms />} />
                <Route path="/cooperative/loans" element={<CooperativeLoans />} />

                <Route path="/group-goals" element={<GroupGoalsHome />} />
                <Route path="/group-goals/create" element={<CreateGroupGoal />} />
                <Route path="/group-goals/:id" element={<GroupGoalDetail />} />
                <Route path="/group-goals/:id/contribute" element={<GroupGoalContribute />} />

                <Route path="/fundraising" element={<FundraisingHome />} />
                <Route path="/fundraising/create" element={<CreateFundraiser />} />
                <Route path="/fundraising/:id" element={<FundraiserDetail />} />
                <Route path="/fundraising/:id/donate" element={<DonateFundraiser />} />
                <Route path="/fundraising/donate/:code" element={<DonateFundraiser />} />
              </Route>

              <Route element={<AgentLayout />}>
                <Route path="/agent" element={<AgentDashboard />} />
                <Route path="/agent/transact" element={<AgentTransact />} />
                <Route path="/agent/register" element={<AgentRegister />} />
                <Route path="/agent/history" element={<AgentHistory />} />
                <Route path="/agent/customers" element={<AgentCustomers />} />
                <Route path="/agent/commissions" element={<AgentCommissions />} />
                <Route path="/agent/ledger" element={<AgentLedger />} />
                <Route path="/agent/settlements" element={<AgentSettlements />} />
                <Route path="/agent/more" element={<AgentMore />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/agents" element={<AdminAgents />} />
                <Route path="/admin/transactions" element={<AdminTransactions />} />
                <Route path="/admin/disputes" element={<AdminDisputes />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
