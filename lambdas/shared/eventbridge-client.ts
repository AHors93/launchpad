import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const client = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

export async function emitEvent(
  source: string,
  detailType: string,
  detail: Record<string, unknown>,
): Promise<void> {
  await client.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: EVENT_BUS_NAME,
          Source: source,
          DetailType: detailType,
          Detail: JSON.stringify(detail),
        },
      ],
    }),
  );
}
