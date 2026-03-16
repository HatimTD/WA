// Analytics data types for different roles

export interface AdminAnalytics {
  casesOverTime: Array<{ month: string; count: number }>;
  casesByType: Array<{ type: string; count: number }>;
  casesByStatus: Array<{ status: string; count: number }>;
  casesByIndustry: Array<{ industry: string; count: number }>;
  topContributors: Array<{ name: string; points: number; cases: number }>;
  approvalRateOverTime: Array<{ month: string; rate: number; approved: number; submitted: number }>;
  summary: {
    totalCases: number;
    totalUsers: number;
    approvedCases: number;
    pendingCases: number;
  };
}

export interface ContributorAnalytics {
  submissionsOverTime: Array<{ month: string; count: number }>;
  casesByType: Array<{ type: string; count: number }>;
  casesByStatus: Array<{ status: string; count: number }>;
  badgeProgress: {
    EXPLORER: number;
    EXPERT: number;
    CHAMPION: number;
  };
  earnedBadges: string[];
  totalPoints: number;
  successRate: {
    approved: number;
    rejected: number;
    total: number;
    percentage: number;
  };
}

export interface ApproverAnalytics {
  reviewsOverTime: Array<{ month: string; approved: number; rejected: number; total: number }>;
  approvalRate: {
    approved: number;
    rejected: number;
    total: number;
    percentage: number;
  };
  reviewTimesByMonth: Array<{ month: string; avgDays: number }>;
  reviewedByType: Array<{ type: string; count: number }>;
  pendingCases: number;
}

export interface ViewerAnalytics {
  casesByIndustry: Array<{ industry: string; count: number }>;
  casesByRegion: Array<{ region: string; count: number }>;
  popularProducts: Array<{ product: string; count: number }>;
  summary: {
    totalApprovedCases: number;
    totalIndustries: number;
    totalRegions: number;
    totalProducts: number;
  };
}
