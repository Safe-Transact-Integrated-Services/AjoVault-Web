export interface GroupGoal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  image?: string;
  memberCount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  contributionAmount: number;
  deadline: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
  category: 'property' | 'vehicle' | 'equipment' | 'education' | 'other';
  creatorName: string;
  members: GroupGoalMember[];
}

export interface GroupGoalMember {
  id: string;
  name: string;
  avatar?: string;
  totalContributed: number;
  lastContributionDate: string;
}

export interface Fundraiser {
  id: string;
  title: string;
  description: string;
  story: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  image?: string;
  category: 'event' | 'project' | 'emergency' | 'community' | 'education' | 'health';
  deadline: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
  isPublic: boolean;
  creatorName: string;
  donorCount: number;
  recentDonors: FundraiserDonor[];
  shareCode: string;
}

export interface FundraiserDonor {
  id: string;
  name: string;
  amount: number;
  date: string;
  isAnonymous: boolean;
}
