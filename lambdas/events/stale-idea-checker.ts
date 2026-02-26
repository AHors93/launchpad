import type { ScheduledEvent } from 'aws-lambda';

export const handler = async (event: ScheduledEvent): Promise<void> => {
  await Promise.resolve();
  // TODO: Phase 4 — Query for stale ideas and generate nudges
  void event;
};
