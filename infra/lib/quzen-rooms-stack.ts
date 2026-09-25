import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class QuzenRoomsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const clientUrl = this.node.tryGetContext('clientUrl') || 'https://qyzen.online';
    const cookieDomain = this.node.tryGetContext('cookieDomain') || 'qyzen.online';

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const tableProps = { partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }, billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, pointInTimeRecovery: true, removalPolicy: cdk.RemovalPolicy.RETAIN };
    const usersTable = new dynamodb.Table(this, 'UsersTable', tableProps);
    const roomsTable = new dynamodb.Table(this, 'RoomsTable', tableProps);
    const participantsTable = new dynamodb.Table(this, 'ParticipantsTable', tableProps);
    const messagesTable = new dynamodb.Table(this, 'MessagesTable', tableProps);
    const refreshTokensTable = new dynamodb.Table(this, 'RefreshTokensTable', tableProps);

    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      standardAttributes: { email: { required: true, mutable: false }, preferredUsername: { required: true, mutable: false } },
    });
    const userPoolClient = userPool.addClient('WebClient', { authFlows: { userPassword: true, userSrp: true } });

    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTask', {
      cpu: 512,
      memoryLimitMiB: 1024,
    });
    usersTable.grantReadWriteData(taskDefinition.taskRole);
    roomsTable.grantReadWriteData(taskDefinition.taskRole);
    participantsTable.grantReadWriteData(taskDefinition.taskRole);
    messagesTable.grantReadWriteData(taskDefinition.taskRole);
    refreshTokensTable.grantReadWriteData(taskDefinition.taskRole);

    const jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      generateSecretString: { passwordLength: 64, excludePunctuation: true },
    });
    const image = new assets.DockerImageAsset(this, 'ApiImage', {
      directory: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../server'),
    });
    const logGroup = new logs.LogGroup(this, 'ApiLogs', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const container = taskDefinition.addContainer('Api', {
      image: ecs.ContainerImage.fromDockerImageAsset(image),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'quzen-api', logGroup }),
      environment: {
        NODE_ENV: 'production',
        PORT: '4000',
        CLIENT_URL: clientUrl,
        COOKIE_DOMAIN: cookieDomain,
        COOKIE_SECURE: 'true',
        AWS_REGION: this.region,
        DYNAMO_USERS_TABLE: usersTable.tableName,
        DYNAMO_ROOMS_TABLE: roomsTable.tableName,
        DYNAMO_PARTICIPANTS_TABLE: participantsTable.tableName,
        DYNAMO_MESSAGES_TABLE: messagesTable.tableName,
        DYNAMO_REFRESH_TOKENS_TABLE: refreshTokensTable.tableName,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      secrets: {
        JWT_ACCESS_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'node -e "fetch(\'http://localhost:4000/api/health\').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(20),
      },
    });
    container.addPortMappings({ containerPort: 4000 });

    const service = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ApiLoadBalancer', {
      vpc,
      internetFacing: true,
    });
    const listener = loadBalancer.addListener('Http', { port: 80, open: true });
    listener.addTargets('ApiTarget', {
      port: 4000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: { path: '/api/health', healthyHttpCodes: '200-399' },
    });

    new cdk.CfnOutput(this, 'ApiUrl', { value: `http://${loadBalancer.loadBalancerDnsName}` });
    new cdk.CfnOutput(this, 'JwtSecretArn', { value: jwtSecret.secretArn });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
  }
}
