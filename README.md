# Grub Grab Together - Food Sharing Platform

A modern food sharing platform built for communities to reduce food waste and help those in need. Built with React, TypeScript, and Supabase.

## 🍽️ Features

### Core Features
- **Food Sharing**: Post and claim available food items
- **Location-Based Search**: Find nearby food using GPS coordinates
- **Real-time Notifications**: Live updates for new posts and group activities
- **User Authentication**: Secure Google OAuth integration

### Group Management System
- **Admin Controls**: Group creators can approve/reject members
- **Join Requests**: Users can request to join groups with messages
- **Member Management**: Admins can remove members and manage permissions
- **Group Posts**: Share food posts specifically with group members
- **Live Notifications**: Real-time updates for group activities

### Location & Search
- **Automatic Location Detection**: GPS coordinates for precise location tracking
- **Nearby Food Search**: Find food within 10km radius using efficient database queries
- **District-Based Organization**: Kerala districts for easy location selection
- **Distance Calculation**: Accurate distance measurements using PostgreSQL extensions

### Content Moderation
- **Report System**: Users can report inappropriate content
- **Admin Review**: Track and manage reported content
- **User Safety**: Secure reporting with proper access controls

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- A Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd grub-grab-together
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run setup-db
   ```
   Follow the instructions to copy the schema to your Supabase project.

4. **Configure environment variables**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

The application uses a comprehensive Supabase database with the following features:

### Tables
- **profiles**: User profile information
- **groups**: Food sharing groups with admin controls
- **group_members**: Group membership with approval status
- **group_join_requests**: Join requests with admin approval
- **food_posts**: Food sharing posts with location data
- **food_claims**: Food claim tracking
- **notifications**: Real-time notifications system
- **reports**: Content moderation system

### Key Functions
- **get_nearby_food_posts**: Efficient nearby food post search
- **handle_new_user**: Automatic profile creation on signup
- **update_food_post_count**: Automatic count management
- **notify_group_members**: Group notification system
- **notify_join_request**: Join request notifications

For detailed setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## 🏗️ Architecture

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful, accessible UI components

### Backend
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Real-time Subscriptions**: Live updates using Supabase realtime
- **Row Level Security**: Secure data access with RLS policies
- **PostgreSQL Functions**: Server-side logic for complex operations

### Key Technologies
- **Geolocation**: Browser geolocation API for location services
- **OpenStreetMap**: Nominatim service for coordinate lookup
- **Google OAuth**: Secure user authentication

## 📱 Usage

### For Food Donors
1. Sign in with your Google account
2. Create a new food post with details and location
3. Optionally share with a specific group
4. Monitor claims and manage your posts

### For Food Recipients
1. Browse available food posts
2. Use the nearby search to find local food
3. Claim food items you're interested in
4. Contact the donor for pickup details

### For Group Admins
1. Create and manage food sharing groups
2. Approve or reject join requests
3. Manage group members
4. Monitor group activity and posts

### For Group Members
1. Request to join groups
2. Receive notifications for group posts
3. View and claim group-specific food items
4. Participate in community food sharing

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run setup-db` - Database setup helper

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── GroupModal.tsx  # Group management
│   ├── JoinGroupModal.tsx # Join group requests
│   └── ...
├── integrations/       # External integrations
│   └── supabase/      # Supabase client and types
├── hooks/             # Custom React hooks
├── pages/             # Page components
└── lib/               # Utility functions
```

## 🚀 Deployment

### Deploy with Lovable
Simply open [Lovable](https://lovable.dev) and click on Share -> Publish.

### Deploy with Vercel
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Custom Domain
To connect a custom domain:
1. Navigate to Project > Settings > Domains
2. Click Connect Domain
3. Follow the DNS configuration instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For support and questions:
1. Check the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for database issues
2. Review the Supabase documentation
3. Check the project issues on GitHub

## 🎯 Roadmap

- [ ] Push notifications for mobile
- [ ] Food quality ratings and reviews
- [ ] Advanced search filters
- [ ] Food donation analytics
- [ ] Integration with food banks
- [ ] Mobile app development

---

Built with ❤️ for reducing food waste and helping communities.
