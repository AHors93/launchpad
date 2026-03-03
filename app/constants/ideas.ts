import { TRACK_CONFIG } from '@/constants/tracks';
import type { IdeaStatus } from '@/types/idea';

// Backwards-compatible exports derived from side_project track
const sideProjectStatuses = TRACK_CONFIG.side_project.statuses;

type SideProjectStatus = 'spark' | 'exploring' | 'building' | 'shipped';

export const STATUS_LABELS: Record<SideProjectStatus, string> = {
  spark: sideProjectStatuses[0].label,
  exploring: sideProjectStatuses[1].label,
  building: sideProjectStatuses[2].label,
  shipped: sideProjectStatuses[3].label,
};

export const STATUS_COLORS: Record<SideProjectStatus, string> = {
  spark: sideProjectStatuses[0].color,
  exploring: sideProjectStatuses[1].color,
  building: sideProjectStatuses[2].color,
  shipped: sideProjectStatuses[3].color,
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
