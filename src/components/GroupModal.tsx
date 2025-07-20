import { useState, useEffect } from "react";
import { X, Users, Edit, Trash2, Check, X as XIcon, UserPlus, UserMinus, Clock, MapPin, Shield, Crown } from "lucide-react";
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
  isPrivate: boolean;
  maxMembers: number;
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
    description: '',
    isPrivate: false,
    maxMembers: 100
  });
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string; description: string | null; isPrivate: boolean; maxMembers: number | null } | null>(null);
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
      setFormData({ name: '', description: '', isPrivate: false, maxMembers: 100 });
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
      setGroupMembers((data as unknown as GroupMember[]) || []);
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
      setJoinRequests((data as unknown as JoinRequest[]) || []);
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
        admin_id: user.id,
        is_private: formData.isPrivate,
        max_members: formData.maxMembers
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

      // Add admin as first member
      await supabase
        .from('group_members')
        .insert({
          group_id: insertedGroup.id,
          user_id: user.id,
          status: 'approved',
          role: 'admin',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        });

      console.log('Group created successfully:', insertedGroup);
      onGroupCreated();
      setFormData({ name: '', description: '', isPrivate: false, maxMembers: 100 });
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
        description: formData.description.trim() || null,
        is_private: formData.isPrivate,
        max_members: formData.maxMembers
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
      setFormData({ name: '', description: '', isPrivate: false, maxMembers: 100 });
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

      // Show success message
      alert('Member approved successfully!');
      
      // Refresh the members list
      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error approving member:', error);
      alert('Failed to approve member. Please try again.');
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

      // Show success message
      alert('Member rejected successfully!');
      
      // Refresh the members list
      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error rejecting member:', error);
      alert('Failed to reject member. Please try again.');
    }
  };

  const handleApproveJoinRequest = async (requestId: string) => {
    try {
      const request = joinRequests.find(r => r.id === requestId);
      if (!request) return;

      // Use the database function to approve the member
      const { data, error } = await supabase
        .rpc('approve_group_member', {
          group_uuid: request.group_id,
          user_uuid: request.user_id,
          admin_uuid: user.id
        });

      if (error) throw error;

      if (data) {
        // Show success message
        alert('Join request approved successfully!');
        // Refresh the requests and members lists
        if (selectedGroup) {
          fetchJoinRequests(selectedGroup.id);
          fetchGroupMembers(selectedGroup.id);
        }
      } else {
        alert('Failed to approve request. You may not have permission.');
      }
    } catch (error) {
      console.error('Error approving join request:', error);
      alert('Failed to approve join request. Please try again.');
    }
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    try {
      const request = joinRequests.find(r => r.id === requestId);
      if (!request) return;

      // Use the database function to reject the member
      const { data, error } = await supabase
        .rpc('reject_group_member', {
          group_uuid: request.group_id,
          user_uuid: request.user_id,
          admin_uuid: user.id
        });

      if (error) throw error;

      if (data) {
        // Show success message
        alert('Join request rejected successfully!');
        // Refresh the requests list
        if (selectedGroup) {
          fetchJoinRequests(selectedGroup.id);
        }
      } else {
        alert('Failed to reject request. You may not have permission.');
      }
    } catch (error) {
      console.error('Error rejecting join request:', error);
      alert('Failed to reject join request. Please try again.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Show success message
      alert('Member removed successfully!');
      
      // Refresh the members list
      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  const startEditing = (group: Group) => {
    setEditingGroup({
      id: group.id,
      name: group.name,
      description: group.description,
      isPrivate: group.is_private,
      maxMembers: group.max_members
    });
    setFormData({
      name: group.name,
      description: group.description || '',
      isPrivate: group.is_private,
      maxMembers: group.max_members || 100
    });
    setActiveTab('edit');
  };

  const cancelEditing = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '', isPrivate: false, maxMembers: 100 });
    setActiveTab('create');
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-purple-500 flex items-center gap-1"><Crown className="w-3 h-3" />Admin</Badge>;
      case 'moderator':
        return <Badge variant="default" className="bg-blue-500 flex items-center gap-1"><Shield className="w-3 h-3" />Moderator</Badge>;
      case 'member':
        return <Badge variant="outline">Member</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const isGroupAdmin = (group: Group) => {
    return group.admin_id === user?.id;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 max-w-4xl mx-auto">
        <Card className="card-apple h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2" />
              {editingGroup ? 'Edit Group' : 'Manage Groups'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="create">Create Group</TabsTrigger>
              <TabsTrigger value="edit" disabled={!editingGroup}>Edit Group</TabsTrigger>
              <TabsTrigger value="manage">Manage Groups</TabsTrigger>
              <TabsTrigger value="members" disabled={!selectedGroup}>Members</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="flex-1 flex flex-col">
              <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Group Name *
                    </label>
                    <Input
                      placeholder="Enter group name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe your group..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={formData.isPrivate}
                        onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="isPrivate" className="text-sm font-medium">
                        Private Group
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Max Members
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.maxMembers}
                      onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 100 })}
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
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="edit" className="flex-1 flex flex-col">
              <form onSubmit={handleEditGroup} className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Group Name *
                    </label>
                    <Input
                      placeholder="Enter group name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe your group..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="editIsPrivate"
                        checked={formData.isPrivate}
                        onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="editIsPrivate" className="text-sm font-medium">
                        Private Group
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Max Members
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.maxMembers}
                      onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEditing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 btn-apple btn-primary"
                    disabled={isEditing}
                  >
                    {isEditing ? 'Updating...' : 'Update Group'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="manage" className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div className="grid gap-4">
                  {groups.map((group) => (
                    <Card key={group.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{group.name}</h3>
                            {group.is_private && <Badge variant="outline">Private</Badge>}
                            {isGroupAdmin(group) && <Badge variant="default" className="bg-purple-500">Admin</Badge>}
                          </div>
                          {group.description && (
                            <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Admin: {group.profiles?.full_name || 'Unknown'}</span>
                            <span>Members: {group.member_count || 0}</span>
                            {group.pending_requests && group.pending_requests > 0 && (
                              <span className="text-orange-500">Pending: {group.pending_requests}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGroupAdmin(group) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(group)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedGroup(group)}
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="flex-1 flex flex-col">
              {selectedGroup && (
                <div className="space-y-6 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {selectedGroup.name} - Members
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGroup(null)}
                    >
                      Back to Groups
                    </Button>
                  </div>

                  <Tabs defaultValue="members" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="members">Members ({groupMembers.filter(m => m.status === 'approved').length})</TabsTrigger>
                      <TabsTrigger value="requests">Join Requests ({joinRequests.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="flex-1">
                      {loadingMembers ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {groupMembers.map((member) => (
                            <Card key={member.id} className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{member.profiles?.full_name || 'Unknown User'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getRoleBadge(member.role)}
                                      {getStatusBadge(member.status)}
                                    </div>
                                  </div>
                                </div>
                                {isGroupAdmin(selectedGroup) && member.user_id !== user?.id && (
                                  <div className="flex items-center gap-2">
                                    {member.status === 'pending' && (
                                      <>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={() => handleApproveMember(member.id)}
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          <Check className="w-4 h-4 mr-1" />
                                          Approve
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleRejectMember(member.id)}
                                        >
                                          <XIcon className="w-4 h-4 mr-1" />
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                    {member.status === 'approved' && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRemoveMember(member.id)}
                                      >
                                        <UserMinus className="w-4 h-4 mr-1" />
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                          {groupMembers.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                              No members found.
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="requests" className="flex-1">
                      {loadingRequests ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {joinRequests.map((request) => (
                            <Card key={request.id} className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{request.profiles?.full_name || 'Unknown User'}</p>
                                    {request.message && (
                                      <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Requested {new Date(request.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                {isGroupAdmin(selectedGroup) && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleApproveJoinRequest(request.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRejectJoinRequest(request.id)}
                                    >
                                      <XIcon className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                          {joinRequests.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                              No pending join requests.
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}; 