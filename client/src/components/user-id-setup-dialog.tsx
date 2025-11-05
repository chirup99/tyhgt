import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { CheckCircle, X as XIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '../firebase';

interface UserIdSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string, displayName: string) => void;
}

export function UserIdSetupDialog({ isOpen, onClose, onSuccess }: UserIdSetupDialogProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        setUsernameMessage('');
        return;
      }

      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        setUsernameAvailable(false);
        setUsernameMessage('Username must be 3-20 characters (letters, numbers, underscore only)');
        return;
      }

      setCheckingUsername(true);
      try {
        const response = await fetch(`/api/user/check-username/${username}`);
        const data = await response.json();
        
        setUsernameAvailable(data.available);
        setUsernameMessage(data.message);
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
        setUsernameMessage('');
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [username]);

  const handleSave = async () => {
    if (!usernameAvailable || !displayName.trim()) {
      toast({
        description: 'Please provide a valid username and display name',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      const idToken = await user.getIdToken();
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          username: username.toLowerCase(),
          displayName: displayName.trim()
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save profile');
      }

      toast({
        description: 'Profile created successfully!'
      });

      onSuccess(username.toLowerCase(), displayName.trim());
      onClose();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        description: error.message || 'Failed to save profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-userid-setup">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" onClick={onClose} data-testid="button-close-dialog">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">Complete Your Profile</DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            Choose a unique username and display name to start using the social feed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username" data-testid="label-username">
              Username (User ID)
            </Label>
            <div className="relative">
              <Input
                id="username"
                data-testid="input-username"
                placeholder="e.g., john_trader"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" data-testid="icon-checking" />
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <CheckCircle className="h-4 w-4 text-green-500" data-testid="icon-available" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <XIcon className="h-4 w-4 text-red-500" data-testid="icon-unavailable" />
                )}
              </div>
            </div>
            {usernameMessage && (
              <p 
                className={`text-sm ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}
                data-testid="text-username-message"
              >
                {usernameMessage}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" data-testid="label-displayname">
              Display Name
            </Label>
            <Input
              id="displayName"
              data-testid="input-displayname"
              placeholder="e.g., John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!usernameAvailable || !displayName.trim() || saving}
            data-testid="button-save"
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Profile & Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
