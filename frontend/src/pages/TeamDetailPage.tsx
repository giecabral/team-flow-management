import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import * as teamsService from '@/services/teams.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, MoreVertical, UserPlus, Trash2, Kanban } from 'lucide-react';
import type { Team, TeamMember, TeamRole, User as UserType } from '@/types';

const ALL_ROLES: TeamRole[] = ['admin', 'manager', 'dev', 'guest'];

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  dev: 'Developer',
  guest: 'Guest',
};

const ROLE_BADGE_CLASS: Record<TeamRole, string> = {
  admin: 'bg-primary/10 text-primary',
  manager: 'bg-purple-100 text-purple-700',
  dev: 'bg-blue-100 text-blue-700',
  guest: 'bg-muted text-muted-foreground',
};

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null);

  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamRole>('dev');

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  const fetchTeamData = async () => {
    if (!teamId) return;

    try {
      const [teamData, membersData] = await Promise.all([
        teamsService.getTeam(teamId),
        teamsService.getTeamMembers(teamId),
      ]);
      setTeam(teamData);
      setMembers(membersData);

      const currentMember = membersData.find((m) => m.userId === user?.id);
      setCurrentUserRole(currentMember?.role || null);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load team details',
      });
      navigate('/teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await teamsService.searchUsers(teamId!, query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setIsAddingMember(true);
    try {
      const newMember = await teamsService.addTeamMember(teamId!, { userId, role: selectedRole });
      setMembers((prev) => [...prev, newMember]);
      setAddMemberDialogOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedRole('dev');
      toast({
        title: 'Member added',
        description: `Added as ${ROLE_LABELS[selectedRole]}.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add member',
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRoleChange = async (memberId: string, userId: string, newRole: TeamRole) => {
    try {
      await teamsService.updateMemberRole(teamId!, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      toast({
        title: 'Role updated',
        description: `Role changed to ${ROLE_LABELS[newRole]}.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update role',
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await teamsService.removeMember(teamId!, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the team.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      await teamsService.deleteTeam(teamId!);
      toast({
        title: 'Team deleted',
        description: 'The team has been deleted.',
      });
      navigate('/teams');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete team',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!team) {
    return null;
  }

  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teams')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          {team.description && (
            <p className="text-muted-foreground mt-1">{team.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/teams/${teamId}/tasks`)}>
          <Kanban className="h-4 w-4 mr-2" />
          Tasks
        </Button>
        {isAdmin && (
          <Button variant="destructive" size="sm" onClick={handleDeleteTeam}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Team
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setAddMemberDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {member.user?.firstName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.user?.firstName} {member.user?.lastName}
                      {member.userId === user?.id && (
                        <span className="text-muted-foreground ml-2 text-sm">(you)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_BADGE_CLASS[member.role]}`}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>
                  {isAdmin && member.userId !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className='bg-white'>
                        {ALL_ROLES.filter((r) => r !== member.role).map((role) => (
                          <DropdownMenuItem
                            key={role}
                            onClick={() => handleRoleChange(member.id, member.userId, role)}
                          >
                            Set as {ROLE_LABELS[role]}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive 
                                     data-[highlighted]:text-red-500 
                                     data-[highlighted]:bg-red-50"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={addMemberDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSearchQuery('');
            setSearchResults([]);
            setSelectedRole('dev');
          }
          setAddMemberDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Search for users and assign them a role on this team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as TeamRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y">
                  {searchResults.map((searchUser) => (
                    <div
                      key={searchUser.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {searchUser.firstName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {searchUser.firstName} {searchUser.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {searchUser.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(searchUser.id)}
                        disabled={isAddingMember}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
