import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { User, Edit, LogOut, Settings, Users, UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/firebase';

interface UserProfile {
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  followers?: number;
  following?: number;
  dob?: string;
}

export function UserProfileDropdown() {
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedBio, setEditedBio] = useState('');
  const [editedDisplayName, setEditedDisplayName] = useState('');

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📋 Profile data received:', data.profile);
          if (data.profile) {
            setProfile({
              username: data.profile.username || currentUser.email?.split('@')[0] || 'user',
              displayName: data.profile.displayName || currentUser.email?.split('@')[0] || 'User',
              email: data.profile.email || currentUser.email || '',
              bio: data.profile.bio || '',
              followers: data.profile.followers || 0,
              following: data.profile.following || 0,
              dob: data.profile.dob
            });
            setEditedBio(data.profile.bio || '');
            setEditedDisplayName(data.profile.displayName || currentUser.email?.split('@')[0] || 'User');
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    if (currentUser.email) {
      loadProfile();
    }
  }, [currentUser.email]);

  const handleSaveProfile = async () => {
    if (!editedDisplayName.trim()) {
      toast({
        description: 'Display name cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const idToken = await user.getIdToken();
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          displayName: editedDisplayName.trim(),
          bio: editedBio.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(prev => prev ? {
        ...prev,
        displayName: editedDisplayName.trim(),
        bio: editedBio.trim()
      } : null);

      setIsEditing(false);
      toast({
        description: 'Profile updated successfully!'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all Firebase-related localStorage items first
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('currentUserEmail');
      
      // Clear all Firebase Auth cache keys
      const firebaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('firebase:')
      );
      firebaseKeys.forEach(key => localStorage.removeItem(key));
      
      // Sign out from Firebase
      await auth.signOut();
      
      // Force a complete page reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        description: 'Failed to logout',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const username = profile?.username || currentUser.username || currentUser.email?.split('@')[0] || 'user';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            data-testid="button-profile-avatar"
          >
            <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-600">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          align="end"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-start gap-3 py-2">
              <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-gray-600">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{username}
                </p>
              </div>
            </div>
            {profile?.bio && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {profile.bio}
              </p>
            )}
            <div className="flex gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile?.following || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400">Following</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile?.followers || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400">Followers</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
          <DropdownMenuItem
            onClick={() => setShowProfileDialog(true)}
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            data-testid="menu-item-view-profile"
          >
            <User className="mr-2 h-4 w-4" />
            <span>View Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setShowProfileDialog(true);
              setIsEditing(true);
            }}
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            data-testid="menu-item-edit-profile"
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            data-testid="menu-item-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={(open) => {
        setShowProfileDialog(open);
        if (!open) {
          setIsEditing(false);
          setEditedBio(profile?.bio || '');
          setEditedDisplayName(profile?.displayName || '');
        }
      }}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Profile' : 'Profile'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              {isEditing ? 'Update your profile information' : 'Your profile details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 border-4 border-gray-200 dark:border-gray-600">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-2xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name
              </Label>
              {isEditing ? (
                <Input
                  value={editedDisplayName}
                  onChange={(e) => setEditedDisplayName(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  placeholder="Your display name"
                  data-testid="input-display-name"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">
                  {profile?.displayName || 'Not set'}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </Label>
              <p className="text-gray-600 dark:text-gray-400">@{username}</p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
              </Label>
              {isEditing ? (
                <Textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 min-h-[100px]"
                  placeholder="Tell us about yourself..."
                  maxLength={200}
                  data-testid="textarea-bio"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {profile?.bio || 'No bio added yet'}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {editedBio.length}/200
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 py-4 border-t border-b border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.following || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Following</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.followers || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedBio(profile?.bio || '');
                    setEditedDisplayName(profile?.displayName || '');
                  }}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-save-profile"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
