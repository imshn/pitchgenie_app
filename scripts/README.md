# Migration: Add firstTimeTourCompleted Field

This directory contains migration scripts for database schema updates.

## ⚡ Quick Start (Recommended)

### Method 1: Using API Route (Easiest!)

1. **Start your development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Call the migration endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/migrate-tour-field
   ```

3. **Check the response** - you'll see:
   ```json
   {
     "success": true,
     "message": "Migration complete",
     "totalUsers": 10,
     "updated": 8,
     "skipped": 2
   }
   ```

4. **Delete the API route** (optional, for security):
   ```bash
   rm -rf app/api/admin/migrate-tour-field
   ```

That's it! ✅

---

## Alternative Methods

### Method 2: Using Node.js Script

If you prefer to run a standalone script:

1. **Install ts-node**:
   ```bash
   npm install -D ts-node
   ```

2. **Run the migration**:
   ```bash
   node --loader ts-node/esm scripts/migrate-tour-field.ts
   ```

### Method 3: Manual Update via Firebase Console

1. Go to Firebase Console → Firestore Database
2. Select the `users` collection
3. For each user document:
   - Click Edit
   - Add field: `firstTimeTourCompleted` (boolean)
   - Set to `true` for existing users
   - Set to `false` for users who haven't completed onboarding
   - Save

---

## Migration Logic

- **Existing users with `onboardingCompleted: true`** → `firstTimeTourCompleted: true`
- **Existing users with `onboardingCompleted: false`** → `firstTimeTourCompleted: false`  
- **New users** → Automatically get `firstTimeTourCompleted: false` via signup logic

## Post-Migration Checklist

- [ ] Run migration (API route recommended)
- [ ] Verify field exists in Firestore Console
- [ ] Test with an existing user account
- [ ] Test with a new user signup
- [ ] Confirm tour appears for users with `firstTimeTourCompleted: false`
- [ ] Confirm tour doesn't appear for users with `firstTimeTourCompleted: true`
- [ ] **Delete the admin API route for security** (if used)

## Troubleshooting

### "Module not found" errors
- Use the API route method instead (Method 1)
- It works within your existing Next.js environment

### Script takes too long
- The API route method uses batching (500 users at a time)
- For very large databases (>10k users), consider running during low traffic

### Want to rollback?
```bash
curl -X POST http://localhost:3000/api/admin/migrate-tour-field
```
Then manually set fields back in Firebase Console, or create a rollback API route.

---

## Security Note

The API route `/api/admin/migrate-tour-field` has no authentication. This is acceptable for one-time migrations, but **delete it after use** to prevent unauthorized access.

If you need to keep it, add authentication:
```typescript
// Add at the top of the route handler
const authHeader = req.headers.get("Authorization");
if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
