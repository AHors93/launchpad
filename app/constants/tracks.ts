import type { IdeaStatus, TrackType } from '@/types/idea';

export interface StatusConfig {
  value: IdeaStatus;
  label: string;
  color: string;
  isTerminal: boolean;
}

export interface TrackConfig {
  label: string;
  icon: string;
  description: string;
  statuses: StatusConfig[];
  defaultStatus: IdeaStatus;
}

export const TRACK_TYPES: readonly TrackType[] = [
  'side_project',
  'job_application',
  'career_pivot',
  'course',
  'freelance',
  'custom',
];

export const TRACK_CONFIG: Record<TrackType, TrackConfig> = {
  side_project: {
    label: 'Side Project',
    icon: '\u{1F680}',
    description: 'Build something from scratch',
    statuses: [
      { value: 'spark', label: '\u{1F4A1} Just a spark', color: '#f0b429', isTerminal: false },
      { value: 'exploring', label: '\u{1F50D} Exploring it', color: '#9b6dff', isTerminal: false },
      {
        value: 'building',
        label: '\u{1F528} Started building',
        color: '#4a9eff',
        isTerminal: false,
      },
      { value: 'shipped', label: '\u{1F680} Shipped!', color: '#2ec98e', isTerminal: true },
    ],
    defaultStatus: 'spark',
  },
  job_application: {
    label: 'Job Application',
    icon: '\u{1F4BC}',
    description: 'Track your applications',
    statuses: [
      { value: 'bookmarked', label: '\u{1F516} Bookmarked', color: '#6b5c4d', isTerminal: false },
      { value: 'applied', label: '\u{1F4E8} Applied', color: '#9b6dff', isTerminal: false },
      {
        value: 'interviewing',
        label: '\u{1F399}\u{FE0F} Interviewing',
        color: '#f0b429',
        isTerminal: false,
      },
      { value: 'offer', label: '\u{1F4B0} Offer', color: '#4a9eff', isTerminal: false },
      { value: 'accepted', label: '\u{2705} Accepted', color: '#2ec98e', isTerminal: true },
      { value: 'rejected', label: '\u{274C} Rejected', color: '#e8534a', isTerminal: true },
    ],
    defaultStatus: 'bookmarked',
  },
  career_pivot: {
    label: 'Career Pivot',
    icon: '\u{1F504}',
    description: 'Navigate a career change',
    statuses: [
      { value: 'curious', label: '\u{1F914} Curious', color: '#f0b429', isTerminal: false },
      {
        value: 'researching',
        label: '\u{1F4DA} Researching',
        color: '#9b6dff',
        isTerminal: false,
      },
      {
        value: 'networking',
        label: '\u{1F91D} Networking',
        color: '#22b8cf',
        isTerminal: false,
      },
      {
        value: 'transitioning',
        label: '\u{1F3CB}\u{FE0F} Transitioning',
        color: '#4a9eff',
        isTerminal: false,
      },
      { value: 'landed', label: '\u{1F389} Landed', color: '#2ec98e', isTerminal: true },
    ],
    defaultStatus: 'curious',
  },
  course: {
    label: 'Course',
    icon: '\u{1F4DA}',
    description: 'Track a course or programme',
    statuses: [
      { value: 'interested', label: '\u{1F440} Interested', color: '#f0b429', isTerminal: false },
      { value: 'applied', label: '\u{1F4E8} Applied', color: '#9b6dff', isTerminal: false },
      { value: 'enrolled', label: '\u{1F393} Enrolled', color: '#22b8cf', isTerminal: false },
      {
        value: 'completing',
        label: '\u{1F4DD} Completing',
        color: '#4a9eff',
        isTerminal: false,
      },
      { value: 'completed', label: '\u{2705} Completed', color: '#2ec98e', isTerminal: true },
    ],
    defaultStatus: 'interested',
  },
  freelance: {
    label: 'Freelance',
    icon: '\u{1F4B0}',
    description: 'Manage freelance projects',
    statuses: [
      { value: 'lead', label: '\u{1F3AF} Lead', color: '#f0b429', isTerminal: false },
      { value: 'pitched', label: '\u{1F4E7} Pitched', color: '#9b6dff', isTerminal: false },
      {
        value: 'negotiating',
        label: '\u{1F91D} Negotiating',
        color: '#f08a3b',
        isTerminal: false,
      },
      { value: 'active', label: '\u{26A1} Active', color: '#4a9eff', isTerminal: false },
      { value: 'delivered', label: '\u{1F4E6} Delivered', color: '#2ec98e', isTerminal: true },
    ],
    defaultStatus: 'lead',
  },
  custom: {
    label: 'Custom',
    icon: '\u{1F4CB}',
    description: 'Track anything you want',
    statuses: [
      { value: 'to_do', label: '\u{1F4CC} To Do', color: '#6b5c4d', isTerminal: false },
      { value: 'in_progress', label: '\u{1F3C3} In Progress', color: '#4a9eff', isTerminal: false },
      { value: 'done', label: '\u{2705} Done', color: '#2ec98e', isTerminal: true },
    ],
    defaultStatus: 'to_do',
  },
};

export function getTrackConfig(trackType: TrackType): TrackConfig {
  return TRACK_CONFIG[trackType];
}

export function getStatusesForTrack(trackType: TrackType): StatusConfig[] {
  return TRACK_CONFIG[trackType].statuses;
}

export const TRACK_PROMPTS: Record<TrackType, string> = {
  side_project: 'What would you build if you had zero fear of failure?',
  job_application: 'What company or role caught your eye?',
  career_pivot: 'What field or role are you curious about?',
  course: 'What do you want to learn?',
  freelance: 'What project or client are you chasing?',
  custom: 'What are you working on?',
};

export const TRACK_PLACEHOLDERS: Record<TrackType, string> = {
  side_project: 'Your idea in a few words...',
  job_application: 'Company name or role...',
  career_pivot: 'The career you have in mind...',
  course: 'Course or programme name...',
  freelance: 'Client or project name...',
  custom: 'What are you tracking?',
};

export const TRACK_BUTTON_LABELS: Record<TrackType, string> = {
  side_project: 'Save idea',
  job_application: 'Add application',
  career_pivot: 'Track this pivot',
  course: 'Add course',
  freelance: 'Add project',
  custom: 'Add item',
};
