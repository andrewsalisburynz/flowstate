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
  category: 'aging_cards' | 'workload_imbalance' | 'column_bottleneck';
  message: string;
  affectedCards?: string[];
  affectedColumn?: string;
  recommendations: string[];
}
