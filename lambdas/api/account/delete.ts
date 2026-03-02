import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, success } from '../../shared/middleware';

const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID ?? '';

async function queryAllItems(
  pk: string,
  skPrefix: string,
): Promise<Array<{ PK: string; SK: string }>> {
  const items: Array<{ PK: string; SK: string }> = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': pk, ':sk': skPrefix },
        ProjectionExpression: 'PK, SK',
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of result.Items ?? []) {
      items.push({ PK: item.PK as string, SK: item.SK as string });
    }
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey !== undefined);

  return items;
}

async function batchDelete(items: Array<{ PK: string; SK: string }>): Promise<void> {
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await dynamo.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map((item) => ({
            DeleteRequest: { Key: { PK: item.PK, SK: item.SK } },
          })),
        },
      }),
    );
  }
}

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const userPk = `USER#${userId}`;

  // 1. Find all conversations to delete their messages
  const convos = await queryAllItems(userPk, 'CONVO#');
  for (const convo of convos) {
    const convoId = convo.SK.replace('CONVO#', '');
    const messages = await queryAllItems(`CONVO#${convoId}`, 'MSG#');
    await batchDelete(messages);
  }

  // 2. Delete all user-scoped entities (ideas, notes, convos, paths, nudges, profile)
  const allUserItems = await queryAllItems(userPk, '');
  await batchDelete(allUserItems);

  // 3. Delete Cognito user
  if (USER_POOL_ID !== '') {
    const username = event.requestContext.authorizer.jwt.claims['cognito:username'] as
      | string
      | undefined;
    if (username !== undefined && username !== '') {
      await cognito.send(
        new AdminDeleteUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
        }),
      );
    }
  }

  return success({ deleted: true });
});
