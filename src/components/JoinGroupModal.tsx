import { useState } from "react";
import { X, Users, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Group = Database['public']['Tables']['groups']['Row'] & {
  profiles?: {
    full_name: string | null;
  } | null;
};

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  user: any;
  onJoinRequestSent?: () => void;
}

export const JoinGroupModal = ({ 
  isOpen, 
  onClose, 
  groups, 
  user, 
  onJoinRequestSent 
}: JoinGroupModalProps) => {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGroupId || !user) {
      alert('Please select a group and ensure you are signed in');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: selectedGroupId,
          user_id: user.id,
          message: message.trim() || null,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending join request:', error);
        throw error;
      }

      console.log('Join request sent successfully');
      alert('Join request sent! The group admin will review your request.');
      
      // Reset form
      setSelectedGroupId('');
      setMessage('');
      
      // Callback
      if (onJoinRequestSent) {
        onJoinRequestSent();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error sending join request:', error);
      alert(error.message || "Failed to send join request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter out groups where user is already admin
  const availableGroups = groups.filter(group => group.admin_id !== user?.id);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-20 bottom-20 max-w-md mx-auto">
        <Card className="card-apple h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Join Group
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Group
                </label>
                <select
                  className="w-full p-3 border rounded-lg bg-background"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  required
                >
                  <option value="">Choose a group to join...</option>
                  {availableGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - Admin: {group.profiles?.full_name || 'Unknown'}
                    </option>
                  ))}
                </select>
                {availableGroups.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No groups available to join. Create your own group!
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Message (Optional)
                </label>
                <Textarea
                  placeholder="Tell the group admin why you want to join..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full"
                  rows={4}
                />
              </div>

              {selectedGroupId && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Group Information</h4>
                  {(() => {
                    const group = groups.find(g => g.id === selectedGroupId);
                    return group ? (
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Name:</strong> {group.name}</p>
                        {group.description && (
                          <p><strong>Description:</strong> {group.description}</p>
                        )}
                        <p><strong>Admin:</strong> {group.profiles?.full_name || 'Unknown'}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
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
                disabled={!selectedGroupId || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Send className="w-4 h-4 mr-2 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}; 