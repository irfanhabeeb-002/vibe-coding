-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  max_members INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group members table with approval status
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  UNIQUE(group_id, user_id)
);

-- Create group join requests table
CREATE TABLE public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create food posts table
CREATE TABLE public.food_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  available_until TIMESTAMP WITH TIME ZONE NOT NULL,
  total_count INTEGER NOT NULL CHECK (total_count > 0),
  current_count INTEGER NOT NULL CHECK (current_count >= 0),
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_group_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food claims table
CREATE TABLE public.food_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_post_id UUID NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(food_post_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_post', 'group_invite', 'post_update', 'report_status', 'join_request', 'join_approved', 'join_rejected', 'member_removed', 'group_post')),
  related_id UUID, -- Can reference food_posts, groups, etc.
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_post_id UUID REFERENCES public.food_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for groups
CREATE POLICY "Users can view all groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admins can update their groups" ON public.groups FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "Admins can delete their groups" ON public.groups FOR DELETE USING (auth.uid() = admin_id);

-- RLS Policies for group members
CREATE POLICY "Users can view group members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Group admins can add members" ON public.group_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND admin_id = auth.uid())
);
CREATE POLICY "Group admins can update member status" ON public.group_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND admin_id = auth.uid())
);
CREATE POLICY "Group admins and members can leave" ON public.group_members FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND admin_id = auth.uid())
);

-- RLS Policies for group join requests
CREATE POLICY "Users can view their own join requests" ON public.group_join_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Group admins can view join requests for their groups" ON public.group_join_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND admin_id = auth.uid())
);
CREATE POLICY "Users can create join requests" ON public.group_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Group admins can update join requests" ON public.group_join_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND admin_id = auth.uid())
);

-- RLS Policies for food posts
CREATE POLICY "Users can view active food posts" ON public.food_posts FOR SELECT USING (is_active = true);
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
CREATE POLICY "Users can create food posts" ON public.food_posts FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Post creators can update their posts" ON public.food_posts FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Post creators can delete their posts" ON public.food_posts FOR DELETE USING (auth.uid() = posted_by);

-- RLS Policies for food claims
CREATE POLICY "Users can view their claims" ON public.food_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create claims" ON public.food_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their claims" ON public.food_claims FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for reports
CREATE POLICY "Users can view their reports" ON public.reports FOR SELECT USING (auth.uid() = reported_by);
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update food post count
CREATE OR REPLACE FUNCTION public.update_food_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.food_posts 
    SET current_count = current_count - 1, updated_at = now()
    WHERE id = NEW.food_post_id;
    
    -- Check if count reached 0 and deactivate
    UPDATE public.food_posts 
    SET is_active = false, updated_at = now()
    WHERE id = NEW.food_post_id AND current_count <= 0;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.food_posts 
    SET current_count = current_count + 1, updated_at = now()
    WHERE id = OLD.food_post_id;
    
    -- Reactivate if was inactive due to count
    UPDATE public.food_posts 
    SET is_active = true, updated_at = now()
    WHERE id = OLD.food_post_id AND current_count > 0 AND available_until > now();
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for food claims
CREATE TRIGGER update_food_count_on_claim
  AFTER INSERT OR DELETE ON public.food_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_food_post_count();

-- Create function to notify group members
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

-- Trigger for group notifications
CREATE TRIGGER notify_on_new_post
  AFTER INSERT ON public.food_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_group_members();

-- Create function to handle join request notifications
CREATE OR REPLACE FUNCTION public.notify_join_request()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Notify group admin about new join request
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    SELECT 
      g.admin_id,
      'New Join Request',
      'Someone wants to join your group: ' || g.name,
      'join_request',
      NEW.id
    FROM public.groups g
    WHERE g.id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    -- Notify user about join request status change
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    SELECT 
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Join Request Approved'
        WHEN NEW.status = 'rejected' THEN 'Join Request Rejected'
        ELSE 'Join Request Updated'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your request to join the group has been approved!'
        WHEN NEW.status = 'rejected' THEN 'Your request to join the group has been rejected.'
        ELSE 'Your join request status has been updated.'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'join_approved'
        WHEN NEW.status = 'rejected' THEN 'join_rejected'
        ELSE 'join_request'
      END,
      NEW.id
    FROM public.groups g
    WHERE g.id = NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for join request notifications
CREATE TRIGGER notify_join_requests
  AFTER INSERT OR UPDATE ON public.group_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_join_request();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_group_join_requests_updated_at BEFORE UPDATE ON public.group_join_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_food_posts_updated_at BEFORE UPDATE ON public.food_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live notifications
ALTER TABLE public.food_posts REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.food_claims REPLICA IDENTITY FULL;
ALTER TABLE public.group_members REPLICA IDENTITY FULL;
ALTER TABLE public.group_join_requests REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_join_requests;

-- Create indexes for better performance
CREATE INDEX idx_food_posts_location ON public.food_posts USING GIST (ll_to_earth(latitude, longitude));
CREATE INDEX idx_food_posts_active_until ON public.food_posts (is_active, available_until);
CREATE INDEX idx_group_members_status ON public.group_members (group_id, status);
CREATE INDEX idx_notifications_user_read ON public.notifications (user_id, is_read);
CREATE INDEX idx_group_join_requests_status ON public.group_join_requests (group_id, status);
CREATE INDEX idx_profiles_location ON public.profiles USING GIST (ll_to_earth(latitude, longitude));

-- Create function to get nearby food posts
CREATE OR REPLACE FUNCTION public.get_nearby_food_posts(
  user_lat DECIMAL(10, 8),
  user_lng DECIMAL(11, 8),
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  available_until TIMESTAMP WITH TIME ZONE,
  total_count INTEGER,
  current_count INTEGER,
  posted_by UUID,
  group_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  distance_km DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.*,
    earth_distance(
      ll_to_earth(user_lat, user_lng),
      ll_to_earth(fp.latitude, fp.longitude)
    ) / 1000.0 as distance_km
  FROM public.food_posts fp
  WHERE fp.is_active = true
    AND fp.available_until > now()
    AND fp.latitude IS NOT NULL
    AND fp.longitude IS NOT NULL
    AND earth_distance(
      ll_to_earth(user_lat, user_lng),
      ll_to_earth(fp.latitude, fp.longitude)
    ) <= (radius_km * 1000)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's approved groups
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

-- Create function to handle group member approval
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

-- Create function to handle group member rejection
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