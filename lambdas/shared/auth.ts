import { CognitoJwtVerifier } from 'aws-jwt-verify';

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier(): ReturnType<typeof CognitoJwtVerifier.create> {
  if (verifier === null) {
    const userPoolId = process.env.USER_POOL_ID;
    const clientId = process.env.USER_POOL_CLIENT_ID;
    if (
      userPoolId === undefined ||
      userPoolId === '' ||
      clientId === undefined ||
      clientId === ''
    ) {
      throw new Error('USER_POOL_ID and USER_POOL_CLIENT_ID must be set');
    }
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      clientId,
      tokenUse: 'id',
    });
  }
  return verifier;
}

export async function validateToken(authHeader: string | undefined): Promise<string> {
  if (authHeader === undefined || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = authHeader.slice(7);
  const payload = await getVerifier().verify(token);
  return payload.sub;
}
