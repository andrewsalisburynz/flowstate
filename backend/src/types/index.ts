export interface Card {
  id: string;
  title: string;
  description: string;
  column: string;
  position: number;
  storyPoints?: number;
  priority?: 'low' | 'medium' | 'high';
  acceptanceCriteria?: string[];
  aiGenerated?: boolean;
  columnEnteredAt?: string; // ISO timestamp when card entered current column
  assignees?: string[]; // Array of team member IDs
  assignedAt?: string; // ISO timestamp when last assigned/reassigned
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  title: string;
  description: string;
  column: string;
  position?: number;
  storyPoints?: number;
  priority?: 'low' | 'medium' | 'high';
  acceptanceCriteria?: string[];
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  column?: string;
  position?: number;
  storyPoints?: number;
  priority?: 'low' | 'medium' | 'high';
  acceptanceCriteria?: string[];
  assignees?: string[];
}

export interface AICardSuggestion {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  priority: 'low' | 'medium' | 'high';
}

export interface BottleneckAlert {
  severity: 'low' | 'medium' | 'high';
  category: 'aging_cards' | 'workload_imbalance' | 'column_bottleneck' | 'team_member_overload' | 'unassigned_card' | 'workload_imbalance_team';
  message: string;
  affectedCards?: string[];
  affectedColumn?: string;
  affectedTeamMember?: string;
  currentWorkload?: number;
  threshold?: number;
  overloadedMembers?: Array<{ id: string; name: string; workload: number }>;
  idleMembers?: Array<{ id: string; name: string; workload: number }>;
  recommendations: string[];
}

export interface CardSplitSuggestion {
  originalCard: AICardSuggestion;
  reason: string;
  splitCards: AICardSuggestion[];
}

export interface TeamMember {
  id: string;
  name: string;
  nameLowercase: string; // For uniqueness checks
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberRequest {
  name: string;
}

export interface UpdateTeamMemberRequest {
  name: string;
}
