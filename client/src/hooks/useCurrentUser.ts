import { useState, useEffect } from 'react';
import { auth } from '../firebase';

interface CurrentUser {
  userId: string | null;
  email: string | null;
  username: string | null;
  displayName: string | null;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    userId: null,
    email: null,
    username: null,
    displayName: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data from localStorage and fetch profile
    const loadUserData = async () => {
      const savedUserId = localStorage.getItem('currentUserId');
      const savedUserEmail = localStorage.getItem('currentUserEmail');
      const savedUsername = localStorage.getItem('currentUsername');
      const savedDisplayName = localStorage.getItem('currentDisplayName');
      
      if (savedUserId && savedUserEmail) {
        setCurrentUser({
          userId: savedUserId,
          email: savedUserEmail,
          username: savedUsername,
          displayName: savedDisplayName
        });

        // Fetch fresh profile data from backend
        try {
          const user = auth.currentUser;
          if (user) {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/user/profile', {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.profile) {
                const profile = data.profile;
                updateUser(
                  savedUserId,
                  savedUserEmail,
                  profile.username,
                  profile.displayName
                );
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      
      setLoading(false);
    };

    loadUserData();
  }, []);

  const updateUser = (userId: string, email: string, username?: string | null, displayName?: string | null) => {
    localStorage.setItem('currentUserId', userId);
    localStorage.setItem('currentUserEmail', email);
    if (username) {
      localStorage.setItem('currentUsername', username);
    }
    if (displayName) {
      localStorage.setItem('currentDisplayName', displayName);
    }
    
    setCurrentUser({ 
      userId, 
      email,
      username: username || null,
      displayName: displayName || null
    });
  };

  const updateProfile = (username: string, displayName: string) => {
    localStorage.setItem('currentUsername', username);
    localStorage.setItem('currentDisplayName', displayName);
    setCurrentUser(prev => ({
      ...prev,
      username,
      displayName
    }));
  };

  const clearUser = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('currentDisplayName');
    setCurrentUser({ 
      userId: null, 
      email: null,
      username: null,
      displayName: null
    });
  };

  const getUserDisplayName = () => {
    return currentUser.displayName || currentUser.username || currentUser.email || 'Anonymous User';
  };

  const getUsername = () => {
    return currentUser.username || null;
  };

  const hasUsername = () => {
    return !!currentUser.username;
  };

  const isLoggedIn = () => {
    return !!currentUser.userId && !!currentUser.email;
  };

  return {
    currentUser,
    loading,
    updateUser,
    updateProfile,
    clearUser,
    getUserDisplayName,
    getUsername,
    hasUsername,
    isLoggedIn
  };
}