import { useEffect, useState } from 'react';
import * as usersService from '@/services/users.service';
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
import { toast } from '@/components/ui/use-toast';
import { UserPlus, Copy, Check, Search } from 'lucide-react';
import type { User } from '@/types';

interface CreatedUserInfo {
  user: User;
  password: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [createdUser, setCreatedUser] = useState<CreatedUserInfo | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (search?: string) => {
    try {
      const data = await usersService.listUsers(search);
      setUsers(data);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchUsers(query || undefined);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const result = await usersService.createUser({ email, firstName, lastName });
      setCreatedUser(result);
      setUsers((prev) => [result.user, ...prev]);
      setFirstName('');
      setLastName('');
      setEmail('');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { code?: string } } } };
      const code = axiosError.response?.data?.error?.code;
      toast({
        variant: 'destructive',
        title: 'Error',
        description: code === 'EMAIL_EXISTS'
          ? 'A user with this email already exists.'
          : 'Failed to create user',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!createdUser) return;
    await navigator.clipboard.writeText(createdUser.password);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreatedUser(null);
    setPasswordCopied(false);
    setFirstName('');
    setLastName('');
    setEmail('');
  };

  const getInitials = (user: User) =>
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage all users in the system</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'No users match your search.' : 'No users yet.'}
            </p>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    {getInitials(user)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) handleCloseCreateDialog(); }}>
        <DialogContent>
          {createdUser ? (
            <>
              <DialogHeader>
                <DialogTitle>User Created</DialogTitle>
                <DialogDescription>
                  Share the temporary password with{' '}
                  <span className="font-medium text-foreground">
                    {createdUser.user.firstName} {createdUser.user.lastName}
                  </span>
                  . It will not be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{createdUser.user.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-muted px-4 py-2 font-mono text-lg tracking-widest">
                      {createdUser.password}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPassword}
                      title="Copy password"
                    >
                      {passwordCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseCreateDialog}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>
                  A temporary password will be generated automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@company.com"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseCreateDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
