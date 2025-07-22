// scripts/migrate-dynamodb-to-supabase.js
// Run this script to migrate users from DynamoDB users table to Supabase users table

const { DynamoDB } = require('aws-sdk');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

// Initialize DynamoDB client (source)
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Initialize Supabase admin client (destination)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function migrateUsersFromDynamoDBToSupabase() {
  try {
    console.log('🚀 Starting migration from DynamoDB users table to Supabase users table...\n');
    
    // 1. Scan all users from DynamoDB users table
    console.log('📖 Reading users from DynamoDB...');
    const dynamoUsers = await dynamoDB.scan({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users'
    }).promise();
    
    if (!dynamoUsers.Items || dynamoUsers.Items.length === 0) {
      console.log('ℹ️ No users found in DynamoDB users table to migrate.');
      return;
    }
    
    console.log(`📊 Found ${dynamoUsers.Items.length} users in DynamoDB users table`);
    
    // 2. Also get any existing data from Supabase user_credits table
    console.log('📖 Reading existing data from Supabase user_credits table...');
    const { data: supabaseCreditUsers, error: creditError } = await supabaseAdmin
      .from('user_credits')
      .select('*');
    
    if (creditError) {
      console.log('⚠️ Could not read user_credits table:', creditError.message);
    } else {
      console.log(`📊 Found ${supabaseCreditUsers?.length || 0} users in Supabase user_credits table`);
    }
    
    // 3. Create a map of credit data by email
    const creditDataMap = new Map();
    if (supabaseCreditUsers) {
      supabaseCreditUsers.forEach(creditUser => {
        creditDataMap.set(creditUser.email, creditUser);
      });
    }
    
    // 4. Migrate each user
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const dynamoUser of dynamoUsers.Items) {
      try {
        const email = dynamoUser.email;
        const creditData = creditDataMap.get(email);
        
        // Combine data from both sources
        const userData = {
          email: email,
          password: dynamoUser.password, // Keep existing password hash
          logosCreated: creditData?.logos_created || dynamoUser.logosCreated || 0,
          logosLimit: creditData?.logos_limit || dynamoUser.logosLimit || 10,
          subscription_type: creditData?.subscription_type || 'standard'
        };
        
        console.log(`\n👤 Processing user: ${email}`);
        console.log(`   DynamoDB data: ${dynamoUser.logosCreated || 0}/${dynamoUser.logosLimit || 0} logos`);
        if (creditData) {
          console.log(`   Supabase data: ${creditData.logos_created}/${creditData.logos_limit} logos (${creditData.subscription_type})`);
        }
        console.log(`   Final data: ${userData.logosCreated}/${userData.logosLimit} logos (${userData.subscription_type})`);
        
        // Check if user already exists in new users table
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .eq('email', email)
          .single();
        
        if (existingUser) {
          console.log(`   ⏭️ User already exists in users table, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Insert user into new users table
        const { error } = await supabaseAdmin
          .from('users')
          .insert({
            email: userData.email,
            password: userData.password,
            logosCreated: userData.logosCreated,
            logosLimit: userData.logosLimit,
            subscription_type: userData.subscription_type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error(`   ❌ Error migrating user ${email}:`, error.message);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully migrated user: ${email}`);
          migratedCount++;
        }
        
      } catch (userError) {
        console.error(`❌ Error processing user ${dynamoUser.email}:`, userError.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Migration completed!');
    console.log(`✅ Migrated: ${migratedCount} users`);
    console.log(`⏭️ Skipped: ${skippedCount} users (already existed)`);
    console.log(`❌ Errors: ${errorCount} users`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration...');
    
    // Count users in new users table
    const { data: newUsers, error } = await supabaseAdmin
      .from('users')
      .select('id, email, logosCreated, logosLimit, subscription_type');
    
    if (error) {
      console.error('❌ Error verifying migration:', error);
      return;
    }
    
    console.log(`✅ Found ${newUsers.length} users in new Supabase users table`);
    
    // Show sample of migrated data
    if (newUsers.length > 0) {
      console.log('\n📋 Sample migrated users:');
      newUsers.slice(0, 5).forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}: ${user.logosCreated}/${user.logosLimit} logos (${user.subscription_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run migration
async function main() {
  console.log('🚀 Starting DynamoDB to Supabase users migration...\n');
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('⚠️ DynamoDB credentials not found. Skipping migration.');
    return;
  }
  
  await migrateUsersFromDynamoDBToSupabase();
  await verifyMigration();
  
  console.log('\n🎉 Migration process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Verify the data in your Supabase users table');
  console.log('2. Test login with migrated users');
  console.log('3. Test App Manager registration');
  console.log('4. Remove DynamoDB users table environment variables');
  console.log('5. Deploy the updated code');
  console.log('\n🗑️ Cleanup after verification:');
  console.log('- DROP TABLE user_credits; (if everything looks good)');
  console.log('- Remove DynamoDB users table (if everything looks good)');
}

main().catch(console.error);