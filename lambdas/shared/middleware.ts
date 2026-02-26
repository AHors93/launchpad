import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';

export type AuthenticatedEvent = APIGatewayProxyEventV2WithJWTAuthorizer;

export function getUserId(event: AuthenticatedEvent): string {
  return event.requestContext.authorizer.jwt.claims.sub as string;
}

export function parseBody<T>(event: AuthenticatedEvent): T {
  if (event.body === null || event.body === undefined || event.body === '') {
    throw new ApiError(400, 'Request body is required');
  }
  try {
    return JSON.parse(
      event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body,
    ) as T;
  } catch {
    throw new ApiError(400, 'Invalid JSON in request body');
  }
}

export function getPathParam(event: AuthenticatedEvent, name: string): string {
  const value = event.pathParameters?.[name];
  if (value === null || value === undefined || value === '') {
    throw new ApiError(400, `Missing path parameter: ${name}`);
  }
  return value;
}

export function getQueryParam(event: AuthenticatedEvent, name: string): string | undefined {
  return event.queryStringParameters?.[name];
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function success(body: unknown, statusCode = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function error(err: unknown): APIGatewayProxyResultV2 {
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
  console.error('Unhandled error:', err);
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Internal server error' }),
  };
}

export function withErrorHandling(
  handler: (event: AuthenticatedEvent) => Promise<APIGatewayProxyResultV2>,
) {
  return async (event: AuthenticatedEvent): Promise<APIGatewayProxyResultV2> => {
    try {
      return await handler(event);
    } catch (err) {
      return error(err);
    }
  };
}
