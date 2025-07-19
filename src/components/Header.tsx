import { Plus, Users, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onNewPost: () => void;
  onShowGroups: () => void;
  notificationCount?: number;
}

export const Header = ({ onNewPost, onShowGroups, notificationCount = 0 }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">FoodShare</h1>
            <p className="text-xs text-muted-foreground">Share food, reduce waste</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
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
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <User className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={onNewPost}
              size="sm"
              className="btn-apple btn-primary p-2"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};