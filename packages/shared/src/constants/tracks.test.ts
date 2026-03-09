import {
  ALL_STATUSES,
  getTerminalStatuses,
  getTrackConfig,
  isValidStatusForTrack,
  TRACK_CONFIG,
  TRACK_TYPES,
} from './tracks';

describe('TRACK_TYPES', () => {
  it('contains all 6 track types', () => {
    expect(TRACK_TYPES).toHaveLength(6);
    expect(TRACK_TYPES).toContain('side_project');
    expect(TRACK_TYPES).toContain('job_application');
    expect(TRACK_TYPES).toContain('career_pivot');
    expect(TRACK_TYPES).toContain('course');
    expect(TRACK_TYPES).toContain('freelance');
    expect(TRACK_TYPES).toContain('custom');
  });
});

describe('TRACK_CONFIG', () => {
  it('has a config entry for every track type', () => {
    for (const trackType of TRACK_TYPES) {
      expect(TRACK_CONFIG[trackType]).toBeDefined();
    }
  });

  it.each(TRACK_TYPES)('%s has required fields', (trackType) => {
    const config = TRACK_CONFIG[trackType];
    expect(config.label).toBeTruthy();
    expect(config.icon).toBeTruthy();
    expect(config.statuses.length).toBeGreaterThan(0);
    expect(config.defaultStatus).toBeTruthy();
  });

  it.each(TRACK_TYPES)('%s defaultStatus is in its own statuses', (trackType) => {
    const config = TRACK_CONFIG[trackType];
    const statusValues = config.statuses.map((s) => s.value);
    expect(statusValues).toContain(config.defaultStatus);
  });

  it.each(TRACK_TYPES)('%s has at least one terminal status', (trackType) => {
    const config = TRACK_CONFIG[trackType];
    const terminals = config.statuses.filter((s) => s.isTerminal);
    expect(terminals.length).toBeGreaterThanOrEqual(1);
  });

  it.each(TRACK_TYPES)('%s statuses all have label, color, and value', (trackType) => {
    const config = TRACK_CONFIG[trackType];
    for (const status of config.statuses) {
      expect(status.value).toBeTruthy();
      expect(status.label).toBeTruthy();
      expect(status.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(typeof status.isTerminal).toBe('boolean');
    }
  });

  it('side_project has correct pipeline', () => {
    const config = TRACK_CONFIG.side_project;
    expect(config.statuses.map((s) => s.value)).toEqual([
      'spark',
      'exploring',
      'building',
      'shipped',
    ]);
    expect(config.defaultStatus).toBe('spark');
  });

  it('job_application has accepted and rejected as terminal', () => {
    const config = TRACK_CONFIG.job_application;
    const terminals = config.statuses.filter((s) => s.isTerminal).map((s) => s.value);
    expect(terminals).toEqual(['accepted', 'rejected']);
  });
});

describe('ALL_STATUSES', () => {
  it('contains every status from every track', () => {
    for (const trackType of TRACK_TYPES) {
      for (const status of TRACK_CONFIG[trackType].statuses) {
        expect(ALL_STATUSES).toContain(status.value);
      }
    }
  });

  it('has no duplicates beyond shared values', () => {
    // 'applied' is shared between job_application and course — that's fine,
    // but the ALL_STATUSES array should have unique entries
    const unique = new Set(ALL_STATUSES);
    expect(unique.size).toBe(ALL_STATUSES.length);
  });
});

describe('getTrackConfig', () => {
  it('returns the correct config for each track type', () => {
    for (const trackType of TRACK_TYPES) {
      expect(getTrackConfig(trackType)).toBe(TRACK_CONFIG[trackType]);
    }
  });
});

describe('isValidStatusForTrack', () => {
  it('returns true for valid status/track combinations', () => {
    expect(isValidStatusForTrack('spark', 'side_project')).toBe(true);
    expect(isValidStatusForTrack('bookmarked', 'job_application')).toBe(true);
    expect(isValidStatusForTrack('to_do', 'custom')).toBe(true);
  });

  it('returns false for invalid status/track combinations', () => {
    expect(isValidStatusForTrack('shipped', 'job_application')).toBe(false);
    expect(isValidStatusForTrack('bookmarked', 'side_project')).toBe(false);
    expect(isValidStatusForTrack('landed', 'freelance')).toBe(false);
  });
});

describe('getTerminalStatuses', () => {
  it('returns terminal statuses for side_project', () => {
    expect(getTerminalStatuses('side_project')).toEqual(['shipped']);
  });

  it('returns terminal statuses for job_application', () => {
    expect(getTerminalStatuses('job_application')).toEqual(['accepted', 'rejected']);
  });

  it('returns terminal statuses for custom', () => {
    expect(getTerminalStatuses('custom')).toEqual(['done']);
  });
});
