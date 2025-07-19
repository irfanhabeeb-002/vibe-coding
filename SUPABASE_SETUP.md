# Supabase Database Setup Guide

This guide will help you set up the complete database schema for the Grub Grab Together application with enhanced group management, location tracking, and live notifications.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Access to your Supabase dashboard
3. The `supabase` CLI (optional, for local development)

## Database Setup

### 1. Run the Complete Schema

Copy and paste the entire contents of `supabase/schema.sql` into your Supabase SQL Editor and execute it. This will create:

- **profiles** - User profile information
- **groups** - Food sharing groups with admin controls
- **group_members** - Group membership with approval status
- **group_join_requests** - Join requests with admin approval
- **food_posts** - Food sharing posts with location data
- **food_claims** - Food claim tracking
- **notifications** - Real-time notifications system
- **reports** - Content moderation system

### 2. Enable Required Extensions

The schema includes the `earthdistance` extension for location-based queries. Make sure this is enabled in your Supabase project:

```sql
-- Enable the earthdistance extension for location queries
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
```

### 3. Verify Row Level Security (RLS)

All tables have RLS enabled with appropriate policies. The policies ensure:

- Users can only access their own data
- Group admins can manage their groups
- Public read access for food posts and groups
- Secure write operations with proper authorization

### 4. Test the Setup

After running the schema, test the following:

1. **User Registration**: Sign up a new user and verify a profile is created
2. **Group Creation**: Create a group and verify admin permissions
3. **Location Queries**: Test the nearby food posts function
4. **Notifications**: Verify real-time notifications work

## Key Features

### Group Management System

- **Admin Controls**: Group creators are automatically admins
- **Member Approval**: Admins can approve/reject member requests
- **Join Requests**: Users can request to join groups with messages
- **Real-time Updates**: Live notifications for group activities

### Location-Based Features

- **Automatic Coordinates**: Location coordinates are fetched when districts are selected
- **Nearby Search**: Efficient database function for finding nearby food posts
- **Distance Calculation**: Accurate distance calculations using PostgreSQL extensions

### Live Notifications

- **Real-time Updates**: Instant notifications for new posts, join requests, etc.
- **Multiple Types**: Different notification types for various events
- **Read Status**: Track which notifications have been read

### Content Moderation

- **Report System**: Users can report inappropriate content
- **Admin Review**: Reports are tracked with status updates
- **User Safety**: Secure reporting with proper access controls

## Environment Variables

Make sure your frontend has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Functions

The schema includes several PostgreSQL functions:

1. **`get_nearby_food_posts`** - Efficient nearby food post search
2. **`handle_new_user`** - Automatic profile creation on signup
3. **`update_food_post_count`** - Automatic count management
4. **`notify_group_members`** - Group notification system
5. **`notify_join_request`** - Join request notifications

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure all policies are created correctly
2. **Extension Errors**: Verify earthdistance extension is enabled
3. **Function Errors**: Check that all functions are created with proper permissions

### Testing Queries

Test the nearby function:

```sql
SELECT * FROM get_nearby_food_posts(10.8505, 76.2711, 10);
```

Test group notifications:

```sql
-- Insert a test food post with group_id
INSERT INTO food_posts (title, location, available_until, total_count, current_count, posted_by, group_id)
VALUES ('Test Food', 'Test Location', NOW() + INTERVAL '1 hour', 5, 5, 'user-uuid', 'group-uuid');
```

## Security Considerations

1. **RLS Policies**: All tables have appropriate security policies
2. **Function Security**: Database functions use SECURITY DEFINER where needed
3. **Input Validation**: Frontend validates all inputs before database operations
4. **Error Handling**: Proper error handling prevents information leakage

## Performance Optimization

1. **Indexes**: Strategic indexes on frequently queried columns
2. **Geospatial Indexes**: GIST indexes for location-based queries
3. **Realtime**: Optimized realtime subscriptions for live updates
4. **Connection Pooling**: Efficient database connection management

## Monitoring

Monitor your database performance through:

1. **Supabase Dashboard**: Built-in monitoring and analytics
2. **Query Performance**: Use the query analyzer for slow queries
3. **Real-time Usage**: Monitor realtime subscription usage
4. **Storage**: Track database storage and growth

## Backup and Recovery

1. **Automatic Backups**: Supabase provides automatic daily backups
2. **Point-in-time Recovery**: Available for disaster recovery
3. **Export Data**: Use Supabase CLI for data exports
4. **Schema Versioning**: Keep track of schema changes

## Support

For issues with this setup:

1. Check the Supabase documentation
2. Review the error logs in your Supabase dashboard
3. Test individual components to isolate issues
4. Verify all environment variables are set correctly

## Next Steps

After setup:

1. Configure authentication providers (Google, etc.)
2. Set up email templates for notifications
3. Configure storage buckets if needed
4. Set up monitoring and alerting
5. Test all features thoroughly 