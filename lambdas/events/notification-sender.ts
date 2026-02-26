import type { EventBridgeEvent } from 'aws-lambda';

export const handler = async (
  event: EventBridgeEvent<string, Record<string, unknown>>,
): Promise<void> => {
  await Promise.resolve();
  // TODO: Phase 4 — Send push notifications via SNS + Expo
  void event;
};
