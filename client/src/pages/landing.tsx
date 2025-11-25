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
  signInWithPopup,
  updateProfile
} from "firebase/auth";
export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      'prompt': 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Capture display name from Google profile
      const displayName = user.displayName || user.email || '';
      console.log('📝 Google OAuth successful:', { uid: user.uid, email: user.email, displayName });
      
      // Update Firebase Auth profile with display name
      if (displayName && !user.displayName) {
        try {
          await updateProfile(user, { displayName });
          console.log('✅ Updated Firebase Auth profile with displayName:', displayName);
        } catch (profileError) {
          console.warn('⚠️ Could not update Firebase Auth profile:', profileError);
        }
      }
      
      // Get the ID token
      const idToken = await user.getIdToken();

      // Send the token to your backend (backend will also save displayName from ID token)
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      const responseData = await response.json();
      
      if (response.ok) {
        // Store user info in localStorage with display name
        localStorage.setItem('currentUserId', user.uid);
        localStorage.setItem('currentUserEmail', user.email || '');
        localStorage.setItem('currentUserName', displayName);
        
        console.log('✅ Google sign-in successful with displayName, redirecting to app...', { displayName, responseData });
        window.location.href = "/";
      } else {
        console.error('Backend auth failed:', responseData);
        toast({
          title: "Authentication Failed",
          description: responseData?.message || "Could not sign in with Google.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Google sign-in error details:", error);
      
      if (error.code === 'auth/api-key-not-valid') {
        toast({
          title: "Configuration Error",
          description: "Firebase API Key is invalid. Contact support.",
          variant: "destructive",
        });
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast({
          title: "Account Exists",
          description: "An account with this email already exists.",
          variant: "destructive",
        });
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/operation-not-allowed') {
        toast({
          title: "OAuth Not Configured",
          description: "Google Sign-In is not properly configured. Please check Firebase Console settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign-In Error",
          description: error.message || "An unexpected error occurred during Google sign-in.",
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
      
      // Force fresh token retrieval to avoid stale token issues on Cloud Run
      const idToken = await user.getIdToken(true);
      
      console.log('🔑 Authentication attempt:', { 
        action: isLogin ? 'login' : 'register',
        userId: user.uid,
        email: user.email 
      });

      // Store user session immediately after Firebase Auth succeeds
      localStorage.setItem('currentUserId', user.uid);
      localStorage.setItem('currentUserEmail', user.email || '');

      try {
        const response = await fetch(isLogin ? '/api/auth/login' : '/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ name: isLogin ? undefined : name, email }),
          signal: AbortSignal.timeout(8000) // 8 second timeout
        });

        if (!response.ok) {
          const data = await response.json();
          console.warn('⚠️ Backend sync failed, but Firebase Auth succeeded:', data.message);
        }
      } catch (fetchError) {
        // Backend call failed, but Firebase Auth succeeded - continue anyway
        console.warn('⚠️ Backend unreachable, but Firebase Auth succeeded. Continuing...', fetchError);
      }

      // Always redirect after successful Firebase Auth
      console.log('✅ Authentication successful, redirecting to app...');
      window.location.href = "/";
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      if (error.code === 'auth/api-key-not-valid') {
        console.error("Firebase: Invalid API Key. Please check your Firebase configuration.");
        toast({
          title: "Configuration Error",
          description: "Firebase API key is invalid. Please contact support.",
          variant: "destructive",
        });
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
          <p className="text-gray-500 text-sm">AI-powered trading insights.</p>
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
        <div className="flex flex-col items-center space-y-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>AI Social feed </span>
          </div>
         
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>AI-Journal tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
