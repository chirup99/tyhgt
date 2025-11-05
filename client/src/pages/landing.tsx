import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase"; // Import Firebase auth
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { UserIdSetupDialog } from "@/components/user-id-setup-dialog";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Send the token to your backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        // Check if user has a profile in Firebase
        const profileResponse = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        const profileData = await profileResponse.json();
        
        // Store user ID for later use
        localStorage.setItem('currentUserId', user.uid);
        localStorage.setItem('currentUserEmail', user.email || '');
        setPendingUserId(user.uid);
        
        // If profile exists, go to app. Otherwise, show profile setup dialog
        if (profileData.success && profileData.profile && profileData.profile.username) {
          // Profile exists, save to localStorage and redirect
          localStorage.setItem('currentUsername', profileData.profile.username);
          localStorage.setItem('currentDisplayName', profileData.profile.displayName);
          window.location.href = "/app";
        } else {
          // No profile, show dialog
          setShowProfileDialog(true);
        }
      } else {
        toast({
          title: "Authentication Failed",
          description: "Could not sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      if (error.code === 'auth/api-key-not-valid') {
        console.error("Firebase: Invalid API Key. Please check your Firebase configuration.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast({
          title: "Account Exists",
          description: "An account with this email already exists. Please use your original sign-in method or try a different Google account.",
          variant: "destructive",
        });
      } else {
        console.error("Google sign-in error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred during Google sign-in.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!isLogin && !name) {
      toast({
        title: "Missing Information",
        description: "Please enter your name to create an account.",
        variant: "destructive",
      });
      return;
    }

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      const idToken = await user.getIdToken();

      const response = await fetch(isLogin ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ name: isLogin ? undefined : name, email })
      });

      if (response.ok) {
        // Check if user has a profile in Firebase
        const profileResponse = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        const profileData = await profileResponse.json();
        
        // Store user ID for later use
        localStorage.setItem('currentUserId', user.uid);
        localStorage.setItem('currentUserEmail', user.email || '');
        setPendingUserId(user.uid);
        
        // If profile exists, go to app. Otherwise, show profile setup dialog
        if (profileData.success && profileData.profile && profileData.profile.username) {
          // Profile exists, save to localStorage and redirect
          localStorage.setItem('currentUsername', profileData.profile.username);
          localStorage.setItem('currentDisplayName', profileData.profile.displayName);
          toast({
            title: "Success!",
            description: isLogin ? "Welcome back!" : "Account created successfully!",
          });
          window.location.href = "/app";
        } else {
          // No profile, show dialog
          setShowProfileDialog(true);
        }
      } else {
        const data = await response.json();
        toast({
          title: "Authentication Failed",
          description: data.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      if (error.code === 'auth/api-key-not-valid') {
        console.error("Firebase: Invalid API Key. Please check your Firebase configuration.");
      } else {
        toast({
          title: "Authentication Error",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleProfileSetupSuccess = (username: string, displayName: string) => {
    // Save profile to localStorage
    localStorage.setItem('currentUsername', username);
    localStorage.setItem('currentDisplayName', displayName);
    
    toast({
      title: "Profile Created!",
      description: "Welcome to PERALA!",
    });
    
    // Redirect to app
    window.location.href = "/app";
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-7xl md:text-8xl font-bold text-white tracking-tight">PERALA</h1>
      </div>
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Get Early Access</h2>
          <p className="text-gray-400 text-lg mb-2">Type a prompt, get a trading strategy</p>
          <p className="text-gray-400 text-lg mb-6">instantly.</p>
          <p className="text-gray-500 text-sm">No coding required.</p>
        </div>
        <div className="w-full max-w-md mx-auto space-y-4">
          <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
            <Button
              variant="ghost"
              className={`flex-1 ${isLogin ? "bg-gray-700 text-white" : "text-gray-400"}`}
              onClick={() => setIsLogin(true)}
              data-testid="button-toggle-login"
            >
              Login
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 ${!isLogin ? "bg-gray-700 text-white" : "text-gray-400"}`}
              onClick={() => setIsLogin(false)}
              data-testid="button-toggle-signup"
            >
              Sign Up
            </Button>
          </div>
          <div className="space-y-3">
            {!isLogin && (
              <Input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg"
                data-testid="input-name"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg"
              data-testid="input-email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleEmailAuth()}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg"
              data-testid="input-password"
            />
            <Button
              onClick={handleEmailAuth}
              disabled={isEmailLoading || isGoogleLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-12 rounded-lg"
              data-testid="button-email-auth"
            >
              {isEmailLoading ? "Processing..." : isLogin ? "Login" : "Create Account"}
              {!isEmailLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-500">Or continue with</span>
            </div>
          </div>
          <Button
            onClick={handleGoogleSignIn}
            disabled={isEmailLoading || isGoogleLoading}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium h-12 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
            data-testid="button-google-signin"
          >
            {isGoogleLoading ? (
              'Processing...'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
        </div>
        <div className="text-left space-y-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Instant strategy generation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>No coding experience needed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>AI-powered trading insights</span>
          </div>
        </div>
      </div>
      
      {/* Profile Setup Dialog */}
      <UserIdSetupDialog 
        isOpen={showProfileDialog}
        onClose={() => {}} // Don't allow closing without completing profile
        onSuccess={handleProfileSetupSuccess}
      />
    </div>
  );
}
