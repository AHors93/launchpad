import * as crypto from 'crypto';

import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { appleSignInSchema } from '@launchpad/shared';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';

const cognitoClient = new CognitoIdentityProviderClient({});
const ssm = new SSMClient({});

const USER_POOL_ID = process.env.USER_POOL_ID ?? '';
const APPLE_AUTH_SECRET_PARAM = process.env.APPLE_AUTH_SECRET_PARAM ?? '';
const BUNDLE_ID = 'com.adamhorscraft.launchpad';

// ── Apple JWT Verification ───────────────────────────────

interface AppleJWK {
  [key: string]: unknown;
  kid: string;
}

interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
}

let cachedJwks: AppleJWK[] | undefined;
let jwksCachedAt = 0;
const JWKS_CACHE_TTL = 3600_000; // 1 hour

async function fetchAppleJwks(): Promise<AppleJWK[]> {
  if (cachedJwks !== undefined && Date.now() - jwksCachedAt < JWKS_CACHE_TTL) {
    return cachedJwks;
  }
  const response = await fetch('https://appleid.apple.com/auth/keys');
  const data = (await response.json()) as { keys: AppleJWK[] };
  cachedJwks = data.keys;
  jwksCachedAt = Date.now();
  return data.keys;
}

async function verifyAppleToken(identityToken: string): Promise<AppleTokenPayload> {
  const parts = identityToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as { kid: string };
  const jwks = await fetchAppleJwks();
  const jwk = jwks.find((k) => k.kid === header.kid);
  if (jwk === undefined) throw new Error('No matching Apple signing key');

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const data = Buffer.from(`${parts[0]}.${parts[1]}`);
  const signature = Buffer.from(parts[2], 'base64url');

  const isValid = crypto.verify('sha256', data, publicKey, signature);
  if (!isValid) throw new Error('Invalid token signature');

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as AppleTokenPayload;

  if (payload.iss !== 'https://appleid.apple.com') throw new Error('Invalid issuer');
  if (payload.aud !== BUNDLE_ID) throw new Error('Invalid audience');
  if (payload.exp * 1000 < Date.now()) throw new Error('Token expired');

  return payload;
}

// ── Auth Key Derivation ──────────────────────────────────

let cachedSecret: string | undefined;

async function getAuthSecret(): Promise<string> {
  if (cachedSecret !== undefined) return cachedSecret;
  const result = await ssm.send(
    new GetParameterCommand({ Name: APPLE_AUTH_SECRET_PARAM, WithDecryption: true }),
  );
  cachedSecret = result.Parameter?.Value ?? '';
  if (cachedSecret === '') throw new Error('Apple auth secret not configured');
  return cachedSecret;
}

async function deriveAuthKey(appleSub: string): Promise<string> {
  const secret = await getAuthSecret();
  return crypto.createHmac('sha256', secret).update(appleSub).digest('hex');
}

// ── DynamoDB Helpers ─────────────────────────────────────

async function getAppleUser(appleSub: string): Promise<{ email: string } | undefined> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `APPLE#${appleSub}`, SK: 'AUTH' },
    }),
  );
  if (result.Item === undefined) return undefined;
  return { email: result.Item.email as string };
}

async function storeAppleMapping(appleSub: string, email: string): Promise<void> {
  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `APPLE#${appleSub}`,
        SK: 'AUTH',
        email,
        createdAt: new Date().toISOString(),
      },
    }),
  );
}

// ── Cognito Helpers ──────────────────────────────────────

async function findCognitoUserByEmail(email: string): Promise<boolean> {
  const result = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1,
    }),
  );
  return (result.Users?.length ?? 0) > 0;
}

async function createCognitoUser(
  email: string,
  password: string,
  fullName?: { givenName?: string | null; familyName?: string | null },
): Promise<void> {
  const userAttributes = [
    { Name: 'email', Value: email },
    { Name: 'email_verified', Value: 'true' },
  ];

  if (
    fullName?.givenName !== undefined &&
    fullName.givenName !== null &&
    fullName.givenName !== ''
  ) {
    userAttributes.push({ Name: 'given_name', Value: fullName.givenName });
  }
  if (
    fullName?.familyName !== undefined &&
    fullName.familyName !== null &&
    fullName.familyName !== ''
  ) {
    userAttributes.push({ Name: 'family_name', Value: fullName.familyName });
  }

  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      TemporaryPassword: `Temp${crypto.randomBytes(16).toString('hex')}!`,
      MessageAction: 'SUPPRESS',
      UserAttributes: userAttributes,
    }),
  );

  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }),
  );
}

async function ensurePassword(email: string, password: string): Promise<void> {
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }),
  );
}

// ── Response Helpers ─────────────────────────────────────

function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── Handler ──────────────────────────────────────────────

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    if (event.body === undefined || event.body === null || event.body === '') {
      return jsonResponse(400, { error: 'Request body is required' });
    }

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString()
      : event.body;
    const parsed = appleSignInSchema.parse(JSON.parse(rawBody));

    // 1. Verify Apple identity token
    const appleUser = await verifyAppleToken(parsed.identityToken);
    if (appleUser.email === undefined) {
      return jsonResponse(400, {
        error: 'Email not provided by Apple. Please allow email sharing.',
      });
    }

    const email = appleUser.email.toLowerCase();

    // 2. Check for existing Apple user
    const existing = await getAppleUser(appleUser.sub);

    if (existing !== undefined) {
      // Returning user — ensure password is current and return auth key
      const authKey = await deriveAuthKey(appleUser.sub);
      await ensurePassword(existing.email, authKey);
      return jsonResponse(200, { email: existing.email, authKey });
    }

    // 3. New user — check if email already exists in Cognito
    const emailExists = await findCognitoUserByEmail(email);
    if (emailExists) {
      return jsonResponse(409, {
        error: 'An account already exists with this email. Please sign in with your password.',
      });
    }

    // 4. Create Cognito user
    const authKey = await deriveAuthKey(appleUser.sub);
    await createCognitoUser(email, authKey, parsed.fullName ?? undefined);

    // 5. Store Apple → user mapping
    await storeAppleMapping(appleUser.sub, email);

    return jsonResponse(200, { email, authKey, isNewUser: true });
  } catch (err) {
    console.error('Apple sign-in error:', err);
    const message = err instanceof Error ? err.message : 'Apple sign-in failed';
    return jsonResponse(500, { error: message });
  }
};
