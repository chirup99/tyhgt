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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { CheckCircle, X as XIcon, Loader2, Calendar, User, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '../firebase';

interface UserIdSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export function UserIdSetupDialog({ isOpen, onClose, onSuccess }: UserIdSetupDialogProps) {
  const [username, setUsername] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Generate arrays for date selection
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  // Construct full DOB string
  const dob = day && month && year ? `${year}-${month}-${day}` : '';

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
    if (!usernameAvailable) {
      toast({
        description: 'Please provide a valid username',
        variant: 'destructive'
      });
      return;
    }

    if (!dob) {
      toast({
        description: 'Please provide your date of birth',
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

      console.log('🔐 Getting Firebase ID token...');
      const idToken = await user.getIdToken();
      console.log('✅ ID token obtained');
      
      console.log('📤 Sending profile save request:', {
        username: username.toLowerCase(),
        dob: dob
      });
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            username: username.toLowerCase(),
            dob: dob
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log('📡 Response status:', response.status, response.statusText);
        
        // Get response text first to check if it's HTML or JSON
        const responseText = await response.text();
        console.log('📄 Response text:', responseText.substring(0, 200));
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('❌ Failed to parse response as JSON');
          throw new Error('Server returned an invalid response. Please try again.');
        }
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to save profile');
        }

        console.log('✅ Profile saved successfully:', data);
        
        toast({
          description: 'Profile created successfully!'
        });

        onSuccess(username.toLowerCase());
        onClose();
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('❌ Request timed out after 30 seconds');
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      toast({
        description: error.message || 'Failed to save profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white" data-testid="dialog-userid-setup">
        <DialogClose 
          className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:pointer-events-none p-2" 
          onClick={onClose} 
          data-testid="button-close-dialog"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent" data-testid="text-dialog-title">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400" data-testid="text-dialog-description">
            Create your unique identity to join the trading community
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          {/* Username Section */}
          <div className="space-y-3">
            <Label htmlFor="username" className="text-sm font-medium text-slate-300 flex items-center gap-2" data-testid="label-username">
              <User className="h-4 w-4" />
              Username (User ID)
            </Label>
            <div className="relative">
              <Input
                id="username"
                data-testid="input-username"
                placeholder="e.g., crypto_trader"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20 h-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername && (
                  <Loader2 className="h-5 w-5 animate-spin text-purple-400" data-testid="icon-checking" />
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-400" data-testid="icon-available" />
                  </div>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20">
                    <XIcon className="h-5 w-5 text-red-400" data-testid="icon-unavailable" />
                  </div>
                )}
              </div>
            </div>
            {usernameMessage && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                usernameAvailable 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`} data-testid="text-username-message">
                {usernameAvailable ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XIcon className="h-4 w-4" />
                )}
                {usernameMessage}
              </div>
            )}
          </div>

          {/* Date of Birth Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300 flex items-center gap-2" data-testid="label-dob">
              <Calendar className="h-4 w-4" />
              Date of Birth
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {/* Day */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Day</label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger 
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20 h-12"
                    data-testid="select-day"
                  >
                    <SelectValue placeholder="DD" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[200px]">
                    {days.map((d) => (
                      <SelectItem 
                        key={d} 
                        value={d}
                        className="focus:bg-purple-500/20 focus:text-white cursor-pointer"
                      >
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Month</label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger 
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20 h-12"
                    data-testid="select-month"
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[200px]">
                    {months.map((m) => (
                      <SelectItem 
                        key={m.value} 
                        value={m.value}
                        className="focus:bg-purple-500/20 focus:text-white cursor-pointer"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Year</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger 
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20 h-12"
                    data-testid="select-year"
                  >
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[200px]">
                    {years.map((y) => (
                      <SelectItem 
                        key={y} 
                        value={y}
                        className="focus:bg-purple-500/20 focus:text-white cursor-pointer"
                      >
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {dob && (
              <div className="text-xs text-slate-400 flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg border border-slate-700">
                <Calendar className="h-3 w-3" />
                Selected: {new Date(dob).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!usernameAvailable || !dob || saving}
            data-testid="button-save"
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Complete Profile
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
