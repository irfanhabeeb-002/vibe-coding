import { Home, Search, MapPin, Users, Bell } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

export const BottomNav = ({ activeTab, onTabChange, unreadCount = 0, onNotificationClick }: BottomNavProps) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'nearby', label: 'Nearby', icon: MapPin },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'groups', label: 'Groups', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 relative ${
                activeTab === id
                  ? 'text-primary bg-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
          
          {/* Notification button with badge */}
          <button
            onClick={onNotificationClick}
            className="flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 relative text-muted-foreground hover:text-foreground"
          >
            <div className="relative">
              <Bell className="w-5 h-5 mb-1" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Notifications</span>
          </button>
        </div>
      </div>
    </nav>
  );
};