import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { FoodCard } from "@/components/FoodCard";
import { FilterTabs } from "@/components/FilterTabs";
import { NewPostModal } from "@/components/NewPostModal";
import { useToast } from "@/hooks/use-toast";

interface PostData {
  title: string;
  location: string;
  time: string;
  count: number;
  description: string;
}

interface FoodPost extends PostData {
  id: string;
  totalCount: number;
  postedBy: string;
  distance?: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [foodPosts, setFoodPosts] = useState<FoodPost[]>([
    {
      id: '1',
      title: 'Wedding Reception Buffet',
      location: 'Grand Ballroom, Marriott Hotel',
      time: 'Available until 9:00 PM',
      count: 15,
      totalCount: 20,
      postedBy: 'Event Organizer',
      distance: '0.5 km',
      description: 'Indian cuisine with vegetarian options'
    },
    {
      id: '2',
      title: 'Corporate Event Lunch',
      location: 'Tech Park Auditorium',
      time: 'Available until 2:00 PM',
      count: 3,
      totalCount: 30,
      postedBy: 'FoodShare Group',
      distance: '1.2 km',
      description: 'Continental and Asian dishes'
    },
    {
      id: '3',
      title: 'Birthday Party Leftovers',
      location: 'Community Center Hall',
      time: 'Available until 6:00 PM',
      count: 8,
      totalCount: 12,
      postedBy: 'Sarah K.',
      distance: '2.1 km',
      description: 'Pizza, cake, and snacks'
    },
    {
      id: '4',
      title: 'Conference Catering',
      location: 'Business Center, Downtown',
      time: 'Available until 4:00 PM',
      count: 0,
      totalCount: 25,
      postedBy: 'Conference Team',
      distance: '3.5 km',
      description: 'Healthy lunch options'
    }
  ]);
  
  const { toast } = useToast();

  const handleAvail = (id: string) => {
    setFoodPosts(prev => 
      prev.map(post => {
        if (post.id === id && post.count > 0) {
          const newCount = post.count - 1;
          
          // Show success toast
          toast({
            title: "Food Reserved!",
            description: `You've reserved a portion from ${post.title}`,
          });
          
          // Auto-delete when count reaches 0
          if (newCount === 0) {
            setTimeout(() => {
              setFoodPosts(current => current.filter(p => p.id !== id));
              toast({
                title: "Post Completed",
                description: "All food has been claimed!",
              });
            }, 1000);
          }
          
          return { ...post, count: newCount };
        }
        return post;
      })
    );
  };

  const handleNewPost = (data: PostData) => {
    const newPost: FoodPost = {
      ...data,
      id: Date.now().toString(),
      totalCount: data.count,
      postedBy: 'You',
    };
    
    setFoodPosts(prev => [newPost, ...prev]);
    toast({
      title: "Food Shared!",
      description: "Your post is now live for the community",
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="pb-20">
            <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            <div className="px-4 space-y-4">
              {foodPosts.length === 0 ? (
                <div className="text-center py-12 fade-in">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No food available</h3>
                  <p className="text-muted-foreground text-sm">Be the first to share food in your area!</p>
                </div>
              ) : (
                foodPosts.map((post, index) => (
                  <div key={post.id} className="slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <FoodCard {...post} onAvail={handleAvail} />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      
      case 'nearby':
        return (
          <div className="flex items-center justify-center h-96 fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Location Feature</h3>
              <p className="text-muted-foreground text-sm px-8">
                Map view showing nearby food locations will be available once connected to Supabase
              </p>
            </div>
          </div>
        );
        
      case 'search':
        return (
          <div className="flex items-center justify-center h-96 fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Search Food</h3>
              <p className="text-muted-foreground text-sm px-8">
                Search by location, food type, or event will be available with full backend
              </p>
            </div>
          </div>
        );
        
      case 'groups':
        return (
          <div className="flex items-center justify-center h-96 fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Food Groups</h3>
              <p className="text-muted-foreground text-sm px-8">
                Create and join groups to share food notifications with your community
              </p>
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
        notificationCount={5}
      />
      
      <main className="max-w-md mx-auto">
        {renderTabContent()}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <NewPostModal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        onSubmit={handleNewPost}
      />
    </div>
  );
};

export default Index;
