#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Setting up environment variables for Grub Grab Together\n');

const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://xzvifxqwrozipoyqswva.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dmlmeHF3cm96aXBveXFzd3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2MzEsImV4cCI6MjA2ODUzMjYzMX0.hI-FENRJRCx8Dld--0k8-BJK8vY35AEshL2i1Zi80ys

# Google OAuth Configuration (Optional)
# VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local file already exists');
    console.log('   If you want to update it, please edit it manually or delete it first.');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file with Supabase configuration');
    console.log('   The file contains the correct Supabase URL and anon key.');
  }
  
  console.log('\n📋 Next steps:');
  console.log('   1. Start the development server: npm run dev');
  console.log('   2. The app should now connect to Supabase properly');
  console.log('   3. If you want to use Google OAuth, add your Google Client ID to .env.local');
  
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  console.log('\n📝 Manual setup:');
  console.log('   Create a .env.local file in the project root with:');
  console.log('   VITE_SUPABASE_URL=https://xzvifxqwrozipoyqswva.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dmlmeHF3cm96aXBveXFzd3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2MzEsImV4cCI6MjA2ODUzMjYzMX0.hI-FENRJRCx8Dld--0k8-BJK8vY35AEshL2i1Zi80ys');
} 