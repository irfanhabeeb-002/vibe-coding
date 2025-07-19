import { Plus, Users, Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  onNewPost: () => void;
  onShowGroups: () => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
  user?: any;
  onAuthClick?: () => void;
}

export const Header = ({ 
  onNewPost, 
  onShowGroups, 
  notificationCount = 0, 
  onNotificationClick,
  user,
  onAuthClick
}: HeaderProps) => {
  console.log('Header user state:', user);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">വന്നോളി തിന്നോളി</h1>
            <p className="text-xs text-muted-foreground">Share food, reduce waste</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              onClick={onNotificationClick}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowGroups}
              className="p-2"
            >
              <Users className="w-5 h-5" />
            </Button>
            
            {user ? (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  title={user.email || user.user_metadata?.full_name || 'User'}
                >
                  <User className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="p-2"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAuthClick}
                className="p-2"
                title="Sign In"
              >
                <User className="w-5 h-5" />
              </Button>
            )}
            
            <Button
              onClick={onNewPost}
              size="sm"
              className="btn-apple btn-primary p-2"
              title={!user ? "Sign in to share food" : "Share food"}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};