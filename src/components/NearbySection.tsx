import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FoodCard } from "@/components/FoodCard";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FoodPost = Database['public']['Tables']['food_posts']['Row'] & {
  profiles?: {
    full_name: string | null;
  } | null;
  distance?: string;
};

interface NearbySectionProps {
  user: any;
  onClaim: (id: string) => void;
  onReport: (post: FoodPost) => void;
}

export const NearbySection = ({ user, onClaim, onReport }: NearbySectionProps) => {
  const [nearbyPosts, setNearbyPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Get user's location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch nearby posts when location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyPosts();
    }
  }, [userLocation]);

  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setLocationPermission('granted');

      // Update user's location in profile
      if (user) {
        await updateUserLocation(latitude, longitude);
      }
    } catch (err: any) {
      console.error('Error getting location:', err);
      setLocationPermission('denied');
      
      if (err.code === 1) {
        setError('Location access denied. Please enable location services to see nearby posts.');
      } else if (err.code === 2) {
        setError('Location unavailable. Please check your device settings.');
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Failed to get your location. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserLocation = async (latitude: number, longitude: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude,
          longitude,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating user location:', error);
      }
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  };

  const fetchNearbyPosts = async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      // Use the database function to get nearby posts
      const { data, error } = await supabase
        .rpc('get_nearby_food_posts', {
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
          radius_km: 10 // 10km radius
        });

      if (error) throw error;

      // Transform the data to include distance formatting
      const postsWithDistance = (data || []).map((post: any) => ({
        ...post,
        distance: formatDistance(post.distance_km)
      }));

      setNearbyPosts(postsWithDistance);
    } catch (error) {
      console.error('Error fetching nearby posts:', error);
      setError('Failed to fetch nearby posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  };

  const handleRefresh = () => {
    getUserLocation();
  };

  if (loading && !userLocation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Getting your location...</p>
        </div>
      </div>
    );
  }

  if (error && !userLocation) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-semibold">Location Required</h3>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-3">
            <Button onClick={handleRefresh} className="btn-apple btn-primary">
              <Navigation className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Nearby Food</h3>
            {userLocation && (
              <p className="text-sm text-muted-foreground">
                Within 10km of your location
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <Navigation className="w-4 h-4 mr-2" />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-muted-foreground">Finding nearby posts...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-orange-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Nearby Posts */}
      {!loading && !error && (
        <div className="space-y-4">
          {nearbyPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No nearby food found</h3>
              <p className="text-muted-foreground mb-4">
                There are no active food posts within 10km of your location.
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <Navigation className="w-4 h-4 mr-2" />
                Refresh Location
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
                             {nearbyPosts.map((post) => (
                 <div key={post.id} className="relative">
                   <FoodCard
                     id={post.id}
                     title={post.title}
                     location={post.location}
                     time={new Date(post.available_until).toLocaleString()}
                     count={post.current_count}
                     totalCount={post.total_count}
                     postedBy={post.profiles?.full_name || 'Unknown'}
                     distance={post.distance}
                     description={post.description || undefined}
                     availableUntil={post.available_until}
                     onAvail={onClaim}
                     onReport={onReport}
                   />
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {/* Location Info */}
      {userLocation && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}; 