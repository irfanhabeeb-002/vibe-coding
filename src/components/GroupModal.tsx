import { useState, useEffect } from "react";
import { X, Users, Edit, Trash2, Check, X as XIcon, UserPlus, UserMinus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Group = Database['public']['Tables']['groups']['Row'] & {
  profiles?: {
    full_name: string | null;
  } | null;
  member_count?: number;
  pending_requests?: number;
};

type GroupMember = Database['public']['Tables']['group_members']['Row'] & {
  profiles?: {
    full_name: string | null;
  } | null;
};

type JoinRequest = Database['public']['Tables']['group_join_requests']['Row'] & {
  profiles?: {
    full_name: string | null;
  } | null;
  groups?: {
    name: string;
  } | null;
};

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
  onGroupUpdated: () => void;
  onGroupDeleted: () => void;
  groups: Group[];
  user: any;
}

interface GroupFormData {
  name: string;
  description: string;
}

export const GroupModal = ({ 
  isOpen, 
  onClose, 
  onGroupCreated, 
  onGroupUpdated, 
  onGroupDeleted,
  groups,
  user 
}: GroupModalProps) => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: ''
  });
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Group management state
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', description: '' });
      setEditingGroup(null);
      setIsCreating(false);
      setIsEditing(false);
      setSelectedGroup(null);
      setGroupMembers([]);
      setJoinRequests([]);
      setActiveTab('create');
    }
  }, [isOpen]);

  // Fetch group members when a group is selected
  useEffect(() => {
    if (selectedGroup && user) {
      fetchGroupMembers(selectedGroup.id);
      fetchJoinRequests(selectedGroup.id);
    }
  }, [selectedGroup, user]);

  const fetchGroupMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles:profiles(full_name)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error fetching group members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchJoinRequests = async (groupId: string) => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('group_join_requests')
        .select(`
          *,
          profiles:profiles(full_name),
          groups:groups(name)
        `)
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJoinRequests(data || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    setIsCreating(true);
    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        admin_id: user.id
      };

      const { data: insertedGroup, error } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();

      if (error) {
        console.error('Error creating group:', error);
        throw error;
      }

      console.log('Group created successfully:', insertedGroup);
      onGroupCreated();
      setFormData({ name: '', description: '' });
      setIsCreating(false);
    } catch (error: any) {
      console.error('Error creating group:', error);
      alert(error.message || "Failed to create group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !formData.name.trim()) return;

    setIsEditing(true);
    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null
      };

      const { error } = await supabase
        .from('groups')
        .update(groupData)
        .eq('id', editingGroup.id);

      if (error) {
        console.error('Error updating group:', error);
        throw error;
      }

      console.log('Group updated successfully');
      onGroupUpdated();
      setFormData({ name: '', description: '' });
      setEditingGroup(null);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating group:', error);
      alert(error.message || "Failed to update group. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('Error deleting group:', error);
        throw error;
      }

      console.log('Group deleted successfully');
      onGroupDeleted();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      alert(error.message || "Failed to delete group. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApproveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', memberId);

      if (error) throw error;

      // Refresh members list
      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error approving member:', error);
      alert('Failed to approve member');
    }
  };

  const handleRejectMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', memberId);

      if (error) throw error;

      // Refresh members list
      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error rejecting member:', error);
      alert('Failed to reject member');
    }
  };

  const handleApproveJoinRequest = async (requestId: string) => {
    try {
      const { data: request, error: fetchError } = await supabase
        .from('group_join_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update join request status
      const { error: updateError } = await supabase
        .from('group_join_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add user to group members
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: request.group_id,
          user_id: request.user_id,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        });

      if (memberError) throw memberError;

      // Refresh data
      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
        fetchJoinRequests(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error approving join request:', error);
      alert('Failed to approve join request');
    }
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('group_join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh requests list
      if (selectedGroup) {
        fetchJoinRequests(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error rejecting join request:', error);
      alert('Failed to reject join request');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Refresh members list
      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const startEditing = (group: { id: string; name: string; description: string | null }) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || ''
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '' });
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-20 bottom-20 max-w-md mx-auto">
        <Card className="card-apple h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2" />
              {isEditing ? 'Edit Group' : 'Manage Groups'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="flex-1 flex flex-col">
              {/* Create/Edit Form */}
              {(!isEditing || editingGroup) && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">
                    {isEditing ? 'Edit Group' : 'Create New Group'}
                  </h3>
                  <form onSubmit={isEditing ? handleEditGroup : handleCreateGroup} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Group Name
                      </label>
                      <Input
                        placeholder="Enter group name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Description (Optional)
                      </label>
                      <Textarea
                        placeholder="Describe the group's purpose..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full"
                        rows={3}
                      />
                    </div>

                    <div className="flex space-x-3">
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditing}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className="flex-1 btn-apple btn-primary"
                        disabled={!formData.name.trim() || isCreating || isEditing}
                      >
                        {isCreating ? 'Creating...' : isEditing ? 'Update Group' : 'Create Group'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Groups List */}
              <div className="flex-1 overflow-y-auto">
                <h3 className="text-lg font-medium mb-4">Your Groups</h3>
                {groups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No groups yet. Create your first group!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groups.map((group) => (
                      <div key={group.id} className="bg-muted p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{group.name}</h4>
                            {group.description && (
                              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Admin: {group.profiles?.full_name || 'Unknown'}
                            </p>
                          </div>
                          
                          {group.admin_id === user?.id && (
                            <div className="flex space-x-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(group)}
                                className="p-2"
                                disabled={isEditing}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-2 text-destructive hover:text-destructive"
                                disabled={isDeleting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manage" className="flex-1 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Select Group to Manage</h3>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const group = groups.find(g => g.id === e.target.value);
                    setSelectedGroup(group || null);
                  }}
                >
                  <option value="">Select a group...</option>
                  {groups.filter(g => g.admin_id === user?.id).map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedGroup && (
                <div className="flex-1 overflow-y-auto">
                  <h4 className="font-medium mb-3">Members of {selectedGroup.name}</h4>
                  {loadingMembers ? (
                    <div className="text-center py-4">Loading members...</div>
                  ) : groupMembers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No members yet</div>
                  ) : (
                    <div className="space-y-2">
                      {groupMembers.map((member) => (
                        <div key={member.id} className="bg-background p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{member.profiles?.full_name || 'Unknown'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(member.status)}
                                <span className="text-xs text-muted-foreground">
                                  Joined {new Date(member.joined_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            {member.status === 'pending' && (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveMember(member.id)}
                                  className="p-1 bg-green-500 hover:bg-green-600"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleRejectMember(member.id)}
                                  className="p-1 bg-red-500 hover:bg-red-600"
                                >
                                  <XIcon className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            
                            {member.status === 'approved' && member.user_id !== user?.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1"
                              >
                                <UserMinus className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="flex-1 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Join Requests</h3>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const group = groups.find(g => g.id === e.target.value);
                    setSelectedGroup(group || null);
                  }}
                >
                  <option value="">Select a group...</option>
                  {groups.filter(g => g.admin_id === user?.id).map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedGroup && (
                <div className="flex-1 overflow-y-auto">
                  <h4 className="font-medium mb-3">Pending Requests for {selectedGroup.name}</h4>
                  {loadingRequests ? (
                    <div className="text-center py-4">Loading requests...</div>
                  ) : joinRequests.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No pending requests</div>
                  ) : (
                    <div className="space-y-2">
                      {joinRequests.map((request) => (
                        <div key={request.id} className="bg-background p-3 rounded border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{request.profiles?.full_name || 'Unknown'}</p>
                              {request.message && (
                                <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex space-x-1 ml-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveJoinRequest(request.id)}
                                className="p-1 bg-green-500 hover:bg-green-600"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRejectJoinRequest(request.id)}
                                className="p-1 bg-red-500 hover:bg-red-600"
                              >
                                <XIcon className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}; 