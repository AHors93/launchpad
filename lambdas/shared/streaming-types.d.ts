import type { Writable } from 'stream';

import type { APIGatewayProxyEventV2 } from 'aws-lambda';

declare global {
  type StreamHandler = (
    event: APIGatewayProxyEventV2,
    responseStream: Writable,
    context: unknown,
  ) => Promise<void>;

  namespace awslambda {
    function streamifyResponse(handler: StreamHandler): unknown;
    namespace HttpResponseStream {
      function from(
        stream: Writable,
        metadata: {
          statusCode: number;
          headers: Record<string, string>;
        },
      ): Writable;
    }
  }
}

export {};
