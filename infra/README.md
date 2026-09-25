# AWS deployment

The production shape is:

- Amplify Hosting serves the Vite frontend.
- ECS Fargate runs the Express + Socket.IO API and WebRTC signaling relay.
- DynamoDB stores accounts, rooms, participants, messages, and refresh tokens.
- Cognito is provisioned as the target identity provider; Express auth still uses its existing JWT/password contract in this first slice.
- Secrets Manager stores the JWT signing secret.
- An internet-facing Application Load Balancer exposes the API and supports long-lived Socket.IO connections.

## Deploy the API

From the repository root, with AWS credentials configured:

```bash
npx aws-cdk bootstrap
npx aws-cdk deploy -a "npx tsx infra/bin/app.ts" \
  -c clientUrl=https://qyzen.online \
  -c cookieDomain=qyzen.online
```

The stack outputs the API load-balancer URL. Set these Amplify Hosting environment variables before its build:

```text
VITE_API_URL=https://<api-host>/api
VITE_SOCKET_URL=https://<api-host>
```

Then connect the Amplify app to this repository and use the existing `amplify.yml` build settings.

The ECS task role is granted read/write access to the five DynamoDB tables. Put a custom HTTPS domain in front of the load balancer before setting `COOKIE_SECURE=true`.

## Migration status and blockers

The Express and Socket.IO runtime no longer imports Prisma, opens PostgreSQL connections, or runs SQL migrations. A DynamoDB adapter preserves the existing service call shapes, so the current HTTP and socket API surface remains stable. The adapter currently uses table scans for secondary lookups and its transaction method is a compatibility wrapper, not an atomic DynamoDB transaction; replace those paths with GSIs and `TransactWriteItems` before high-volume production use.

Cognito is provisioned by CDK but is not enabled in Express yet. Enabling it safely requires a coordinated client/session migration: existing password hashes and refresh-token cookies cannot be imported into Cognito, Cognito access-token verification must replace local JWT middleware, and the frontend register/login/reset flows must handle Cognito challenges and confirmation codes. Until then, keep `JWT_ACCESS_SECRET` configured and treat the CDK Cognito pool as an unused migration target.

Existing database records still need a one-time export/import job before production cutover. The repository runtime no longer contains the old relational database path.

## Important WebRTC note

The application uses browser-to-browser WebRTC media. The server only handles authentication and signaling. STUN is configured for development; reliable connectivity across restrictive corporate or mobile networks requires a TURN service such as Amazon Kinesis Video Streams WebRTC TURN or a managed provider.
