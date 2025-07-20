#!/usr/bin/env node

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

async function setupDatabase() {
  console.log('🚀 Setting up enhanced database schema...\n');

  try {
    // 1. Add new columns to existing tables
    console.log('📝 Adding new columns to existing tables...');
    
    // Add location fields to profiles
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS location TEXT,
        ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
      `
    });
    console.log('✅ Added location fields to profiles table');

    // Add group management fields to groups
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.groups 
        ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 100;
      `
    });
    console.log('✅ Added privacy and member limit fields to groups table');

    // Add role field to group_members
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.group_members 
        ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member'));
      `
    });
    console.log('✅ Added role field to group_members table');

    // Add group-only field to food_posts
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.food_posts 
        ADD COLUMN IF NOT EXISTS is_group_only BOOLEAN NOT NULL DEFAULT false;
      `
    });
    console.log('✅ Added group-only field to food_posts table');

    // Add group_id field to reports
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.reports 
        ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
      `
    });
    console.log('✅ Added group_id field to reports table');

    // 2. Update notification types
    console.log('\n📝 Updating notification types...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.notifications 
        DROP CONSTRAINT IF EXISTS notifications_type_check;
        
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_type_check 
        CHECK (type IN ('new_post', 'group_invite', 'post_update', 'report_status', 'join_request', 'join_approved', 'join_rejected', 'member_removed', 'group_post'));
      `
    });
    console.log('✅ Updated notification types');

    // 3. Create new indexes
    console.log('\n📝 Creating new indexes...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST (ll_to_earth(latitude, longitude));
      `
    });
    console.log('✅ Created location index for profiles');

    // 4. Update RLS policies for group-only posts
    console.log('\n📝 Updating RLS policies...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Group members can view group posts" ON public.food_posts;
        
        CREATE POLICY "Group members can view group posts" ON public.food_posts FOR SELECT USING (
          is_group_only = false OR 
          group_id IS NULL OR
          EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = food_posts.group_id 
            AND user_id = auth.uid() 
            AND status = 'approved'
          )
        );
      `
    });
    console.log('✅ Updated RLS policies for group-only posts');

    // 5. Create new database functions
    console.log('\n📝 Creating new database functions...');
    
    // Function to get user's groups
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.get_user_groups(user_uuid UUID)
        RETURNS TABLE (
          group_id UUID,
          group_name TEXT,
          group_description TEXT,
          admin_id UUID,
          admin_name TEXT,
          member_count BIGINT,
          user_role TEXT,
          user_status TEXT
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            g.id as group_id,
            g.name as group_name,
            g.description as group_description,
            g.admin_id,
            p.full_name as admin_name,
            COUNT(gm2.id) as member_count,
            gm.role as user_role,
            gm.status as user_status
          FROM public.groups g
          LEFT JOIN public.profiles p ON g.admin_id = p.user_id
          LEFT JOIN public.group_members gm ON g.id = gm.group_id AND gm.user_id = user_uuid
          LEFT JOIN public.group_members gm2 ON g.id = gm2.group_id AND gm2.status = 'approved'
          WHERE g.admin_id = user_uuid OR (gm.user_id = user_uuid AND gm.status = 'approved')
          GROUP BY g.id, g.name, g.description, g.admin_id, p.full_name, gm.role, gm.status
          ORDER BY g.created_at DESC;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    console.log('✅ Created get_user_groups function');

    // Function to approve group member
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.approve_group_member(
          group_uuid UUID,
          user_uuid UUID,
          admin_uuid UUID
        )
        RETURNS BOOLEAN AS $$
        DECLARE
          is_admin BOOLEAN;
        BEGIN
          -- Check if the user is the admin of the group
          SELECT EXISTS(
            SELECT 1 FROM public.groups 
            WHERE id = group_uuid AND admin_id = admin_uuid
          ) INTO is_admin;
          
          IF NOT is_admin THEN
            RETURN FALSE;
          END IF;
          
          -- Update the join request status
          UPDATE public.group_join_requests 
          SET status = 'approved', updated_at = now()
          WHERE group_id = group_uuid AND user_id = user_uuid;
          
          -- Add user to group members with approved status
          INSERT INTO public.group_members (group_id, user_id, status, approved_at, approved_by)
          VALUES (group_uuid, user_uuid, 'approved', now(), admin_uuid)
          ON CONFLICT (group_id, user_id) 
          DO UPDATE SET 
            status = 'approved',
            approved_at = now(),
            approved_by = admin_uuid;
          
          RETURN TRUE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    console.log('✅ Created approve_group_member function');

    // Function to reject group member
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.reject_group_member(
          group_uuid UUID,
          user_uuid UUID,
          admin_uuid UUID
        )
        RETURNS BOOLEAN AS $$
        DECLARE
          is_admin BOOLEAN;
        BEGIN
          -- Check if the user is the admin of the group
          SELECT EXISTS(
            SELECT 1 FROM public.groups 
            WHERE id = group_uuid AND admin_id = admin_uuid
          ) INTO is_admin;
          
          IF NOT is_admin THEN
            RETURN FALSE;
          END IF;
          
          -- Update the join request status
          UPDATE public.group_join_requests 
          SET status = 'rejected', updated_at = now()
          WHERE group_id = group_uuid AND user_id = user_uuid;
          
          -- Remove user from group members if they exist
          DELETE FROM public.group_members 
          WHERE group_id = group_uuid AND user_id = user_uuid;
          
          RETURN TRUE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    console.log('✅ Created reject_group_member function');

    // 6. Update notification triggers
    console.log('\n📝 Updating notification triggers...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.notify_group_members()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Notify all approved group members when new post is created
          IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, type, related_id)
            SELECT 
              gm.user_id,
              'New Food Available!',
              'New food post: ' || NEW.title || ' at ' || NEW.location,
              'group_post',
              NEW.id
            FROM public.group_members gm
            WHERE gm.group_id = NEW.group_id 
              AND gm.user_id != NEW.posted_by 
              AND gm.status = 'approved';
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    console.log('✅ Updated group notification function');

    // 7. Enable realtime for new tables
    console.log('\n📝 Enabling realtime...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.group_members REPLICA IDENTITY FULL;
        ALTER TABLE public.group_join_requests REPLICA IDENTITY FULL;
        
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_join_requests;
      `
    });
    console.log('✅ Enabled realtime for group tables');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Summary of changes:');
    console.log('   ✅ Added location tracking to user profiles');
    console.log('   ✅ Enhanced group management with privacy and roles');
    console.log('   ✅ Added group-only food posts');
    console.log('   ✅ Created admin approval/rejection functions');
    console.log('   ✅ Updated notification system');
    console.log('   ✅ Enhanced RLS policies for group security');
    console.log('   ✅ Enabled realtime updates for live notifications');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 