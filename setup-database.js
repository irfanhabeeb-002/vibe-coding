#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🍽️  Grub Grab Together - Database Setup Helper');
console.log('===============================================\n');

// Check if schema file exists
const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found at:', schemaPath);
  console.log('Please make sure the supabase/schema.sql file exists.');
  process.exit(1);
}

// Read the schema file
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('✅ Schema file found!');
console.log('\n📋 Setup Instructions:');
console.log('1. Go to your Supabase dashboard (https://supabase.com/dashboard)');
console.log('2. Select your project');
console.log('3. Go to the SQL Editor');
console.log('4. Copy and paste the following schema:');
console.log('\n' + '='.repeat(50));
console.log(schema);
console.log('='.repeat(50));

console.log('\n🔧 Additional Setup Steps:');
console.log('1. Enable the earthdistance extension:');
console.log('   CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;');
console.log('\n2. Verify your environment variables in your .env file:');
console.log('   VITE_SUPABASE_URL=your_supabase_project_url');
console.log('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');

console.log('\n🧪 Testing the Setup:');
console.log('After running the schema, test these queries:');
console.log('\n1. Test nearby function:');
console.log('   SELECT * FROM get_nearby_food_posts(10.8505, 76.2711, 10);');
console.log('\n2. Check if tables were created:');
console.log('   SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');

console.log('\n📚 For more detailed instructions, see SUPABASE_SETUP.md');
console.log('\n🎉 Happy coding!');

// Save schema to a separate file for easy copying
const outputPath = path.join(__dirname, 'database-schema.sql');
fs.writeFileSync(outputPath, schema);
console.log(`\n💾 Schema also saved to: ${outputPath}`);
console.log('You can copy this file content directly into Supabase SQL Editor.'); 