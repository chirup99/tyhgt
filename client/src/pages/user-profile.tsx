import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, MapPin, Calendar, Users, UserPlus, ArrowLeft } from 'lucide-react';
import { auth } from '@/firebase';

interface UserProfileData {
  username: string;
  displayName: string;
  bio: string;
  profilePicUrl?: string;
  coverPicUrl?: string;
  verified: boolean;
}

interface SocialPost {
  id: string;
  content: string;
  authorUsername: string;
  authorDisplayName: string;
  timestamp?: string;
  createdAt?: string;
  imageUrl?: string;
  ticker?: string;
  sentiment?: string;
  metrics?: {
    likes: number;
    comments: number;
    reposts: number;
  };
  likes?: number;
  comments?: number;
  reposts?: number;
}

export default function UserProfile() {
  const [location, setLocation] = useLocation();
  const pathname = location;
  const username = pathname.split('/user/')[1];
  
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Posts');
  const [postCount, setPostCount] = useState(0);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const loadProfileData = async () => {
      if (!username) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${username}/profile`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        } else {
          setProfileData(null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [username]);

  // Check follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !username) return;

      try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch(`/api/users/${username}/follow-status`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [username]);

  // Fetch user counts
  const { data: countsData = { followers: 0, following: 0 } } = useQuery({
    queryKey: [`/api/users/${username}/followers-count`],
    queryFn: async () => {
      if (!username) return { followers: 0, following: 0 };
      const response = await fetch(`/api/users/${username}/followers-count`);
      if (!response.ok) return { followers: 0, following: 0 };
      return response.json();
    },
    enabled: !!username,
    staleTime: 60000,
  });

  // Fetch followers list
  const { data: followersList = { followers: [] } } = useQuery({
    queryKey: [`/api/users/${username}/followers-list`],
    queryFn: async () => {
      if (!username) return { followers: [] };
      const response = await fetch(`/api/users/${username}/followers-list`);
      if (!response.ok) return { followers: [] };
      return response.json();
    },
    enabled: !!username && showFollowersDialog,
  });

  // Fetch following list
  const { data: followingList = { following: [] } } = useQuery({
    queryKey: [`/api/users/${username}/following-list`],
    queryFn: async () => {
      if (!username) return { following: [] };
      const response = await fetch(`/api/users/${username}/following-list`);
      if (!response.ok) return { following: [] };
      return response.json();
    },
    enabled: !!username && showFollowingDialog,
  });

  // Fetch all posts and filter by username
  const { data: allPosts = [] } = useQuery({
    queryKey: ['/api/social-posts'],
    queryFn: async (): Promise<SocialPost[]> => {
      const response = await fetch(`/api/social-posts?refresh=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
  });

  // Filter posts for this user (works for regular users and bots)
  const userPosts = allPosts.filter(post => {
    if (!username) return false;
    return (
      post.authorUsername === username ||
      post.user?.handle === username ||
      post.authorDisplayName === profileData?.displayName ||
      post.user?.username === username
    );
  });

  useEffect(() => {
    setPostCount(userPosts.length);
  }, [userPosts.length]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !username) return;

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/users/${username}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6 animate-pulse">
        <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
        <div className="pt-20 px-4 pb-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User not found</h2>
        <Button onClick={() => setLocation('/app')}>Go back to home</Button>
      </div>
    );
  }

  const displayName = profileData.displayName || profileData.username;
  const bio = profileData.bio || '';
  const following = countsData?.following || 0;
  const followers = countsData?.followers || 0;
  const profilePicUrl = profileData.profilePicUrl;
  const coverPicUrl = profileData.coverPicUrl;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6">
        {/* Cover Photo */}
        <div className={`h-48 relative ${coverPicUrl ? '' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'}`}>
          {coverPicUrl && (
            <img src={coverPicUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/app')}
            className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white rounded-full"
            data-testid="button-back-profile"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {/* Profile Picture */}
          <div className="absolute -bottom-16 left-4">
            <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800">
              {profilePicUrl ? (
                <AvatarImage src={profilePicUrl} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-4xl font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-4 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-gray-900 dark:text-white font-bold text-2xl flex items-center gap-2">
                {displayName}
                {profileData.verified && (
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-current" />
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">@{profileData.username}</p>
            </div>
            {!isFollowing && (
              <Button 
                variant="default"
                className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleFollowToggle}
                data-testid="button-follow-user"
              >
                Follow
              </Button>
            )}
          </div>

          {bio && (
            <p className="text-gray-900 dark:text-white mb-4 text-base">{bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 text-sm mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>India</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date().getFullYear()}</span>
            </div>
          </div>

          <div className="flex gap-4 text-sm mb-4">
            <button 
              className="hover:underline"
              onClick={() => setShowFollowingDialog(true)}
              data-testid="button-show-following"
            >
              <span className="font-bold text-gray-900 dark:text-white">{following}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Following</span>
            </button>
            <button 
              className="hover:underline"
              onClick={() => setShowFollowersDialog(true)}
              data-testid="button-show-followers"
            >
              <span className="font-bold text-gray-900 dark:text-white">{followers}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Followers</span>
            </button>
          </div>

          <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700">
            {[`Posts ${postCount > 0 ? `(${postCount})` : ''}`, 'Media', 'Likes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.split(' ')[0])}
                className={`pb-3 px-2 font-medium transition-colors relative ${
                  activeTab === tab.split(' ')[0]
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                data-testid={`button-tab-${tab.split(' ')[0].toLowerCase()}`}
              >
                {tab}
                {activeTab === tab.split(' ')[0] && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Posts Display */}
      <div className="max-w-4xl mx-auto">
        {activeTab === 'Posts' && (
          <div className="space-y-4 mb-6">
            {userPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
              </Card>
            ) : (
              userPosts.map((post) => (
                <Card key={post.id} className="p-4">
                  <p className="text-gray-900 dark:text-white font-semibold mb-2">{post.content}</p>
                  {post.timestamp && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{post.timestamp}</p>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Followers
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {followersList.followers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No followers yet</p>
              </div>
            ) : (
              followersList.followers.map((follower: any) => (
                <div 
                  key={follower.id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  data-testid={`follower-${follower.id}`}
                >
                  <Avatar className="w-10 h-10">
                    {follower.avatar ? (
                      <AvatarImage src={follower.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                        {(follower.displayName || follower.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{follower.displayName || follower.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{follower.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Following
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {followingList.following.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Not following anyone yet</p>
              </div>
            ) : (
              followingList.following.map((user: any) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  data-testid={`following-${user.id}`}
                >
                  <Avatar className="w-10 h-10">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                        {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{user.displayName || user.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
