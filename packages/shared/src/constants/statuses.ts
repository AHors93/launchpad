// Backwards-compatible re-exports — prefer importing from tracks.ts directly
import { TRACK_CONFIG } from './tracks';

const sideProjectStatuses = TRACK_CONFIG.side_project.statuses;

export const IDEA_STATUSES = ['spark', 'exploring', 'building', 'shipped'] as const;

export const STATUS_LABELS: Record<(typeof IDEA_STATUSES)[number], string> = {
  spark: sideProjectStatuses[0].label,
  exploring: sideProjectStatuses[1].label,
  building: sideProjectStatuses[2].label,
  shipped: sideProjectStatuses[3].label,
};

export const STATUS_COLORS: Record<(typeof IDEA_STATUSES)[number], string> = {
  spark: sideProjectStatuses[0].color,
  exploring: sideProjectStatuses[1].color,
  building: sideProjectStatuses[2].color,
  shipped: sideProjectStatuses[3].color,
};
