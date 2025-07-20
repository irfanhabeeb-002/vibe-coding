import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { FoodCard } from "@/components/FoodCard";
import { FilterTabs } from "@/components/FilterTabs";
import { NewPostModal } from "@/components/NewPostModal";
import { GroupModal } from "@/components/GroupModal";
import { JoinGroupModal } from "@/components/JoinGroupModal";
import { NearbySection } from "@/components/NearbySection";
import { DatabaseSetupBanner } from "@/components/DatabaseSetupBanner";
import { AuthModal } from "@/components/AuthModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FoodPost = Database['public']['Tables']['food_posts']['Row'] & {
  profiles?: {
    full_name: string | null;
  } | null;
  distance?: string;
};

type Group = Database['public']['Tables']['groups']['Row'] & {
  profiles?: {
    full_name: string | null;
  } | null;
};

type Notification = Database['public']['Tables']['notifications']['Row'];

interface PostData {
  title: string;
  location: string;
  time: string;
  count: number;
  description: string;
  district: string;
  latitude?: number;
  longitude?: number;
  groupId?: string;
  isGroupOnly?: boolean;
}

// Kerala districts for location selection
const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod'
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [foodPosts, setFoodPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Group state
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isJoinGroupModalOpen, setIsJoinGroupModalOpen] = useState(false);

  // Nearby state
  const [nearbyPosts, setNearbyPosts] = useState<FoodPost[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodPost[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Report state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<FoodPost | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Filter counts state
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    nearby: 0,
    available: 0,
    endingSoon: 0
  });

  // Auth state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Database setup state
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  const [schemaSetupComplete, setSchemaSetupComplete] = useState(false);

  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    let isMounted = true;
    
    const getUser = async () => {
      if (!isMounted) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user);
        if (isMounted) {
          setUser(user);
          
          // Update profile if user exists and has Google data
          if (user && user.user_metadata?.full_name) {
            await updateUserProfile(user);
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    
    const getSession = async () => {
      if (!isMounted) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Current session:', session);
        if (session?.user && isMounted) {
          setUser(session.user);
          
          // Update profile if user exists and has Google data
          if (session.user.user_metadata?.full_name) {
            await updateUserProfile(session.user);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }
    };

    getUser();
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state change:', event, session?.user);
      setUser(session?.user ?? null);
      
      // Update profile when user signs in
      if (event === 'SIGNED_IN' && session?.user && session.user.user_metadata?.full_name) {
        await updateUserProfile(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Function to update user profile with Google data
  const updateUserProfile = async (user: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating profile:', error);
      } else {
        console.log('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Test database connection - memoized to prevent infinite loops
  const testDatabaseConnection = useCallback(async () => {
    try {
      console.log('Testing database connection...');
      
      // Test basic connection with a simple query
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Database connection test failed:', error);
        // If profiles table doesn't exist, the schema may need setup
        console.log('⚠️ Database schema may need setup, but connection is available');
        setShowSetupBanner(true);
        setSchemaSetupComplete(false);
        return true;
      } else {
        console.log('✅ Database connection successful');
        setSchemaSetupComplete(true);
        setShowSetupBanner(false);
        return true;
      }
    } catch (error) {
      console.error('Database connection test error:', error);
      return false;
    }
  }, []);

  // Fetch food posts from Supabase
  const fetchFoodPosts = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching food posts...');
      
      // First, let's get ALL posts without filters to debug
      const { data: allPostsData, error: allPostsError } = await supabase
        .from('food_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (allPostsError) {
        console.error('Error fetching all food posts:', allPostsError);
        setFoodPosts([]);
        return;
      }

      console.log('All posts in database:', allPostsData?.length || 0);
      if (allPostsData && allPostsData.length > 0) {
        console.log('Sample post:', allPostsData[0]);
      }
      
      // Now get filtered posts
      const { data: postsData, error: postsError } = await supabase
        .from('food_posts')
        .select('*')
        .eq('is_active', true)
        .gt('available_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching food posts:', postsError);
        // If table doesn't exist, set empty array instead of throwing
        if (postsError.code === '42P01') { // Table doesn't exist
          console.log('Food posts table not found - schema may need setup');
          setFoodPosts([]);
          setShowSetupBanner(true);
          setSchemaSetupComplete(false);
          return;
        }
        // For other errors, just set empty array and continue
        setFoodPosts([]);
        return;
      }

      console.log('Raw food posts data:', postsData);
      console.log('Number of posts found:', postsData?.length || 0);
      
      if (!postsData || postsData.length === 0) {
        console.log('No posts found in database');
        setFoodPosts([]);
        return;
      }

      // Get unique user IDs from posts
      const userIds = [...new Set(postsData.map(post => post.posted_by))];
      
      // Fetch all profiles in a single query
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of user_id to profile data
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });
      }

      // Combine posts with profiles
      const postsWithProfiles = postsData.map(post => ({
        ...post,
        profiles: profilesMap.get(post.posted_by) || null
      })) as FoodPost[];

      console.log('Food posts with profiles:', postsWithProfiles);
      setFoodPosts(postsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching food posts:', error);
      setFoodPosts([]);
      toast({
        title: "Error",
        description: "Failed to load food posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      console.log('Fetching groups...');
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        // If table doesn't exist, set empty array instead of throwing
        if (groupsError.code === '42P01') { // Table doesn't exist
          console.log('Groups table not found - schema may need setup');
          setGroups([]);
          setShowSetupBanner(true);
          setSchemaSetupComplete(false);
          return;
        }
        // For other errors, just set empty array and continue
        setGroups([]);
        return;
      }

      console.log('Raw groups data:', groupsData);

      if (!groupsData || groupsData.length === 0) {
        console.log('No groups found in database');
        setGroups([]);
        return;
      }

      // Get unique admin IDs from groups
      const adminIds = [...new Set(groupsData.map(group => group.admin_id))];
      
      // Fetch all admin profiles in a single query
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', adminIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of user_id to profile data
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });
      }

      // Combine groups with profiles
      const groupsWithProfiles = groupsData.map(group => ({
        ...group,
        profiles: profilesMap.get(group.admin_id) || null
      })) as Group[];

      console.log('Groups with profiles:', groupsWithProfiles);
      setGroups(groupsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      setGroups([]);
      toast({
        title: "Error",
        description: "Failed to load groups. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Initial data fetch - run only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      if (!isMounted) return;
      
      try {
        console.log('Initializing app...');
        setInitializing(true);
        
        // Test database connection first
        const dbConnected = await testDatabaseConnection();
        if (dbConnected && isMounted) {
          // Fetch data even if schema might not be complete
          await Promise.allSettled([
            fetchFoodPosts(),
            fetchGroups()
          ]);
          
          console.log('App initialization complete');
        } else if (isMounted) {
          console.log('Database connection failed, but continuing with app initialization');
          // Continue with app initialization even if database connection fails
          await Promise.allSettled([
            fetchFoodPosts(),
            fetchGroups()
          ]);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Set empty arrays to prevent UI errors
        setFoodPosts([]);
        setGroups([]);
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };
    
    initializeApp();
    
    return () => {
      isMounted = false;
    };
  }, [testDatabaseConnection, fetchFoodPosts, fetchGroups]); // Include dependencies

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return; // Only subscribe if user is authenticated
    
    // Subscribe to food posts changes
    const foodPostsChannel = supabase
      .channel('food_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_posts'
        },
        () => {
          console.log('Food posts changed, refreshing...');
          fetchFoodPosts();
        }
      )
      .subscribe();

    // Subscribe to notifications
    const notificationsChannel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    // Subscribe to group members changes
    const groupMembersChannel = supabase
      .channel('group_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Group membership changed, refreshing groups...');
          fetchGroups();
        }
      )
      .subscribe();

    // Subscribe to join requests changes (for group admins)
    const joinRequestsChannel = supabase
      .channel('join_requests_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_join_requests'
        },
        (payload) => {
          console.log('New join request received:', payload);
          // Refresh groups to update request counts
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(foodPostsChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(groupMembersChannel);
      supabase.removeChannel(joinRequestsChannel);
    };
  }, [user?.id]); // Only depend on user ID, not the entire user object

  // Fetch notifications
  useEffect(() => {
    if (!user?.id) return; // Only fetch if user ID exists
    
    const fetchNotifications = async () => {
      try {
        console.log('Fetching notifications for user:', user.id);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }

        console.log('Notifications fetched:', data?.length || 0);
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.is_read).length || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user?.id]); // Only depend on user ID

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return; // Only subscribe if user is authenticated
    
    try {
      // Subscribe to food posts changes
      const foodPostsChannel = supabase
        .channel('food_posts_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'food_posts'
          },
          () => {
            console.log('Food posts changed, refreshing...');
            fetchFoodPosts();
          }
        )
        .subscribe();

      // Subscribe to notifications
      const notificationsChannel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New notification received:', payload);
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        )
        .subscribe();

      return () => {
        foodPostsChannel.unsubscribe();
        notificationsChannel.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }
  }, [user, fetchFoodPosts, toast]); // Only depend on user ID

  const handleAvail = async (id: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim food",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Claiming food post:', id);
      console.log('User ID:', user.id);

      // Check if user already claimed this post
      const { data: existingClaim, error: checkError } = await supabase
        .from('food_claims')
        .select('*')
        .eq('food_post_id', id)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing claim:', checkError);
        throw checkError;
      }

      if (existingClaim) {
        toast({
          title: "Already Claimed",
          description: "You have already claimed food from this post",
          variant: "destructive"
        });
        return;
      }

      // Create claim
      const claimData = {
        food_post_id: id,
        user_id: user.id
      };

      console.log('Creating claim with data:', claimData);

      const { data: insertedClaim, error } = await supabase
        .from('food_claims')
        .insert(claimData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Claim created successfully:', insertedClaim);

      toast({
        title: "Food Reserved!",
        description: "You've successfully claimed food from this post",
      });

      // Refresh posts to get updated count
      fetchFoodPosts();
    } catch (error: any) {
      console.error('Error claiming food:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to claim food. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNewPost = async (data: PostData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a post",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('=== CREATING NEW FOOD POST ===');
      console.log('Form data received:', data);
      console.log('User ID:', user.id);
      console.log('User email:', user.email);

      // Validate data
      if (!data.title?.trim()) {
        throw new Error('Food title is required');
      }
      if (!data.location?.trim()) {
        throw new Error('Location is required');
      }
      if (!data.district) {
        throw new Error('District is required');
      }
      if (!data.time) {
        throw new Error('Available until time is required');
      }
      if (!data.count || data.count < 1) {
        throw new Error('Number of people must be at least 1');
      }

      const postData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        location: data.location.trim(),
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        available_until: new Date(data.time).toISOString(),
        total_count: parseInt(data.count.toString()),
        current_count: parseInt(data.count.toString()),
        posted_by: user.id,
        group_id: data.groupId || null,
        is_group_only: data.isGroupOnly || false,
        is_active: true
      };

      console.log('Processed post data to insert:', postData);

      const { data: insertedPost, error } = await supabase
        .from('food_posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Post created successfully:', insertedPost);

      toast({
        title: "Food Shared! 🎉",
        description: `"${data.title}" is now live for the community`,
      });

      setIsNewPostOpen(false);
      
      // Refresh the food posts list
      setTimeout(() => {
        fetchFoodPosts();
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      toast({
        title: "Error Creating Post",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive"
      });
    }
  };



  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportingPost || !reportReason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setReportLoading(true);
    try {
      // Check if user has already reported this post
      const { data: existingReport, error: checkError } = await supabase
        .from('reports')
        .select('id')
        .eq('reported_by', user.id)
        .eq('food_post_id', reportingPost.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing report:', checkError);
      }

      if (existingReport) {
        toast({
          title: "Already Reported",
          description: "You have already reported this post.",
          variant: "destructive"
        });
        return;
      }

      // Submit the report
      const { error } = await supabase
        .from('reports')
        .insert({
          reported_by: user.id,
          food_post_id: reportingPost.id,
          reason: reportReason,
          description: reportDescription || null
        });

      if (error) {
        console.error('Report submission error:', error);
        throw error;
      }

      toast({
        title: "Report Submitted",
        description: "Thank you for your report. We'll review it shortly and take appropriate action.",
      });

      // Reset form
      setReportReason('');
      setReportDescription('');
      setReportingPost(null);
      setIsReportModalOpen(false);
    } catch (error) {
      console.error('Report error:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setReportLoading(false);
    }
  };

  const openReportModal = (post: FoodPost) => {
    setReportingPost(post);
    setIsReportModalOpen(true);
  };

  // Helper: Calculate distance between two lat/lng points (Haversine formula)
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Fetch nearby posts from Supabase using the new function
  const fetchNearbyPosts = useCallback(async () => {
    setNearbyLoading(true);
    setNearbyError(null);
    
    if (!navigator.geolocation) {
      setNearbyError("Geolocation is not supported by your browser.");
      setNearbyLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        console.log('Fetching nearby posts for location:', { latitude, longitude });
        
        // Use the new database function for better performance
        const { data, error } = await supabase
          .rpc('get_nearby_food_posts', {
            user_lat: latitude,
            user_lng: longitude,
            radius_km: 10
          });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        console.log('Nearby posts found:', data?.length || 0);

        // Get user profiles for the posts
        const postsWithProfiles = await Promise.all(
          (data || []).map(async (post) => {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', post.posted_by)
                .single();
              
              return {
                ...post,
                profiles: profileData,
                distance: `${post.distance_km.toFixed(1)} km`,
                is_group_only: (post as any).is_group_only || false
              } as FoodPost;
            } catch (profileError) {
              console.error('Error fetching profile for post:', post.id, profileError);
              return {
                ...post,
                profiles: { full_name: 'Unknown' },
                distance: `${post.distance_km.toFixed(1)} km`,
                is_group_only: (post as any).is_group_only || false
              } as FoodPost;
            }
          })
        );

        setNearbyPosts(postsWithProfiles);
        setNearbyError(null);
      } catch (error) {
        console.error('Nearby posts error:', error);
        setNearbyError("Failed to fetch nearby posts. Please check your internet connection and try again.");
        setNearbyPosts([]);
      } finally {
        setNearbyLoading(false);
      }
    }, (err) => {
      console.error('Geolocation error:', err);
      let errorMessage = "Failed to get your location.";
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = "Location access denied. Please enable location services in your browser settings.";
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable. Please try again.";
          break;
        case err.TIMEOUT:
          errorMessage = "Location request timed out. Please try again.";
          break;
        default:
          errorMessage = "An unknown error occurred while getting your location.";
      }
      
      setNearbyError(errorMessage);
      setNearbyLoading(false);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    });
  }, []);

  // Auto-fetch nearby posts when nearby filter is selected
  useEffect(() => {
    if (activeFilter === 'nearby' && nearbyPosts.length === 0 && !nearbyLoading) {
      fetchNearbyPosts();
    }
  }, [activeFilter, nearbyPosts.length, nearbyLoading, fetchNearbyPosts]);

  // Search food posts from Supabase
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const { data, error } = await supabase
        .from('food_posts')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get user profiles for the posts
      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', post.posted_by)
            .single();
          
          return {
            ...post,
            profiles: profileData
          } as FoodPost;
        })
      );
      
      setSearchResults(postsWithProfiles);
    } catch (error) {
      setSearchError('Failed to search posts.');
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Calculate filter counts
  const calculateFilterCounts = useCallback(() => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    const counts = {
      all: foodPosts.length,
      nearby: nearbyPosts.length,
      available: foodPosts.filter(post => 
        new Date(post.available_until) > now && post.current_count > 0
      ).length,
      endingSoon: foodPosts.filter(post => 
        new Date(post.available_until) > now && 
        new Date(post.available_until) <= oneHourFromNow && 
        post.current_count > 0
      ).length
    };

    setFilterCounts(counts);
  }, [foodPosts, nearbyPosts]);

  // Update filter counts when data changes
  useEffect(() => {
    calculateFilterCounts();
  }, [calculateFilterCounts]);

  // Filter posts based on active filter
  const getFilteredPosts = useCallback(() => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    switch (activeFilter) {
      case 'all':
        return foodPosts;
      case 'nearby':
        return nearbyPosts;
      case 'available':
        return foodPosts.filter(post => 
          new Date(post.available_until) > now && post.current_count > 0
        );
      case 'ending-soon':
        return foodPosts.filter(post => 
          new Date(post.available_until) > now && 
          new Date(post.available_until) <= oneHourFromNow && 
          post.current_count > 0
        );
      default:
        return foodPosts;
    }
  }, [foodPosts, nearbyPosts, activeFilter]);

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handleSearch(query), 300);
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      toast({
        title: "Notifications Updated",
        description: "All notifications marked as read.",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleApproveJoinRequest = async (notification: Notification) => {
    try {
      // Get the join request details from the related_id
      const { data: joinRequest, error: fetchError } = await supabase
        .from('group_join_requests')
        .select('*')
        .eq('id', notification.related_id)
        .single();

      if (fetchError || !joinRequest) {
        console.error('Error fetching join request:', fetchError);
        alert('Could not find the join request.');
        return;
      }

      // Use the database function to approve the member
      const { data, error } = await supabase
        .rpc('approve_group_member', {
          group_uuid: joinRequest.group_id,
          user_uuid: joinRequest.user_id,
          admin_uuid: user.id
        });

      if (error) throw error;

      if (data) {
        // Show success message
        toast({
          title: "Request Approved",
          description: "Join request approved successfully!",
        });
        
        // Remove the notification from the list instead of marking as read
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Refresh groups to update counts
        fetchGroups();
      } else {
        alert('Failed to approve request. You may not have permission.');
      }
    } catch (error) {
      console.error('Error approving join request:', error);
      toast({
        title: "Error",
        description: "Failed to approve join request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectJoinRequest = async (notification: Notification) => {
    try {
      // Get the join request details from the related_id
      const { data: joinRequest, error: fetchError } = await supabase
        .from('group_join_requests')
        .select('*')
        .eq('id', notification.related_id)
        .single();

      if (fetchError || !joinRequest) {
        console.error('Error fetching join request:', fetchError);
        alert('Could not find the join request.');
        return;
      }

      // Use the database function to reject the member
      const { data, error } = await supabase
        .rpc('reject_group_member', {
          group_uuid: joinRequest.group_id,
          user_uuid: joinRequest.user_id,
          admin_uuid: user.id
        });

      if (error) throw error;

      if (data) {
        // Show success message
        toast({
          title: "Request Rejected",
          description: "Join request rejected successfully!",
        });
        
        // Remove the notification from the list instead of marking as read
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Refresh groups to update counts
        fetchGroups();
      } else {
        alert('Failed to reject request. You may not have permission.');
      }
    } catch (error) {
      console.error('Error rejecting join request:', error);
      toast({
        title: "Error",
        description: "Failed to reject join request. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Check if user is admin of the group for a join request notification
  const isAdminOfJoinRequest = (notification: Notification) => {
    if (!user || notification.type !== 'join_request' || !notification.related_id) {
      return false;
    }
    
    // For now, check if user is admin of any group
    // In a more sophisticated implementation, we could cache the join request data
    return groups.some(group => group.admin_id === user.id);
  };

  const renderTabContent = () => {
    // Show initialization loading
    if (initializing) {
      return (
        <div className="pb-20">
          <div className="px-4 space-y-4">
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Initializing app...</p>
              <p className="text-xs text-muted-foreground mt-2">
                This may take a moment on first run
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'home':
        return (
          <div className="pb-20">
            <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={filterCounts} />
            <div className="px-4 space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading food posts...</p>
                </div>
              ) : getFilteredPosts().length === 0 ? (
                <div className="text-center py-12 fade-in">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {activeFilter === 'nearby' ? 'No nearby food found' :
                     activeFilter === 'available' ? 'No available food' :
                     activeFilter === 'ending-soon' ? 'No food ending soon' :
                     'No food available'}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {activeFilter === 'nearby' ? 'Try enabling location access or check back later' :
                     activeFilter === 'available' ? 'All food has been claimed or expired' :
                     activeFilter === 'ending-soon' ? 'No food is ending within the next hour' :
                     'Be the first to share food in your area!'}
                  </p>
                  
                  {/* Show setup instructions if user is not signed in */}
                  {!user && (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        💡 <strong>New to Grub Grab Together?</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sign in to start sharing and finding food in your community!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                getFilteredPosts().map((post, index) => (
                  <div key={post.id} className="slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <FoodCard 
                      id={post.id}
                      title={post.title}
                      location={post.location}
                      time={`Available until ${new Date(post.available_until).toLocaleString()}`}
                      count={post.current_count}
                      totalCount={post.total_count}
                      postedBy={post.profiles?.full_name || 'Anonymous'}
                      distance={post.distance}
                      description={post.description || 'No description'}
                      availableUntil={post.available_until}
                      onAvail={handleAvail}
                      onReport={() => openReportModal(post)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      
      case 'nearby':
        return (
          <div className="pb-20">
            <div className="px-4 space-y-4">
              <NearbySection
                user={user}
                onClaim={handleAvail}
                onReport={openReportModal}
              />
            </div>
          </div>
        );
        
      case 'search':
        return (
          <div className="flex flex-col items-center justify-center h-96 fade-in">
            <div className="text-center w-full max-w-md">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Search Food</h3>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by title, location, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {searchLoading && (
                <div className="text-muted-foreground text-sm mb-4">Searching...</div>
              )}
              {searchError && (
                <div className="text-red-500 text-sm mb-4">{searchError}</div>
              )}
              <div className="text-left">
                {searchResults.length === 0 && !searchLoading && searchQuery && !searchError && (
                  <div className="text-muted-foreground text-sm">No results found.</div>
                )}
                {!searchQuery && !searchLoading && (
                  <div className="text-muted-foreground text-sm">Enter a search term to find food.</div>
                )}
                <ul className="space-y-2">
                  {searchResults.map((post) => (
                    <li key={post.id} className="bg-background p-3 rounded shadow group relative">
                      <button
                        onClick={() => openReportModal(post)}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Report this post"
                      >
                        <span className="text-xs">🚩</span>
                      </button>
                      <div className="font-semibold">{post.title}</div>
                      <div className="text-xs text-muted-foreground">{post.location} • {post.distance}</div>
                      <div className="text-xs">{post.description}</div>
                      <div className="text-xs text-primary mt-1">
                        {post.current_count}/{post.total_count} available
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
        
      case 'groups':
        return (
          <div className="flex flex-col items-center justify-center h-96 fade-in">
            <div className="text-center w-full max-w-md">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Food Groups</h3>
              <p className="text-muted-foreground text-sm px-8 mb-4">
                Create and join groups to share food notifications with your community
              </p>
              {user ? (
                <div className="flex flex-col space-y-2 mb-4">
                  <button
                    className="btn-apple btn-primary px-4 py-2 rounded"
                    onClick={() => setIsGroupModalOpen(true)}
                  >
                    + Manage Groups
                  </button>
                  <button
                    className="btn-apple btn-secondary px-4 py-2 rounded"
                    onClick={() => setIsJoinGroupModalOpen(true)}
                  >
                    + Join Group
                  </button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm mb-4">Sign in to create and join groups</p>
              )}
              <div className="text-left">
                {groups.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No groups yet. Create one!</div>
                ) : (
                  <ul className="space-y-2">
                    {groups.map(group => (
                      <li key={group.id} className="bg-background p-3 rounded shadow">
                        <div className="font-semibold">{group.name}</div>
                        {group.description && <div className="text-xs text-muted-foreground">{group.description}</div>}
                        <div className="text-xs text-muted-foreground mt-1">
                          Admin: {group.profiles?.full_name || 'Unknown'}
                        </div>
                        {group.admin_id === user?.id && (
                          <div className="text-xs text-primary mt-1">You are the admin</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onNewPost={() => setIsNewPostOpen(true)}
        onShowGroups={() => setActiveTab('groups')}
        notificationCount={unreadCount}
        onNotificationClick={() => setIsNotificationModalOpen(true)}
        user={user}
        onAuthClick={() => setIsAuthModalOpen(true)}
      />
      
      <main className="max-w-md mx-auto">
        {showSetupBanner && (
          <div className="px-4 pt-4">
            <DatabaseSetupBanner onClose={() => setShowSetupBanner(false)} />
          </div>
        )}
        {renderTabContent()}
      </main>
      
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        unreadCount={unreadCount}
        onNotificationClick={() => setIsNotificationModalOpen(true)}
      />
      
      <NewPostModal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        onSubmit={handleNewPost}
        districts={KERALA_DISTRICTS}
        groups={groups}
        user={user}
        onAuthClick={() => setIsAuthModalOpen(true)}
      />

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={fetchGroups}
        onGroupUpdated={fetchGroups}
        onGroupDeleted={fetchGroups}
        groups={groups}
        user={user}
      />

      <JoinGroupModal
        isOpen={isJoinGroupModalOpen}
        onClose={() => setIsJoinGroupModalOpen(false)}
        groups={groups}
        user={user}
        onJoinRequestSent={fetchGroups}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          setIsAuthModalOpen(false);
          // Refresh user state and data
          setTimeout(() => {
            fetchFoodPosts();
            fetchGroups();
          }, 1000);
        }}
      />

      {/* Notification Modal */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-x-4 top-20 bottom-20 max-w-md mx-auto">
            <div className="card-apple h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Notifications</h2>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      Mark All Read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationModalOpen(false)}
                    className="p-2 hover:bg-muted rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">No notifications yet</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded border ${
                          !notification.is_read ? 'bg-accent border-primary' : 'bg-background'
                        }`}
                      >
                        <div className="cursor-pointer">
                          <div className="font-semibold text-sm">{notification.title}</div>
                          <div className="text-xs text-muted-foreground">{notification.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </div>
                        
                        {/* Show accept/reject buttons for join request notifications */}
                        {notification.type === 'join_request' && isAdminOfJoinRequest(notification) && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveJoinRequest(notification);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectJoinRequest(notification);
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded transition-colors"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                        
                        {/* Show mark as read button for all notifications */}
                        {!notification.is_read && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notification.id);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
                            >
                              ✓ Mark as Read
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && reportingPost && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-x-4 top-20 bottom-20 max-w-md mx-auto">
            <div className="card-apple h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Report Post</h2>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-2 hover:bg-muted rounded"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleReport} className="flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Post: {reportingPost.title}</h3>
                  <p className="text-sm text-muted-foreground">{reportingPost.description}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Reason for Report *</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      reportReason === '' ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="spam">Spam</option>
                    <option value="fake_post">Fake Post</option>
                    <option value="expired_food">Expired Food</option>
                    <option value="other">Other</option>
                  </select>
                  {reportReason === '' && (
                    <p className="text-red-500 text-xs mt-1">Please select a reason for reporting</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Additional Details (Optional)</label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="Please provide more details about your report..."
                  />
                </div>
                <div className="flex gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setReportReason('');
                      setReportDescription('');
                      setReportingPost(null);
                      setIsReportModalOpen(false);
                    }}
                    className="flex-1 p-3 border rounded-lg hover:bg-muted"
                    disabled={reportLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    disabled={reportLoading || !reportReason.trim()}
                  >
                    {reportLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
