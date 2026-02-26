import { IdeaStatus } from '@/types/idea';

export const STATUS_LABELS: Record<IdeaStatus, string> = {
  spark: '💡 Spark',
  exploring: '🔍 Exploring',
  building: '🔨 Building',
  shipped: '🚀 Shipped',
};

export const STATUS_COLORS: Record<IdeaStatus, string> = {
  spark: '#f59e0b',
  exploring: '#8b5cf6',
  building: '#3b82f6',
  shipped: '#10b981',
};

export const IDEA_STATUSES: IdeaStatus[] = ['spark', 'exploring', 'building', 'shipped'];

export const ENCOURAGEMENTS = [
  'Every massive company started as a scribble on a napkin.',
  "You don't need permission to start. Just start.",
  'The best time to begin was yesterday. The second best is now.',
  'Done is better than perfect. Ship something ugly.',
  "Nobody's first version was good. That's the point.",
  "You're closer than you think. One small step today.",
  "The gap between 'thinking about it' and 'doing it' is smaller than you feel.",
  'Trades pay well, tech pays well — what pays best is doing something you actually care about.',
  'An idea without action is just a daydream. Give it 20 minutes.',
  "You don't have to quit everything to start something.",
];

export const IDEA_PROMPTS = [
  'What problem do you hit every week that nobody has solved well?',
  'What app do you wish existed on your phone right now?',
  "What's the most tedious part of your day that could be automated?",
  'What do people always ask you for help with?',
  'What would you build if you had a free weekend and zero fear of failure?',
  "What's something your industry does terribly that you could fix?",
  "What's a tool you use daily that frustrates you?",
  'What would make your morning routine 10x better?',
  'What do you spend too much time googling?',
  'If you could wave a magic wand and have one app, what would it do?',
];
