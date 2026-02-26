import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  const userPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;
  if (userPoolId === undefined || userPoolId === '' || clientId === undefined || clientId === '') {
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: clientId,
        signUpVerificationMethod: 'code',
        loginWith: {
          email: true,
        },
      },
    },
  });
}
