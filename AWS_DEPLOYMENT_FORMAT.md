# AWS Deployment Format for Quzen Rooms

This is the exact deployment workflow for taking this project live on AWS.

## 1) Required things

- AWS account
- Domain such as `qyzen.online`
- Route53 hosted zone
- ACM certificate for `api.qyzen.online`
- IAM role for GitHub Actions OIDC
- ECR repository: `quzen-rooms-api`
- Amplify Hosting for the frontend

---

## 2) Request SSL certificate

```bash
aws acm request-certificate \
  --domain-name api.qyzen.online \
  --validation-method DNS \
  --region ap-south-1
```

Then add the returned DNS validation CNAME in Route53. Wait until the certificate shows `ISSUED`.

---

## 3) Bootstrap CDK

```powershell
$env:CDK_DEFAULT_REGION = 'ap-south-1'
$env:ACCOUNT_ID = 'YOUR_AWS_ACCOUNT_ID'

npx aws-cdk bootstrap aws://$env:ACCOUNT_ID/ap-south-1
```

---

## 4) First deploy: create AWS infrastructure

```powershell
$env:CDK_DEFAULT_REGION = 'ap-south-1'
$env:CERTIFICATE_ARN = 'arn:aws:acm:ap-south-1:YOUR_AWS_ACCOUNT_ID:certificate/YOUR_CERTIFICATE_ID'

npx aws-cdk deploy QuzenRoomsStack -a "npx tsx infra/bin/app.ts" `
  -c clientUrl=https://qyzen.online `
  -c cookieDomain=qyzen.online `
  -c apiDomain=api.qyzen.online `
  -c certificateArn=$env:CERTIFICATE_ARN `
  -c imageTag=bootstrap `
  -c desiredCount=0
```

This creates the VPC, ECS, ALB, ECR, DynamoDB, IAM, and related resources without starting the app task.

---

## 5) Add GitHub OIDC role secret

Create an IAM role for GitHub Actions and store this in GitHub repository secrets:

```text
AWS_GITHUB_ACTIONS_ROLE_ARN=arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/YOUR_GITHUB_ROLE
```

---

## 6) Push code to GitHub

```bash
git add .
git commit -m "Deploy backend"
git push origin main
```

Wait for the GitHub Actions workflow to finish building and pushing the backend Docker image to ECR.

---

## 7) Get the image tag

```powershell
$env:IMAGE_TAG = (git rev-parse HEAD)
```

---

## 8) Second deploy: start the ECS task with the new image

```powershell
npx aws-cdk deploy QuzenRoomsStack -a "npx tsx infra/bin/app.ts" `
  -c clientUrl=https://qyzen.online `
  -c cookieDomain=qyzen.online `
  -c apiDomain=api.qyzen.online `
  -c certificateArn=$env:CERTIFICATE_ARN `
  -c imageTag=$env:IMAGE_TAG `
  -c desiredCount=1
```

This starts the backend service and attaches the production image.

---

## 9) Frontend Amplify environment variables

In AWS Amplify Hosting, set these values:

```text
VITE_API_URL=https://api.qyzen.online/api
VITE_SOCKET_URL=https://api.qyzen.online
```

Then connect the repo and deploy the frontend.

---

## 10) DNS config

Create this record in Route53 for the domain:

```text
Name: api
Type: CNAME
Value: <LoadBalancerDnsName-output>
TTL: 300
```

Final endpoints:

```text
HTTPS API: https://api.qyzen.online/api
Secure WS: wss://api.qyzen.online
Health:    https://api.qyzen.online/api/health
```

---

## 11) Verification

Test the deployed backend:

```bash
curl https://api.qyzen.online/api/health
```

Expected result: HTTP 200 and JSON health response.

---

## 12) Final AWS deployment order

1. Request ACM cert
2. Add validation CNAME
3. Bootstrap CDK
4. First deploy with `desiredCount=0`
5. Push GitHub code
6. Wait for ECR image push
7. Second deploy with real `imageTag`
8. Set Amplify frontend env vars
9. Deploy frontend
10. Verify API health and socket URL

---

## Notes

- Production app should use HTTPS only.
- `COOKIE_SECURE=true` is required behind HTTPS.
- The backend is configured for DynamoDB + ECS + ALB architecture.
- The local dev fallback is only for development; production needs real AWS environment variables and real domain configuration.
