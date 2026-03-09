import * as path from 'path';

import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

interface StatelessStackProps extends cdk.StackProps {
  stage: string;
  table: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class StatelessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StatelessStackProps) {
    super(scope, id, props);

    const { stage, table, userPool, userPoolClient } = props;

    // ─── API Gateway ────────────────────────────────────────────
    const authorizer = new HttpUserPoolAuthorizer('CognitoAuthorizer', userPool, {
      userPoolClients: [userPoolClient],
    });

    const api = new apigatewayv2.HttpApi(this, 'Api', {
      apiName: `launchpad-${stage}-api`,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: ['Authorization', 'Content-Type'],
      },
    });

    // ─── EventBridge ────────────────────────────────────────────
    const eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: `launchpad-${stage}-events`,
    });

    // ─── Lambda Helpers ─────────────────────────────────────────
    const sharedEnv = {
      TABLE_NAME: table.tableName,
      EVENT_BUS_NAME: eventBus.eventBusName,
      STAGE: stage,
    };

    const claudeEnv = { ANTHROPIC_API_KEY_PARAM: `/launchpad/${stage}/anthropic-api-key` };

    const ssmApiKeyArn = cdk.Stack.of(this).formatArn({
      service: 'ssm',
      resource: 'parameter',
      resourceName: `launchpad/${stage}/anthropic-api-key`,
    });

    const createApiHandler = (
      name: string,
      entry: string,
      extraEnv: Record<string, string> = {},
    ) => {
      const fn = new lambdaNode.NodejsFunction(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '..', '..', 'lambdas', entry),
        environment: { ...sharedEnv, ...extraEnv },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        bundling: {
          externalModules: ['@aws-sdk/*'],
          minify: true,
          sourceMap: true,
        },
      });
      table.grantReadWriteData(fn);
      eventBus.grantPutEventsTo(fn);
      // Grant SSM read for API key if this handler uses Claude
      if (extraEnv.ANTHROPIC_API_KEY_PARAM !== undefined) {
        fn.addToRolePolicy(
          new iam.PolicyStatement({
            actions: ['ssm:GetParameter'],
            resources: [ssmApiKeyArn],
          }),
        );
      }
      return fn;
    };

    const createEventHandler = (name: string, entry: string) => {
      const fn = new lambdaNode.NodejsFunction(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '..', '..', 'lambdas', entry),
        environment: {
          ...sharedEnv,
          ANTHROPIC_API_KEY_PARAM: `/launchpad/${stage}/anthropic-api-key`,
        },
        timeout: cdk.Duration.seconds(60),
        memorySize: 256,
        bundling: {
          externalModules: ['@aws-sdk/*'],
          minify: true,
          sourceMap: true,
        },
      });
      table.grantReadWriteData(fn);
      eventBus.grantPutEventsTo(fn);
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['ssm:GetParameter'],
          resources: [ssmApiKeyArn],
        }),
      );
      return fn;
    };

    // ─── Ideas API ──────────────────────────────────────────────
    const createIdea = createApiHandler('CreateIdea', 'api/ideas/create.ts');
    const listIdeas = createApiHandler('ListIdeas', 'api/ideas/list.ts');
    const getIdea = createApiHandler('GetIdea', 'api/ideas/get.ts');
    const updateIdea = createApiHandler('UpdateIdea', 'api/ideas/update.ts');
    const deleteIdea = createApiHandler('DeleteIdea', 'api/ideas/delete.ts');

    api.addRoutes({
      path: '/ideas',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('CreateIdeaInt', createIdea),
      authorizer,
    });
    api.addRoutes({
      path: '/ideas',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('ListIdeasInt', listIdeas),
      authorizer,
    });
    api.addRoutes({
      path: '/ideas/{ideaId}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('GetIdeaInt', getIdea),
      authorizer,
    });
    api.addRoutes({
      path: '/ideas/{ideaId}',
      methods: [apigatewayv2.HttpMethod.PATCH],
      integration: new HttpLambdaIntegration('UpdateIdeaInt', updateIdea),
      authorizer,
    });
    api.addRoutes({
      path: '/ideas/{ideaId}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('DeleteIdeaInt', deleteIdea),
      authorizer,
    });

    // ─── Coach API ──────────────────────────────────────────────
    const createConvo = createApiHandler('CreateConvo', 'api/coach/create-convo.ts');
    const listConvos = createApiHandler('ListConvos', 'api/coach/list-convos.ts');
    const getMessages = createApiHandler('GetMessages', 'api/coach/get-messages.ts');
    const updateConvo = createApiHandler('UpdateConvo', 'api/coach/update-convo.ts');
    const sendMessage = createApiHandler('SendMessage', 'api/coach/send-message.ts', claudeEnv);
    const nudgeIdea = createApiHandler('NudgeIdea', 'api/coach/nudge-idea.ts', claudeEnv);

    api.addRoutes({
      path: '/coach/conversations',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('CreateConvoInt', createConvo),
      authorizer,
    });
    api.addRoutes({
      path: '/coach/conversations',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('ListConvosInt', listConvos),
      authorizer,
    });
    api.addRoutes({
      path: '/coach/conversations/{convoId}/messages',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('GetMessagesInt', getMessages),
      authorizer,
    });
    api.addRoutes({
      path: '/coach/conversations/{convoId}/messages',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('SendMessageInt', sendMessage),
      authorizer,
    });
    api.addRoutes({
      path: '/coach/conversations/{convoId}',
      methods: [apigatewayv2.HttpMethod.PATCH],
      integration: new HttpLambdaIntegration('UpdateConvoInt', updateConvo),
      authorizer,
    });
    api.addRoutes({
      path: '/coach/nudge/{ideaId}',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('NudgeIdeaInt', nudgeIdea),
      authorizer,
    });

    const deleteConvo = createApiHandler('DeleteConvo', 'api/coach/delete-convo.ts');
    api.addRoutes({
      path: '/coach/conversations/{convoId}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('DeleteConvoInt', deleteConvo),
      authorizer,
    });

    const extractIdea = createApiHandler('ExtractIdea', 'api/coach/extract-idea.ts', claudeEnv);
    api.addRoutes({
      path: '/coach/extract-idea',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('ExtractIdeaInt', extractIdea),
      authorizer,
    });

    // ─── Streaming Coach (Lambda Function URL) ───────────────
    const streamMessage = new lambdaNode.NodejsFunction(this, 'StreamMessage', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', '..', 'lambdas', 'api/coach/stream-message.ts'),
      environment: {
        ...sharedEnv,
        ...claudeEnv,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.seconds(120),
      memorySize: 256,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
      },
    });
    table.grantReadWriteData(streamMessage);
    streamMessage.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [ssmApiKeyArn],
      }),
    );

    const streamUrl = streamMessage.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
      cors: {
        allowedOrigins: ['*'],
        allowedHeaders: ['Authorization', 'Content-Type'],
        allowedMethods: [lambda.HttpMethod.POST],
      },
    });

    // ─── Explore API ────────────────────────────────────────────
    const exploreSearch = createApiHandler('ExploreSearch', 'api/explore/search.ts', claudeEnv);
    const exploreSuggestions = createApiHandler(
      'ExploreSuggestions',
      'api/explore/suggestions.ts',
      claudeEnv,
    );
    const savedPaths = createApiHandler('SavedPaths', 'api/explore/saved-paths.ts');
    const refreshPath = createApiHandler('RefreshPath', 'api/explore/refresh-path.ts', claudeEnv);

    api.addRoutes({
      path: '/explore/search',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('ExploreSearchInt', exploreSearch),
      authorizer,
    });
    api.addRoutes({
      path: '/explore/suggestions',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('ExploreSuggestionsInt', exploreSuggestions),
      authorizer,
    });
    api.addRoutes({
      path: '/explore/saved-paths',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('SavePathInt', savedPaths),
      authorizer,
    });
    api.addRoutes({
      path: '/explore/saved-paths',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('ListPathsInt', savedPaths),
      authorizer,
    });
    api.addRoutes({
      path: '/explore/saved-paths/{pathId}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('DeletePathInt', savedPaths),
      authorizer,
    });
    api.addRoutes({
      path: '/explore/saved-paths/{pathId}/refresh',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('RefreshPathInt', refreshPath),
      authorizer,
    });

    // ─── Notifications API ──────────────────────────────────────
    const registerPush = createApiHandler('RegisterPush', 'api/notifications/register.ts');
    const notifSettings = createApiHandler('NotifSettings', 'api/notifications/settings.ts');

    api.addRoutes({
      path: '/notifications/register',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('RegisterPushInt', registerPush),
      authorizer,
    });
    api.addRoutes({
      path: '/notifications/settings',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('GetSettingsInt', notifSettings),
      authorizer,
    });
    api.addRoutes({
      path: '/notifications/settings',
      methods: [apigatewayv2.HttpMethod.PATCH],
      integration: new HttpLambdaIntegration('UpdateSettingsInt', notifSettings),
      authorizer,
    });

    // ─── Apple Sign-In API (unauthenticated) ────────────────────
    const appleAuthSecretArn = cdk.Stack.of(this).formatArn({
      service: 'ssm',
      resource: 'parameter',
      resourceName: `launchpad/${stage}/apple-auth-secret`,
    });

    const appleSignIn = new lambdaNode.NodejsFunction(this, 'AppleSignIn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', '..', 'lambdas', 'api/auth/apple-signin.ts'),
      environment: {
        ...sharedEnv,
        USER_POOL_ID: userPool.userPoolId,
        APPLE_AUTH_SECRET_PARAM: `/launchpad/${stage}/apple-auth-secret`,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
      },
    });
    table.grantReadWriteData(appleSignIn);
    appleSignIn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [appleAuthSecretArn],
      }),
    );
    appleSignIn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:ListUsers',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminSetUserPassword',
        ],
        resources: [userPool.userPoolArn],
      }),
    );

    api.addRoutes({
      path: '/auth/apple',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('AppleSignInInt', appleSignIn),
    });

    // ─── Account API ───────────────────────────────────────────
    const deleteAccount = new lambdaNode.NodejsFunction(this, 'DeleteAccount', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', '..', 'lambdas', 'api/account/delete.ts'),
      environment: {
        ...sharedEnv,
        USER_POOL_ID: userPool.userPoolId,
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
      },
    });
    table.grantReadWriteData(deleteAccount);
    deleteAccount.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminDeleteUser'],
        resources: [userPool.userPoolArn],
      }),
    );

    api.addRoutes({
      path: '/account',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('DeleteAccountInt', deleteAccount),
      authorizer,
    });

    // ─── Tasks API ─────────────────────────────────────────────
    const createTask = createApiHandler('CreateTask', 'api/tasks/create.ts');
    const listTasks = createApiHandler('ListTasks', 'api/tasks/list.ts');
    const updateTask = createApiHandler('UpdateTask', 'api/tasks/update.ts');
    const deleteTask = createApiHandler('DeleteTask', 'api/tasks/delete.ts');

    api.addRoutes({
      path: '/tasks',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('CreateTaskInt', createTask),
      authorizer,
    });
    api.addRoutes({
      path: '/tasks',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('ListTasksInt', listTasks),
      authorizer,
    });
    api.addRoutes({
      path: '/tasks/{taskId}',
      methods: [apigatewayv2.HttpMethod.PATCH],
      integration: new HttpLambdaIntegration('UpdateTaskInt', updateTask),
      authorizer,
    });
    api.addRoutes({
      path: '/tasks/{taskId}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('DeleteTaskInt', deleteTask),
      authorizer,
    });

    // ─── Event Handlers ─────────────────────────────────────────
    const staleChecker = createEventHandler('StaleIdeaChecker', 'events/stale-idea-checker.ts');
    new events.Rule(this, 'StaleIdeaSchedule', {
      schedule: events.Schedule.cron({ hour: '8', minute: '0' }),
      targets: [new targets.LambdaFunction(staleChecker)],
    });

    const actionExtractor = createEventHandler(
      'ActionItemExtractor',
      'events/action-item-extractor.ts',
    );
    new events.Rule(this, 'ActionItemSchedule', {
      schedule: events.Schedule.cron({ hour: '9', minute: '0' }),
      targets: [new targets.LambdaFunction(actionExtractor)],
    });

    const notificationSender = createEventHandler(
      'NotificationSender',
      'events/notification-sender.ts',
    );
    new events.Rule(this, 'NudgeSendRule', {
      eventBus,
      eventPattern: {
        source: ['launchpad.nudges'],
        detailType: ['nudge.created'],
      },
      targets: [new targets.LambdaFunction(notificationSender)],
    });

    const taskReminderChecker = createEventHandler(
      'TaskReminderChecker',
      'events/task-reminder-checker.ts',
    );
    new events.Rule(this, 'TaskReminderSchedule', {
      schedule: events.Schedule.cron({ hour: '7,8,9,10,17,18', minute: '0' }),
      targets: [new targets.LambdaFunction(taskReminderChecker)],
    });
    new events.Rule(this, 'TaskReminderEventRule', {
      eventBus,
      eventPattern: {
        source: ['launchpad.tasks'],
        detailType: ['task.reminder'],
      },
      targets: [new targets.LambdaFunction(notificationSender)],
    });

    // ─── Outputs ────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
    new cdk.CfnOutput(this, 'StreamingUrl', { value: streamUrl.url });
    new cdk.CfnOutput(this, 'EventBusName', { value: eventBus.eventBusName });
  }
}
