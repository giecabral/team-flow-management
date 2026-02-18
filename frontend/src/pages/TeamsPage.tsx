import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Users, Plus } from 'lucide-react';
import type { TeamWithRole } from '@/types';

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await teamsService.getTeams();
      setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load teams',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsCreating(true);
    try {
      const team = await teamsService.createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined,
      });
      setTeams((prev) => [team, ...prev]);
      setDialogOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
      toast({
        title: 'Team created',
        description: `${team.name} has been created successfully.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create team',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teams and memberships
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateTeam}>
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
                <DialogDescription>
                  Create a new team to collaborate with others.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Engineering"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    disabled={isCreating}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="What does this team do?"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating || !newTeamName.trim()}>
                  {isCreating ? 'Creating...' : 'Create Team'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <CardDescription className="text-center mb-4">
              Create your first team to start collaborating with others.
            </CardDescription>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} to={`/teams/${team.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        team.role === 'admin'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {team.role}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {team.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
