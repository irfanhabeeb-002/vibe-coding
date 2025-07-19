import { MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FoodCardProps {
  id: string;
  title: string;
  location: string;
  time: string;
  count: number;
  totalCount: number;
  postedBy: string;
  distance?: string;
  onAvail: (id: string) => void;
}

export const FoodCard = ({
  id,
  title,
  location,
  time,
  count,
  totalCount,
  postedBy,
  distance,
  onAvail
}: FoodCardProps) => {
  const availabilityStatus = count > 5 ? 'available' : count > 0 ? 'limited' : 'full';
  
  const getStatusClasses = () => {
    switch (availabilityStatus) {
      case 'available': return 'status-available';
      case 'limited': return 'status-limited';
      case 'full': return 'status-full';
      default: return 'status-available';
    }
  };

  return (
    <Card className="food-card card-apple p-6 mb-4 fade-in">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2 text-balance">{title}</h3>
          <div className="space-y-2">
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              <span>{location}</span>
              {distance && <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full">{distance}</span>}
            </div>
            <div className="flex items-center text-muted-foreground text-sm">
              <Clock className="w-4 h-4 mr-2 text-primary" />
              <span>{time}</span>
            </div>
            <div className="flex items-center text-muted-foreground text-sm">
              <Users className="w-4 h-4 mr-2 text-primary" />
              <span>Posted by {postedBy}</span>
            </div>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
          {count} left
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(count / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {count} of {totalCount} portions available
          </p>
        </div>
        
        <Button 
          onClick={() => onAvail(id)}
          disabled={count === 0}
          className="btn-apple btn-primary px-6"
          size="sm"
        >
          {count === 0 ? 'Full' : 'Avail'}
        </Button>
      </div>
    </Card>
  );
};