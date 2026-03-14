import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PlatformUserInvitePicker from '@/components/shared/PlatformUserInvitePicker';
import type { PlatformUserSearchResult } from '@/services/platformUsersApi';
import { inviteSavingsUser } from '@/services/savingsApi';
import { toast } from 'sonner';

const SavingsInvite = () => {
  const navigate = useNavigate();

  const handleInvite = async (user: PlatformUserSearchResult) => {
    await inviteSavingsUser({
      platformUserId: user.userId,
      channel: 'platform',
    });
    toast.success(`In-app savings invite sent to ${user.fullName}.`);
  };

  const handleContactInvite = async (contact: string, channel: 'email' | 'sms') => {
    await inviteSavingsUser({
      memberContact: contact,
      channel,
    });
    toast.success(`${channel.toUpperCase()} savings invite queued for ${contact}.`);
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate('/savings')} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-2 font-display text-2xl font-bold">Invite To Savings</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Search platform users by email or phone number and invite them into the AjoVault savings flow.
      </p>

      <PlatformUserInvitePicker
        onInvite={handleInvite}
        onInviteContact={handleContactInvite}
        showDirectContactInvite
        actionLabel="Invite on AjoVault"
        title="Invite Platform Users"
        description="Search existing AjoVault users by email or phone number, then send an in-app savings invite."
      />
    </div>
  );
};

export default SavingsInvite;
