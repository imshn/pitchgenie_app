# Security Checklist for Production

## Pre-Deployment Verification
- [ ] **Environment Variables**: Ensure all variables in `.env.example` are set in the production environment (Vercel, Railway, etc.).
- [ ] **Service Account**: `GOOGLE_SERVICE_ACCOUNT_JSON` must be a valid minified JSON string of the Firebase Admin service account.
- [ ] **Database Rules**: Deploy `firestore.rules` and `storage.rules` to Firebase Console.
- [ ] **App Check**: Enable App Check in Firebase Console and add the secret/site key to environment variables if using client-side verification.

## CI/CD Pipeline Steps
Recommended steps to add to your CI/CD workflow (e.g., GitHub Actions):

### 1. Static Analysis
```bash
npm run lint
npm audit --production
```

### 2. Secret Detection
Use tools like `detect-secrets` or `trufflehog` to ensure no keys are committed.
```bash
# Example
pip install detect-secrets
detect-secrets-hook --baseline .secrets.baseline
```

### 3. Build Verification
```bash
npm run build
```

## Post-Deployment
- [ ] **Monitor Sentry**: Check for any new errors after deployment.
- [ ] **Test Webhooks**: Verify Razorpay webhooks are being received and processed correctly.
- [ ] **Rate Limits**: Monitor logs for 429 errors to ensure limits are not too aggressive for legitimate users.

## Periodic Reviews
- [ ] Rotate `GOOGLE_SERVICE_ACCOUNT_JSON` key every 90 days.
- [ ] Rotate `RAZORPAY_WEBHOOK_SECRET` if you suspect a leak.
- [ ] Review Firebase Security Rules for any new collections.
