export interface Event {
  id: string;
  uid: string;
  name: string;
  description: string;
  type: string;
  isBoxscoreLinked: boolean;
  startDate: string;
  endDate: string;
  accepted: boolean;
  progress: Progress;
  steps: Step[];
}

export interface Progress {
  currentValue: number;
  lastUpdate: string;
}

export interface Step {
  step: number;
  conditionValue: number;
  status: string;
  rewards: Reward[];
}

export interface Reward {
  code: string;
  type: string;
  amount: number;
}

// My Events response type
export type EventItem = {
  id: string;
  uid: string;
  name: string;
  type: string;
  isBoxscoreLinked: boolean;
  startDate: string;
  endDate: string;
  accepted: boolean;
  progress?: {
    currentValue: number;
    lastUpdate: string;
  };
  steps: EventStep[];
};

export type EventStep = {
  step: number;
  conditionValue: number;
  status: "AVAILABLE" | "LOCKED" | "CLAIMED" | string;
  rewards: Reward[];
};

export type RewardCode = "COINS" | "GEMS" | "XP" | string;

export type RewardItem = {
  code?: RewardCode;
  type?: string;
  amount: number;
  isSurprise?: boolean;
};

export type MilestoneItem = {
  step: number;
  conditionValue: number;
  status: "LOCKED" | "AVAILABLE" | "CLAIMED" | "COMPLETED" | string;
  rewards: RewardItem[];
};

export type CompetitiveReward = {
  rankFrom: number;
  rankTo: number;
  label?: string;
  rewardType?: string;
  code?: RewardCode;
  amount: number;
};

export type EventComplexItem = {
  id: number | string;
  uid?: string;
  name: string;
  description?: string;
  type?: string;
  accepted?: boolean;
  isBoxscoreLinked?: boolean;
  startDate?: string;
  endDate?: string;
  progress?: {
    currentValue: number;
    lastUpdate?: string;
  };
  milestones?: MilestoneItem[];
  rankingConfig?: {
    enabled: boolean;
  };
  competitiveRewards?: CompetitiveReward[];
};