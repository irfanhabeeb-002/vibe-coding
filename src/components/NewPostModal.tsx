import { useState, useEffect } from "react";
import { X, MapPin, Clock, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PostData) => void;
  districts: string[];
  groups: Array<{ id: string; name: string; description: string | null }>;
  user?: any;
  onAuthClick?: () => void;
}

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
}

export const NewPostModal = ({ isOpen, onClose, onSubmit, districts, groups, user, onAuthClick }: NewPostModalProps) => {
  const [formData, setFormData] = useState<PostData>({
    title: '',
    location: '',
    time: '',
    count: 1,
    description: '',
    district: '',
    latitude: undefined,
    longitude: undefined,
    groupId: undefined
  });

  const [locationLoading, setLocationLoading] = useState(false);

  // Get current location when district is selected
  const getLocationCoordinates = async (district: string) => {
    setLocationLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(district + ', Kerala, India')}&limit=1`
      );
      const data = await response.json();
      
      if (data && data[0]) {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }));
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  // Set minimum datetime to current time
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter a food title');
      return;
    }
    
    if (!formData.district) {
      alert('Please select a district');
      return;
    }
    
    if (!formData.location.trim()) {
      alert('Please enter a specific location');
      return;
    }
    
    if (!formData.time) {
      alert('Please select available until time');
      return;
    }
    
    if (!formData.count || formData.count < 1) {
      alert('Please enter number of people (minimum 1)');
      return;
    }
    
    console.log('Submitting form data:', formData);
    onSubmit(formData);
    
    // Reset form
    setFormData({ 
      title: '', 
      location: '', 
      time: '', 
      count: 1, 
      description: '', 
      district: '',
      latitude: undefined,
      longitude: undefined,
      groupId: undefined
    });
    onClose();
  };

  if (!isOpen) return null;

  // Show authentication prompt if user is not signed in
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-x-4 top-20 bottom-20 max-w-md mx-auto">
          <Card className="card-apple h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Share Food</h2>
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Sign In Required</h3>
              <p className="text-muted-foreground text-sm mb-6">
                You need to sign in to share food with the community
              </p>
              <div className="flex space-x-3 w-full">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onAuthClick}
                  className="flex-1 btn-apple btn-primary"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-20 bottom-20 max-w-md mx-auto">
        <Card className="card-apple h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Share Food</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Event/Food Title
                </label>
                <Input
                  placeholder="e.g., Wedding buffet leftovers"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  District
                </label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, district: value }));
                    getLocationCoordinates(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  Specific Location
                </label>
                <Input
                  placeholder="e.g., Grand Auditorium, City Hall"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full"
                  required
                />
                {locationLoading && (
                  <p className="text-xs text-muted-foreground mt-1">Getting location coordinates...</p>
                )}
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📍 Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-primary" />
                  Available Until
                </label>
                <Input
                  type="datetime-local"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full"
                  min={getMinDateTime()}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center">
                  <Users className="w-4 h-4 mr-2 text-primary" />
                  Number of People
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="How many people can this feed?"
                  value={formData.count}
                  onChange={(e) => setFormData(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-primary" />
                  Share with Group (Optional)
                </label>
                <Select
                  value={formData.groupId || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value === 'none' ? undefined : value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Additional details about the food, cuisine type, dietary restrictions..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 btn-apple btn-primary"
                disabled={!formData.title.trim() || !formData.district || !formData.location.trim() || !formData.time || !formData.count || formData.count < 1}
              >
                Share Food
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};