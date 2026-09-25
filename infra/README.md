# AWS deployment

The production shape is:

- Amplify Hosting serves the Vite frontend.
- ECS Fargate runs the Express + Socket.IO API and WebRTC signaling relay.
- DynamoDB stores accounts, rooms, participants, messages, and refresh tokens.
- Cognito is provisioned as the target identity provider; Express auth still uses its existing JWT/password contract in this first slice.
- Secrets Manager stores the JWT signing secret.
- A private ECR repository stores the backend image. GitHub Actions builds `server/` on a Linux runner and pushes the image; CDK and ECS do not require Docker Desktop on the developer laptop.
- An internet-facing Application Load Balancer exposes the API and supports long-lived Socket.IO connections through HTTPS/WSS.
- `api.qyzen.online` is the custom API and Socket.IO hostname. Port 80 only redirects to HTTPS; application traffic terminates TLS on port 443.

## Build and publish the API image

The GitHub Actions job in `.github/workflows/ci-cd.yml` builds `server/Dockerfile` and pushes these tags to `quzen-rooms-api`:

```text
<account>.dkr.ecr.ap-south-1.amazonaws.com/quzen-rooms-api:<git-sha>
<account>.dkr.ecr.ap-south-1.amazonaws.com/quzen-rooms-api:latest
```

It uses GitHub OIDC, so no AWS access key is stored in GitHub. Add the repository secret `AWS_GITHUB_ACTIONS_ROLE_ARN` containing the ARN of an AWS IAM role trusted by this GitHub repository and the `main` branch. The ECR repository must exist before this workflow runs; the first CDK pass below creates it.

## First deployment order

Do not run the following commands until the ACM certificate status is `ISSUED` and its DNS validation CNAME is present. These commands are intentionally split into two CDK passes because ECS cannot start a task from an ECR tag that has not been pushed yet.

1. Bootstrap CDK and create the VPC, ECR repository, IAM roles, ECS service, ALB, HTTPS certificate attachment, DynamoDB tables, and supporting resources with zero running tasks:

  ```powershell
  $env:CDK_DEFAULT_REGION = 'ap-south-1'
  $env:CERTIFICATE_ARN = 'arn:aws:acm:ap-south-1:970076635476:certificate/4a78aba1-1fce-45ac-bc86-af1ccbb9cea8'
  npx aws-cdk bootstrap aws://970076635476/ap-south-1
  npx aws-cdk deploy QuzenRoomsStack -a "npx tsx infra/bin/app.ts" `
    -c clientUrl=https://qyzen.online `
    -c cookieDomain=qyzen.online `
    -c apiDomain=api.qyzen.online `
    -c certificateArn=$env:CERTIFICATE_ARN `
    -c imageTag=bootstrap `
    -c desiredCount=0
  ```

2. Configure the GitHub OIDC role below, save its ARN as the `AWS_GITHUB_ACTIONS_ROLE_ARN` repository secret, then push the workflow to `main`:

  ```powershell
  git add .github/workflows/ci-cd.yml infra/lib/quzen-rooms-stack.ts infra/README.md
  git commit -m "Build backend image in GitHub Actions"
  git push origin main
  ```

  Wait for the **Backend - Build & Push Image** job to finish successfully. It publishes the commit SHA shown by:

  ```powershell
  $env:IMAGE_TAG = (git rev-parse HEAD)
  ```

3. Activate the ECS task with the image that was just pushed:

  ```powershell
  npx aws-cdk deploy QuzenRoomsStack -a "npx tsx infra/bin/app.ts" `
    -c clientUrl=https://qyzen.online `
    -c cookieDomain=qyzen.online `
    -c apiDomain=api.qyzen.online `
    -c certificateArn=$env:CERTIFICATE_ARN `
    -c imageTag=$env:IMAGE_TAG `
    -c desiredCount=1
  ```

The stack keeps `desiredCount=1` and the image tag from context on later deployments. A new backend image must be pushed before deploying a new `imageTag`. No Docker daemon is needed for CDK synth or deploy.

## Subsequent API deployments

After the first deployment, push the backend changes to `main`, wait for the GitHub Actions image job to finish, then run the third command in **First deployment order** with the pushed commit SHA as `imageTag`. The same CDK command updates the task definition and rolls the ECS service to that image.

Do not deploy the ALB listener until the ACM certificate is `ISSUED`. The safest first-time flow is to request the certificate separately, add its DNS validation record, wait for issuance, then pass the issued ARN to CDK with `-c certificateArn=...`. If `certificateArn` is omitted, CDK includes a DNS-validated certificate resource in the template for review, but the first deployment may wait on certificate validation before the listener can be created.

## DNS records

Create these records in the DNS zone for `qyzen.online`:

1. **ACM validation CNAME:** request the certificate in `ap-south-1` before the first stack deployment:

   ```bash
   aws acm request-certificate \
     --domain-name api.qyzen.online \
     --validation-method DNS \
     --region ap-south-1
   ```

   Read its validation record:

   ```bash
   aws acm describe-certificate \
     --certificate-arn <certificate-arn> \
     --query 'Certificate.DomainValidationOptions[].ResourceRecord' \
     --output table
   ```

   Create the returned CNAME exactly as shown. Keep it in DNS permanently so ACM can renew the certificate. Wait until ACM reports `ISSUED`, then deploy with `-c certificateArn=<certificate-arn>`.

2. **API CNAME:**

   ```text
   Name:  api
   Type:  CNAME
   Value: <LoadBalancerDnsName-output>
   TTL:   300
   ```

The final API and Socket.IO endpoints are:

```text
HTTPS API:  https://api.qyzen.online/api
Secure WS:  wss://api.qyzen.online
Health:     https://api.qyzen.online/api/health
```

The ALB remains HTTP-capable on port 80 only to issue a permanent redirect to port 443. The ECS container still receives plain HTTP on port 4000 inside the VPC; TLS terminates at the ALB.

## Amplify environment variables

Set these variables in Amplify Hosting for every environment that uses the production API, before the frontend build:

```text
VITE_API_URL=https://api.qyzen.online/api
VITE_SOCKET_URL=https://api.qyzen.online
```

Then connect the Amplify app to this repository and use the existing `amplify.yml` build settings.

The ECS task role is granted read/write access to the five DynamoDB tables. `COOKIE_SECURE=true` is now appropriate because the public API hostname is HTTPS.

## AWS permissions

Create an IAM role for GitHub Actions with this trust policy. Replace `<github-owner>/<github-repo>` with the exact GitHub repository name:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::970076635476:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<github-owner>/<github-repo>:ref:refs/heads/main" }
    }
  }]
}
```

Attach this inline policy to that role. It permits image publishing only to the backend repository:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": "arn:aws:ecr:ap-south-1:970076635476:repository/quzen-rooms-api"
    }
  ]
}
```

The human or CI identity running CDK needs permission to bootstrap and deploy CloudFormation stacks, publish/read CDK bootstrap assets, and create or update the resources in this stack: VPC/EC2, ECR, ECS, ELBv2, ACM certificate association, IAM roles/policies, DynamoDB, Cognito, Secrets Manager, CloudWatch Logs, and CloudFormation. For a first setup, use the organization-approved infrastructure deployment role; do not give the GitHub image-publishing role any CloudFormation, ECS, IAM, or data-store permissions.

## Cost review

The current design keeps one NAT Gateway, one internet-facing ALB, and one small Fargate task. Approximate monthly baseline before traffic, storage, logs, and data transfer:

| Component | Approximate baseline | Notes |
| --- | ---: | --- |
| NAT Gateway | ~$32/month plus processed data | Usually the largest fixed networking cost; price varies by region. |
| Application Load Balancer | ~$16/month plus LCU usage | Required here for a stable HTTPS hostname and WebSocket support. |
| ECS Fargate 0.5 vCPU / 1 GiB | commonly ~$15-$25/month | Varies by region and task uptime. |
| DynamoDB on-demand | low at small traffic | Requests and storage scale with usage. |
| CloudWatch Logs, ECR, data transfer | usage-based | Add retention and lifecycle policies for control. |

The lower-cost safe option is to remove the NAT Gateway and place the single ECS task in a public subnet with `assignPublicIp: true`, while keeping its security group inbound rule restricted to the ALB security group. DynamoDB, ECR, and AWS API calls would leave through the task's public IP over TLS. This can save roughly the NAT fixed charge, but it increases exposure and changes the network architecture; it should be used only with strict security groups, no direct task ingress, patched images, and a single-task availability expectation.

For production, the current private-subnet + one-NAT design is the safer default. A more resilient but more expensive option is NAT per AZ. VPC endpoints can reduce NAT data charges, but interface endpoints also have hourly costs, so they are not automatically cheaper at this scale. No cost architecture change is made in this HTTPS update.

## Migration status and blockers

The Express and Socket.IO runtime no longer imports Prisma, opens PostgreSQL connections, or runs SQL migrations. A DynamoDB adapter preserves the existing service call shapes, so the current HTTP and socket API surface remains stable. The adapter currently uses table scans for secondary lookups and its transaction method is a compatibility wrapper, not an atomic DynamoDB transaction; replace those paths with GSIs and `TransactWriteItems` before high-volume production use.

The HTTPS infrastructure is not deployed by this change. Run `cdk synth` and `cdk diff` first, add the ACM validation CNAME, then deploy. Confirm the certificate is `ISSUED`, the API CNAME resolves to the ALB, `/api/health` returns 200, and Socket.IO connects over `wss://api.qyzen.online` before switching production traffic.

Cognito is provisioned by CDK but is not enabled in Express yet. Enabling it safely requires a coordinated client/session migration: existing password hashes and refresh-token cookies cannot be imported into Cognito, Cognito access-token verification must replace local JWT middleware, and the frontend register/login/reset flows must handle Cognito challenges and confirmation codes. Until then, keep `JWT_ACCESS_SECRET` configured and treat the CDK Cognito pool as an unused migration target.

Existing database records still need a one-time export/import job before production cutover. The repository runtime no longer contains the old relational database path.

## Important WebRTC note

The application uses browser-to-browser WebRTC media. The server only handles authentication and signaling. STUN is configured for development; reliable connectivity across restrictive corporate or mobile networks requires a TURN service such as Amazon Kinesis Video Streams WebRTC TURN or a managed provider.
