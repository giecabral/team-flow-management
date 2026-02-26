import { useState } from 'react';
import { UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import * as usersService from '@/services/users.service';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) return;
    setIsSavingProfile(true);
    try {
      const updated = await usersService.updateProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        email: profile.email.trim(),
      });
      updateUser(updated);
      toast({ title: 'Profile updated' });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Failed to update profile';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match' });
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Error', description: 'New password must be at least 8 characters' });
      return;
    }
    setIsSavingPassword(true);
    try {
      await usersService.changePassword(passwords.currentPassword, passwords.newPassword);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: 'Password changed' });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Failed to change password';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCircle className="h-8 w-8" />
          Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and password</p>
      </div>

      {/* Personal information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">First Name</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Last Name</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Current Password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">New Password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Min. 8 characters"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Confirm New Password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
