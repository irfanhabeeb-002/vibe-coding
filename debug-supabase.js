const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugSupabase() {
  console.log('🔍 Debugging Supabase Database...\n');

  try {
    // 1. Check if tables exist
    console.log('📋 1. Checking if tables exist...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['food_posts', 'profiles', 'groups', 'group_members']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('✅ Tables found:', tables.map(t => t.table_name));
    }

    // 2. Check food_posts table structure
    console.log('\n📋 2. Checking food_posts table structure...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'food_posts')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
    } else {
      console.log('✅ food_posts columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 3. Check RLS policies
    console.log('\n📋 3. Checking RLS policies...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('policy_name, table_name, permissive, roles, cmd, qual')
      .eq('table_schema', 'public')
      .eq('table_name', 'food_posts');

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('✅ RLS policies for food_posts:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policy_name}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
      });
    }

    // 4. Check if RLS is enabled
    console.log('\n📋 4. Checking if RLS is enabled...');
    
    const { data: rlsEnabled, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('table_name, row_security')
      .eq('table_schema', 'public')
      .eq('table_name', 'food_posts');

    if (rlsError) {
      console.error('❌ Error checking RLS:', rlsError);
    } else {
      console.log('✅ RLS status:', rlsEnabled[0]?.row_security ? 'ENABLED' : 'DISABLED');
    }

    // 5. Count all food posts (without filters)
    console.log('\n📋 5. Counting all food posts...');
    
    const { count: totalPosts, error: countError } = await supabase
      .from('food_posts')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting posts:', countError);
    } else {
      console.log(`✅ Total food posts in database: ${totalPosts}`);
    }

    // 6. Get all food posts with details
    console.log('\n📋 6. Getting all food posts with details...');
    
    const { data: allPosts, error: postsError } = await supabase
      .from('food_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
    } else {
      console.log(`✅ Found ${allPosts.length} posts:`);
      allPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. "${post.title}"`);
        console.log(`      - ID: ${post.id}`);
        console.log(`      - Posted by: ${post.posted_by}`);
        console.log(`      - Active: ${post.is_active}`);
        console.log(`      - Available until: ${post.available_until}`);
        console.log(`      - Created: ${post.created_at}`);
        console.log(`      - Current count: ${post.current_count}/${post.total_count}`);
        console.log(`      - Group only: ${post.is_group_only || false}`);
        console.log('');
      });
    }

    // 7. Check active posts (with filters)
    console.log('\n📋 7. Checking active posts (with filters)...');
    
    const now = new Date().toISOString();
    const { data: activePosts, error: activeError } = await supabase
      .from('food_posts')
      .select('*')
      .eq('is_active', true)
      .gt('available_until', now)
      .order('created_at', { ascending: false });

    if (activeError) {
      console.error('❌ Error fetching active posts:', activeError);
    } else {
      console.log(`✅ Active posts (is_active=true AND available_until > now): ${activePosts.length}`);
      if (activePosts.length === 0 && allPosts.length > 0) {
        console.log('⚠️  No active posts found, but there are posts in the database.');
        console.log('   This means posts are either:');
        console.log('   - is_active = false, OR');
        console.log('   - available_until is in the past');
        
        // Check which condition is failing
        const { data: inactivePosts } = await supabase
          .from('food_posts')
          .select('*')
          .eq('is_active', false);
        
        const { data: expiredPosts } = await supabase
          .from('food_posts')
          .select('*')
          .lte('available_until', now);
        
        console.log(`   - Posts with is_active=false: ${inactivePosts?.length || 0}`);
        console.log(`   - Posts with expired available_until: ${expiredPosts?.length || 0}`);
      }
    }

    // 8. Check user profiles
    console.log('\n📋 8. Checking user profiles...');
    
    if (allPosts.length > 0) {
      const userIds = [...new Set(allPosts.map(post => post.posted_by))];
      console.log(`   Looking for profiles for users: ${userIds.join(', ')}`);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
      } else {
        console.log(`✅ Found ${profiles.length} profiles:`);
        profiles.forEach(profile => {
          console.log(`   - ${profile.user_id}: ${profile.full_name || 'No name'}`);
        });
        
        const missingProfiles = userIds.filter(id => !profiles.find(p => p.user_id === id));
        if (missingProfiles.length > 0) {
          console.log(`⚠️  Missing profiles for users: ${missingProfiles.join(', ')}`);
        }
      }
    }

    // 9. Test inserting a sample post
    console.log('\n📋 9. Testing post creation...');
    
    const testPost = {
      title: 'Test Food Post',
      description: 'This is a test post for debugging',
      location: 'Test Location',
      latitude: 10.8505,
      longitude: 76.2711,
      available_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      total_count: 5,
      current_count: 5,
      posted_by: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      group_id: null,
      is_group_only: false,
      is_active: true
    };

    console.log('   Attempting to insert test post...');
    const { data: insertedPost, error: insertError } = await supabase
      .from('food_posts')
      .insert(testPost)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test post:', insertError);
      console.log('   This might be due to:');
      console.log('   - RLS policies blocking insertion');
      console.log('   - Missing required fields');
      console.log('   - Foreign key constraints');
    } else {
      console.log('✅ Test post inserted successfully:', insertedPost.id);
      
      // Clean up test post
      await supabase
        .from('food_posts')
        .delete()
        .eq('id', insertedPost.id);
      console.log('   Test post cleaned up');
    }

    console.log('\n🎯 Debug Summary:');
    console.log('   If you see posts in step 6 but not in step 7, the issue is with the filters.');
    console.log('   If you see no posts at all, the issue is with RLS policies or data insertion.');
    console.log('   If you see posts but no profiles, the issue is with user profile creation.');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugSupabase(); 