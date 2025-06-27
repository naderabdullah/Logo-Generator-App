// scripts/migrate-to-supabase.js
// Run this script once to migrate existing DynamoDB users to Supabase
// Usage: node scripts/migrate-to-supabase.js

const { DynamoDB } = require('aws-sdk');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

// Debug: Check if environment variables are loaded
console.log('Environment check:');
console.log('SUPABASE_URL loaded:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SERVICE_ROLE_KEY loaded:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('AWS credentials loaded:', !!process.env.AWS_ACCESS_KEY_ID);

// If env vars aren't loaded, use direct values for testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hrwxumlzbqyelojoiqpl.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyd3h1bWx6YnF5ZWxvam9pcXBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk4MDYzMiwiZXhwIjoyMDY2NTU2NjMyfQ.XJCkUAcqFGaqaVYvjj11FudHWJ694i1zh6s1zCO0fTU';

// Initialize DynamoDB client (for reading old data)
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function migrateUsers() {
  try {
    console.log('Starting migration from DynamoDB to Supabase...');
    
    // 1. Scan all users from DynamoDB
    const dynamoUsers = await dynamoDB.scan({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users'
    }).promise();
    
    if (!dynamoUsers.Items || dynamoUsers.Items.length === 0) {
      console.log('No users found in DynamoDB to migrate.');
      return;
    }
    
    console.log(`Found ${dynamoUsers.Items.length} users to migrate`);
    
    // 2. Transform and insert users into Supabase
    for (const dynamoUser of dynamoUsers.Items) {
      try {
        // Transform DynamoDB user to Supabase format
        const supabaseUser = {
          user_id: dynamoUser.id?.toString() || dynamoUser.email,
          email: dynamoUser.email,
          logos_created: dynamoUser.logosCreated || 0,
          logos_limit: dynamoUser.logosLimit || 10,
          subscription_type: dynamoUser.subAppId || 'premium'
        };
        
        // Check if user already exists in Supabase
        const { data: existingUser } = await supabaseAdmin
          .from('user_credits')
          .select('user_id')
          .eq('user_id', supabaseUser.user_id)
          .single();
        
        if (existingUser) {
          console.log(`User ${supabaseUser.email} already exists in Supabase, skipping...`);
          continue;
        }
        
        // Insert user into Supabase
        const { error } = await supabaseAdmin
          .from('user_credits')
          .insert(supabaseUser);
        
        if (error) {
          console.error(`Error migrating user ${supabaseUser.email}:`, error);
        } else {
          console.log(`✓ Migrated user: ${supabaseUser.email}`);
        }
        
      } catch (userError) {
        console.error(`Error processing user ${dynamoUser.email}:`, userError);
      }
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

async function verifyMigration() {
  try {
    console.log('\nVerifying migration...');
    
    // Count users in Supabase
    const { data: supabaseUsers, error } = await supabaseAdmin
      .from('user_credits')
      .select('user_id, email, logos_created, logos_limit');
    
    if (error) {
      console.error('Error verifying migration:', error);
      return;
    }
    
    console.log(`✓ Found ${supabaseUsers.length} users in Supabase`);
    
    // Show sample of migrated data
    if (supabaseUsers.length > 0) {
      console.log('\nSample migrated users:');
      supabaseUsers.slice(0, 3).forEach(user => {
        console.log(`- ${user.email}: ${user.logos_created}/${user.logos_limit} logos`);
      });
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Run migration
async function main() {
  console.log('🚀 Starting DynamoDB to Supabase migration...\n');
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('⚠️  DynamoDB credentials not found. Skipping migration (might be intentional).');
    return;
  }
  
  await migrateUsers();
  await verifyMigration();
  
  console.log('\n✅ Migration process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Verify the data in your Supabase dashboard');
  console.log('2. Test logo generation with the new Supabase integration');
  console.log('3. Remove DynamoDB environment variables once confirmed working');
  console.log('4. Deploy the updated code to Vercel');
}

main().catch(console.error);