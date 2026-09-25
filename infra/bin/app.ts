import * as cdk from 'aws-cdk-lib';
import { QuzenRoomsStack } from '../lib/quzen-rooms-stack';

const app = new cdk.App();
new QuzenRoomsStack(app, 'QuzenRoomsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
  },
});
