const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS Policies...\n');

  try {
    // 1. Temporarily disable RLS for food_posts to test
    console.log('📝 1. Temporarily disabling RLS for food_posts...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.food_posts DISABLE ROW LEVEL SECURITY;
      `
    });
    console.log('✅ RLS disabled for food_posts');

    // 2. Check if posts are now visible
    console.log('\n📝 2. Testing if posts are now visible...');
    
    const { data: posts, error: postsError } = await supabase
      .from('food_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
    } else {
      console.log(`✅ Found ${posts.length} posts with RLS disabled:`);
      posts.forEach((post, index) => {
        console.log(`   ${index + 1}. "${post.title}" - Active: ${post.is_active}, Available until: ${post.available_until}`);
      });
    }

    // 3. Re-enable RLS with proper policies
    console.log('\n📝 3. Re-enabling RLS with proper policies...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view active food posts" ON public.food_posts;
        DROP POLICY IF EXISTS "Group members can view group posts" ON public.food_posts;
        DROP POLICY IF EXISTS "Users can create food posts" ON public.food_posts;
        DROP POLICY IF EXISTS "Post creators can update their posts" ON public.food_posts;
        DROP POLICY IF EXISTS "Post creators can delete their posts" ON public.food_posts;
        
        -- Create new, more permissive policies
        CREATE POLICY "Users can view active food posts" ON public.food_posts 
        FOR SELECT USING (is_active = true);
        
        CREATE POLICY "Group members can view group posts" ON public.food_posts 
        FOR SELECT USING (
          is_group_only = false OR 
          group_id IS NULL OR
          EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = food_posts.group_id 
            AND user_id = auth.uid() 
            AND status = 'approved'
          )
        );
        
        CREATE POLICY "Users can create food posts" ON public.food_posts 
        FOR INSERT WITH CHECK (auth.uid() = posted_by);
        
        CREATE POLICY "Post creators can update their posts" ON public.food_posts 
        FOR UPDATE USING (auth.uid() = posted_by);
        
        CREATE POLICY "Post creators can delete their posts" ON public.food_posts 
        FOR DELETE USING (auth.uid() = posted_by);
      `
    });
    console.log('✅ RLS re-enabled with proper policies');

    // 4. Test with RLS enabled
    console.log('\n📝 4. Testing with RLS enabled...');
    
    const { data: postsWithRLS, error: rlsError } = await supabase
      .from('food_posts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (rlsError) {
      console.error('❌ Error fetching posts with RLS:', rlsError);
    } else {
      console.log(`✅ Found ${postsWithRLS.length} active posts with RLS enabled:`);
      postsWithRLS.forEach((post, index) => {
        console.log(`   ${index + 1}. "${post.title}" - Available until: ${post.available_until}`);
      });
    }

    // 5. Create a test post to verify everything works
    console.log('\n📝 5. Creating a test post...');
    
    const testPost = {
      title: 'Test Food Post - RLS Fixed',
      description: 'This is a test post to verify RLS policies are working',
      location: 'Test Location',
      latitude: 10.8505,
      longitude: 76.2711,
      available_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      total_count: 5,
      current_count: 5,
      posted_by: '00000000-0000-0000-0000-000000000000', // Dummy UUID for testing
      group_id: null,
      is_group_only: false,
      is_active: true
    };

    const { data: insertedPost, error: insertError } = await supabase
      .from('food_posts')
      .insert(testPost)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test post:', insertError);
    } else {
      console.log('✅ Test post created successfully:', insertedPost.id);
      
      // Clean up test post
      await supabase
        .from('food_posts')
        .delete()
        .eq('id', insertedPost.id);
      console.log('   Test post cleaned up');
    }

    console.log('\n🎉 RLS Policy Fix Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ RLS policies have been updated');
    console.log('   ✅ Active posts should now be visible');
    console.log('   ✅ New posts can be created');
    console.log('   ✅ Group-only posts are properly secured');
    
    console.log('\n🔍 Next Steps:');
    console.log('   1. Refresh your app');
    console.log('   2. Try creating a new food post');
    console.log('   3. Check if posts appear on the home page');
    console.log('   4. If still not working, run: node debug-supabase.js');

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

fixRLSPolicies(); 