#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';

import { StatefulStack } from '../lib/stateful-stack';
import { StatelessStack } from '../lib/stateless-stack';

const app = new cdk.App();
const stage = (app.node.tryGetContext('env') as string | undefined) ?? 'dev';

// Cost allocation tags - enable in Billing > Cost Allocation Tags to view per-app costs
cdk.Tags.of(app).add('App', 'launchpad');
cdk.Tags.of(app).add('Environment', stage);

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'eu-west-1',
};

const stateful = new StatefulStack(app, `launchpad-${stage}-stateful`, {
  env,
  stage,
});

new StatelessStack(app, `launchpad-${stage}-stateless`, {
  env,
  stage,
  table: stateful.table,
  userPool: stateful.userPool,
  userPoolClient: stateful.userPoolClient,
});
