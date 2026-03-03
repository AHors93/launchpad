import type { IdeaStatus, TrackType } from '../types/idea';

export interface StatusConfig {
  value: IdeaStatus;
  label: string;
  color: string;
  isTerminal: boolean;
}

export interface TrackConfig {
  label: string;
  icon: string;
  statuses: StatusConfig[];
  staleThresholdDays: number;
  defaultStatus: IdeaStatus;
}

export const TRACK_TYPES = [
  'side_project',
  'job_application',
  'career_pivot',
  'course',
  'freelance',
  'custom',
] as const satisfies readonly TrackType[];

export const TRACK_CONFIG: Record<TrackType, TrackConfig> = {
  side_project: {
    label: 'Side Project',
    icon: '\u{1F680}',
    statuses: [
      { value: 'spark', label: '\u{1F4A1} Just a spark', color: '#f59e0b', isTerminal: false },
      { value: 'exploring', label: '\u{1F50D} Exploring it', color: '#8b5cf6', isTerminal: false },
      {
        value: 'building',
        label: '\u{1F528} Started building',
        color: '#3b82f6',
        isTerminal: false,
      },
      { value: 'shipped', label: '\u{1F680} Shipped!', color: '#10b981', isTerminal: true },
    ],
    staleThresholdDays: 7,
    defaultStatus: 'spark',
  },
  job_application: {
    label: 'Job Application',
    icon: '\u{1F4BC}',
    statuses: [
      { value: 'bookmarked', label: '\u{1F516} Bookmarked', color: '#64748b', isTerminal: false },
      { value: 'applied', label: '\u{1F4E8} Applied', color: '#8b5cf6', isTerminal: false },
      {
        value: 'interviewing',
        label: '\u{1F399}\u{FE0F} Interviewing',
        color: '#f59e0b',
        isTerminal: false,
      },
      { value: 'offer', label: '\u{1F4B0} Offer', color: '#3b82f6', isTerminal: false },
      { value: 'accepted', label: '\u{2705} Accepted', color: '#10b981', isTerminal: true },
      { value: 'rejected', label: '\u{274C} Rejected', color: '#ef4444', isTerminal: true },
    ],
    staleThresholdDays: 5,
    defaultStatus: 'bookmarked',
  },
  career_pivot: {
    label: 'Career Pivot',
    icon: '\u{1F504}',
    statuses: [
      { value: 'curious', label: '\u{1F914} Curious', color: '#f59e0b', isTerminal: false },
      {
        value: 'researching',
        label: '\u{1F4DA} Researching',
        color: '#8b5cf6',
        isTerminal: false,
      },
      {
        value: 'networking',
        label: '\u{1F91D} Networking',
        color: '#06b6d4',
        isTerminal: false,
      },
      {
        value: 'transitioning',
        label: '\u{1F3CB}\u{FE0F} Transitioning',
        color: '#3b82f6',
        isTerminal: false,
      },
      { value: 'landed', label: '\u{1F389} Landed', color: '#10b981', isTerminal: true },
    ],
    staleThresholdDays: 10,
    defaultStatus: 'curious',
  },
  course: {
    label: 'Course',
    icon: '\u{1F4DA}',
    statuses: [
      { value: 'interested', label: '\u{1F440} Interested', color: '#f59e0b', isTerminal: false },
      { value: 'applied', label: '\u{1F4E8} Applied', color: '#8b5cf6', isTerminal: false },
      { value: 'enrolled', label: '\u{1F393} Enrolled', color: '#06b6d4', isTerminal: false },
      {
        value: 'completing',
        label: '\u{1F4DD} Completing',
        color: '#3b82f6',
        isTerminal: false,
      },
      { value: 'completed', label: '\u{2705} Completed', color: '#10b981', isTerminal: true },
    ],
    staleThresholdDays: 14,
    defaultStatus: 'interested',
  },
  freelance: {
    label: 'Freelance',
    icon: '\u{1F4B0}',
    statuses: [
      { value: 'lead', label: '\u{1F3AF} Lead', color: '#f59e0b', isTerminal: false },
      { value: 'pitched', label: '\u{1F4E7} Pitched', color: '#8b5cf6', isTerminal: false },
      {
        value: 'negotiating',
        label: '\u{1F91D} Negotiating',
        color: '#f97316',
        isTerminal: false,
      },
      { value: 'active', label: '\u{26A1} Active', color: '#3b82f6', isTerminal: false },
      { value: 'delivered', label: '\u{1F4E6} Delivered', color: '#10b981', isTerminal: true },
    ],
    staleThresholdDays: 5,
    defaultStatus: 'lead',
  },
  custom: {
    label: 'Custom',
    icon: '\u{1F4CB}',
    statuses: [
      { value: 'to_do', label: '\u{1F4CC} To Do', color: '#64748b', isTerminal: false },
      { value: 'in_progress', label: '\u{1F3C3} In Progress', color: '#3b82f6', isTerminal: false },
      { value: 'done', label: '\u{2705} Done', color: '#10b981', isTerminal: true },
    ],
    staleThresholdDays: 7,
    defaultStatus: 'to_do',
  },
};

export const ALL_STATUSES = [
  'spark',
  'exploring',
  'building',
  'shipped',
  'bookmarked',
  'applied',
  'interviewing',
  'offer',
  'accepted',
  'rejected',
  'curious',
  'researching',
  'networking',
  'transitioning',
  'landed',
  'interested',
  'enrolled',
  'completing',
  'completed',
  'lead',
  'pitched',
  'negotiating',
  'active',
  'delivered',
  'to_do',
  'in_progress',
  'done',
] as const satisfies readonly IdeaStatus[];

export function getTrackConfig(trackType: TrackType): TrackConfig {
  return TRACK_CONFIG[trackType];
}

export function isValidStatusForTrack(status: IdeaStatus, trackType: TrackType): boolean {
  return TRACK_CONFIG[trackType].statuses.some((s) => s.value === status);
}

export function getTerminalStatuses(trackType: TrackType): IdeaStatus[] {
  return TRACK_CONFIG[trackType].statuses.filter((s) => s.isTerminal).map((s) => s.value);
}
