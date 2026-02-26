export const IDEA_STATUSES = ['spark', 'exploring', 'building', 'shipped'] as const;

export const STATUS_LABELS: Record<(typeof IDEA_STATUSES)[number], string> = {
  spark: '💡 Spark',
  exploring: '🔍 Exploring',
  building: '🔨 Building',
  shipped: '🚀 Shipped',
};

export const STATUS_COLORS: Record<(typeof IDEA_STATUSES)[number], string> = {
  spark: '#f59e0b',
  exploring: '#8b5cf6',
  building: '#3b82f6',
  shipped: '#10b981',
};
