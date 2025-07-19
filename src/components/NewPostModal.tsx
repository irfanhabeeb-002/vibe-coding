import { useState } from "react";
import { X, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PostData) => void;
}

interface PostData {
  title: string;
  location: string;
  time: string;
  count: number;
  description: string;
}

export const NewPostModal = ({ isOpen, onClose, onSubmit }: NewPostModalProps) => {
  const [formData, setFormData] = useState<PostData>({
    title: '',
    location: '',
    time: '',
    count: 1,
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', location: '', time: '', count: 1, description: '' });
    onClose();
  };

  if (!isOpen) return null;

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
            <div className="space-y-4 flex-1">
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
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  Location
                </label>
                <Input
                  placeholder="e.g., Grand Auditorium, City Hall"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full"
                  required
                />
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
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Additional details about the food..."
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