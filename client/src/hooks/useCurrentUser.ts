import { useState, useEffect } from 'react';

interface CurrentUser {
  userId: string | null;
  email: string | null;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    userId: null,
    email: null
  });

  useEffect(() => {
    // Load user data from localStorage on mount
    const savedUserId = localStorage.getItem('currentUserId');
    const savedUserEmail = localStorage.getItem('currentUserEmail');
    
    setCurrentUser({
      userId: savedUserId,
      email: savedUserEmail
    });
  }, []);

  const updateUser = (userId: string, email: string) => {
    localStorage.setItem('currentUserId', userId);
    localStorage.setItem('currentUserEmail', email);
    setCurrentUser({ userId, email });
  };

  const clearUser = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserEmail');
    setCurrentUser({ userId: null, email: null });
  };

  const getUserDisplayName = () => {
    return currentUser.userId || 'Anonymous User';
  };

  const isLoggedIn = () => {
    return !!currentUser.userId && !!currentUser.email;
  };

  return {
    currentUser,
    updateUser,
    clearUser,
    getUserDisplayName,
    isLoggedIn
  };
}