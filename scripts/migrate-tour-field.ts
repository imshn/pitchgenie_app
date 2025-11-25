/**
 * Migration Script: Add firstTimeTourCompleted to Existing Users
 * 
 * This script updates all existing user documents in Firestore to add
 * the firstTimeTourCompleted field.
 * 
 * Run with: node --loader ts-node/esm scripts/migrate-tour-field.ts
 * Or use the API route method (easier): See README.md
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
const serviceAccountPath = join(__dirname, '../pitchgenie-33c93-firebase-adminsdk-fbsvc-3cd510ee15.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function migrateUsers() {
  console.log('🚀 Starting migration: Adding firstTimeTourCompleted field to users...');
  
  try {
    // Get all users
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No users found.');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} users to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    const batchSize = 500;
    let currentBatch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      
      // Only update if field doesn't exist
      if (userData.firstTimeTourCompleted === undefined) {
        // Set to true for existing users (they've already used the app)
        // Set to false for users who haven't completed onboarding yet
        const tourCompleted = userData.onboardingCompleted !== false;
        
        currentBatch.update(doc.ref, {
          firstTimeTourCompleted: tourCompleted,
          updatedAt: Date.now()
        });
        
        updatedCount++;
        batchCount++;
        
        // Commit batch if limit reached
        if (batchCount >= batchSize) {
          console.log(`💾 Committing batch of ${batchCount} updates...`);
          await currentBatch.commit();
          currentBatch = db.batch();
          batchCount = 0;
        }
      } else {
        skippedCount++;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      console.log(`💾 Committing final batch of ${batchCount} updates...`);
      await currentBatch.commit();
    }
    
    console.log('\n✅ Migration complete!');
    console.log(`📈 Statistics:`);
    console.log(`   - Total users: ${snapshot.size}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Skipped (already had field): ${skippedCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('\n🎉 Migration finished successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });
