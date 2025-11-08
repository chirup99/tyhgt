import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Upload, Hash, ImageIcon, TrendingUp, TrendingDown, Minus, Sparkles, Zap, Eye, Copy, Clipboard, Clock, Activity, MessageCircle, Users, UserPlus, ExternalLink, Radio, Check } from 'lucide-react';
import { MultipleImageUpload } from './multiple-image-upload';
import { SelectedPostMiniCard } from './selected-post-mini-card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { InsertSocialPost } from '@shared/schema';
import { useAudioMode } from '@/contexts/AudioModeContext';

const POPULAR_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
  'ICICIBANK', 'KOTAKBANK', 'BHARTIARTL', 'ITC', 'SBIN',
  'ASIANPAINT', 'MARUTI', 'LT', 'AXISBANK', 'HCLTECH'
];

const SENTIMENTS = [
  { value: 'bullish', label: 'Bullish', icon: TrendingUp, color: 'text-green-600' },
  { value: 'bearish', label: 'Bearish', icon: TrendingDown, color: 'text-red-600' },
  { value: 'neutral', label: 'Neutral', icon: Minus, color: 'text-gray-600' }
];

// Export post selection context for use in feed
export const PostSelectionContext = {
  selectedPosts: [] as number[],
  togglePostSelection: (_postId: number) => {},
  isAudioMode: false
};

export function PostCreationPanel() {
  const [content, setContent] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [stockMentions, setStockMentions] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<string>('neutral');
  const [uploadedImages, setUploadedImages] = useState<Array<{id: string; url: string; name: string; file?: File}>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // New state for view switching
  const [viewMode, setViewMode] = useState<'post' | 'message' | 'audio'>('post');
  const [messageTab, setMessageTab] = useState<'message' | 'community'>('message');
  
  // Audio minicast state from context
  const { isAudioMode, setIsAudioMode, selectedPosts, togglePostSelection, clearSelection } = useAudioMode();
  const [animatingPostId, setAnimatingPostId] = useState<number | null>(null);
  
  // Sync viewMode with context audio mode
  useEffect(() => {
    setIsAudioMode(viewMode === 'audio');
  }, [viewMode, setIsAudioMode]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  // Fetch all posts to get details of selected posts
  const { data: allPosts = [] } = useQuery<any[]>({
    queryKey: ['/api/social-posts'],
    enabled: selectedPosts.length > 0
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertSocialPost) => {
      const { auth } = await import('@/firebase');
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('You must be logged in to create posts');
      }
      
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/social-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }
      
      return await response.json();
    },
    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: ['/api/social-posts'] });
      const previousPosts = queryClient.getQueryData(['/api/social-posts']);

      queryClient.setQueryData(['/api/social-posts'], (old: any) => {
        const optimisticPost = {
          id: Date.now(),
          ...newPost,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likes: 0,
          comments: 0,
          reposts: 0,
          // Ensure multiple images are handled correctly in the optimistic update
          imageUrl: newPost.imageUrl
        };
        
        if (Array.isArray(old)) {
          return [optimisticPost, ...old];
        }
        return [optimisticPost];
      });

      return { previousPosts };
    },
    onError: (err, newPost, context) => {
      queryClient.setQueryData(['/api/social-posts'], context?.previousPosts);
      toast({ 
        description: "Failed to create post. Please try again.", 
        variant: "destructive" 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      resetForm();
      toast({ description: "Post created successfully!" });
    }
  });

  const resetForm = () => {
    setContent('');
    setSelectedStock('');
    setStockMentions([]);
    setSentiment('neutral');
    setUploadedImages([]);
    clearSelection();
  };
  
  const handleTogglePostSelection = (postId: number) => {
    if (selectedPosts.length >= 5 && !selectedPosts.includes(postId)) {
      toast({
        description: "You can select up to 5 posts for audio minicast",
        variant: "destructive"
      });
      return;
    }
    setAnimatingPostId(postId);
    setTimeout(() => setAnimatingPostId(null), 500);
    togglePostSelection(postId);
  };

  const detectStockMentions = useCallback((text: string) => {
    const words = text.toUpperCase().split(/\s+/);
    const mentions = words.filter(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      return POPULAR_STOCKS.includes(cleanWord) && !stockMentions.includes(cleanWord);
    });
    return mentions;
  }, [stockMentions]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    const newMentions = detectStockMentions(newContent);
    if (newMentions.length > 0) {
      setStockMentions(prev => [...prev, ...newMentions]);
    }
  };

  const addStockMention = () => {
    if (selectedStock && !stockMentions.includes(selectedStock)) {
      setStockMentions([...stockMentions, selectedStock]);
      setSelectedStock('');
    }
  };

  const removeStockMention = (stock: string) => {
    setStockMentions(stockMentions.filter(s => s !== stock));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({ 
        description: "Please enter some content for your post.", 
        variant: "destructive" 
      });
      return;
    }

    // Use the saved username and displayName from the user's profile
    const username = currentUser.username || currentUser.email?.split('@')[0] || 'anonymous';
    const displayName = currentUser.displayName || currentUser.username || currentUser.email?.split('@')[0] || 'Anonymous User';
    
    const postData: InsertSocialPost = {
      content: content.trim(),
      authorUsername: username,
      authorDisplayName: displayName,
      stockMentions: viewMode === 'audio' ? [] : stockMentions,
      sentiment: viewMode === 'audio' ? undefined : (sentiment as 'bullish' | 'bearish' | 'neutral'),
      tags: [],
      hasImage: uploadedImages.length > 0,
      imageUrl: uploadedImages.length > 1 ? 
        JSON.stringify(uploadedImages.map(img => img.url)) : 
        (uploadedImages.length === 1 ? uploadedImages[0].url : undefined),
      isAudioPost: viewMode === 'audio',
      selectedPostIds: viewMode === 'audio' ? selectedPosts : undefined
    };

    createPostMutation.mutate(postData);
  };

  // Mock profiles data
  const mockProfiles = [
    {
      id: 1,
      name: 'Your Profile',
      handle: 'Active Trader',
      avatar: 'YP',
      isOwn: true,
      status: 'online',
      bgColor: 'bg-purple-500'
    },
    {
      id: 2,
      name: 'Henry Mercer',
      handle: 'Active trader',
      avatar: 'HM',
      following: false,
      status: 'online',
      bgColor: 'bg-teal-500'
    },
    {
      id: 3,
      name: 'Amelia Rowann',
      handle: 'Day trader',
      avatar: 'AR',
      following: false,
      status: 'offline',
      bgColor: 'bg-orange-500'
    }
  ];

  return (
    <Card className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-none">
      
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 transition-none">
        <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-none">
              {viewMode === 'post' ? (
                <Sparkles className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              ) : viewMode === 'audio' ? (
                <Radio className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              ) : (
                <MessageCircle className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              )}
            </div>
            <span className="text-lg font-bold">
              {viewMode === 'post' ? 'Create Post' : viewMode === 'audio' ? 'Audio MiniCast' : 'Messages'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Audio Icon */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'audio' ? 'post' : 'audio')}
              className={`p-2 h-8 w-8 rounded-full ${
                viewMode === 'audio' 
                  ? 'bg-purple-100 dark:bg-purple-900/30' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              data-testid="button-toggle-audio"
            >
              <Radio className={`h-4 w-4 ${
                viewMode === 'audio'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </Button>
            {/* Message Icon */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'message' ? 'post' : 'message')}
              className="p-2 h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              data-testid="button-toggle-message"
            >
              <MessageCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </CardTitle>
        
        {/* Switch tabs for message view */}
        {viewMode === 'message' && (
          <div className="flex gap-1 mt-3">
            <Button
              variant={messageTab === 'message' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMessageTab('message')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                messageTab === 'message' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              data-testid="tab-messages"
            >
              Messages
            </Button>
            <Button
              variant={messageTab === 'community' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMessageTab('community')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                messageTab === 'community'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              data-testid="tab-community"
            >
              Community
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 xl:space-y-6 p-4 xl:p-6">
        {viewMode === 'audio' ? (
          /* Audio MiniCast Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Content Input - Simple version for audio */}
            <div className="space-y-2">
              <Label htmlFor="audio-content" className="text-gray-800 dark:text-gray-200 font-medium text-base">What's on your mind?</Label>
              <Textarea
                id="audio-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Your thoughts will be converted to audio..."
                maxLength={500}
                className="min-h-[120px] resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
                data-testid="textarea-audio-content"
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
                {content.length}/500 characters
              </div>
            </div>

            {/* Selected Posts Display with Horizontal Swiping Cards */}
            {selectedPosts.length > 0 && (
              <div className="space-y-3">
                <Label className="text-gray-800 dark:text-gray-200 font-medium text-base">
                  Selected Posts ({selectedPosts.length}/5)
                </Label>
                <div className="overflow-x-auto">
                  <div className="flex gap-3 pb-2 min-w-max">
                    {selectedPosts.map((postId, index) => {
                      const post = allPosts.find((p: any) => p.id === postId);
                      if (!post) return null;
                      
                      return (
                        <div key={postId} className="flex-shrink-0 w-[280px]">
                          <SelectedPostMiniCard
                            post={{
                              id: post.id,
                              authorUsername: post.authorUsername,
                              authorDisplayName: post.authorDisplayName,
                              content: post.content
                            }}
                            onRemove={() => handleTogglePostSelection(postId)}
                            index={index}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
                data-testid="button-clear-audio"
              >
                Clear
              </Button>
              <Button 
                type="submit" 
                disabled={!content.trim() || createPostMutation.isPending}
                className="min-w-[100px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                data-testid="button-publish-audio"
              >
                {createPostMutation.isPending ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4 mr-2" />
                    Publish Audio
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : viewMode === 'post' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-gray-800 dark:text-gray-200 font-medium text-base">What's on your mind?</Label>
            <Textarea
              id="content"
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Share your trading insights..."
              maxLength={500}
              className="min-h-[120px] resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              data-testid="textarea-post-content"
            />
            <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
              {content.length}/500 characters
            </div>
          </div>

          {/* Stock Selection */}
          <div className="space-y-2">
            <Label className="text-gray-800 dark:text-gray-200 font-medium text-base">Stock Mentions</Label>
            <div className="flex gap-2">
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500">
                  <SelectValue placeholder="Add stock mention..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {POPULAR_STOCKS.filter(stock => !stockMentions.includes(stock)).map(stock => (
                    <SelectItem key={stock} value={stock} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">{stock}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button"
                onClick={addStockMention}
                variant="outline"
                size="sm"
                disabled={!selectedStock}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-add-stock"
              >
                <Hash className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Stock Mentions Display */}
            {stockMentions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stockMentions.map(stock => (
                  <Badge 
                    key={stock} 
                    variant="secondary" 
                    className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    data-testid={`badge-stock-${stock}`}
                  >
                    #{stock}
                    <button
                      type="button"
                      onClick={() => removeStockMention(stock)}
                      className="ml-1 hover:bg-red-500/30 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sentiment Selection */}
          <div className="space-y-2">
            <Label className="text-gray-800 dark:text-gray-200 font-medium text-base">Market Sentiment</Label>
            <Select value={sentiment} onValueChange={setSentiment}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500" data-testid="select-sentiment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {SENTIMENTS.map(({ value, label, icon: Icon, color }) => (
                  <SelectItem key={value} value={value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-gray-800 dark:text-gray-200 font-medium text-base">Images (Optional)</Label>
            <MultipleImageUpload
              images={uploadedImages}
              onImagesChange={setUploadedImages}
              data-testid="image-uploader"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
              data-testid="button-clear-post"
            >
              Clear
            </Button>
            <Button 
              type="submit" 
              disabled={!content.trim() || createPostMutation.isPending}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-publish-post"
            >
              {createPostMutation.isPending ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </form>
        ) : (
          /* Message/Community View */
          <div className="space-y-4">
            {messageTab === 'message' ? (
              /* Message View - Simple message interface */
              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Direct messages coming soon!</p>
                </div>
              </div>
            ) : (
              /* Community View - Profiles and followers */
              <div className="space-y-4">
                {/* Profiles Section */}
                <div className="space-y-3">
                  {mockProfiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600" data-testid={`profile-card-${profile.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${profile.bgColor} flex items-center justify-center text-white font-medium`} data-testid={`avatar-${profile.id}`}>
                          {profile.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm" data-testid={`profile-name-${profile.id}`}>{profile.name}</h4>
                            {profile.status === 'online' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid={`status-${profile.id}`}>
                                Online
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`profile-handle-${profile.id}`}>{profile.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {profile.isOwn ? (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium" data-testid={`profile-you-${profile.id}`}>You</span>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="text-xs px-3 py-1 h-7" data-testid={`button-copy-strategy-${profile.id}`}>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Strategy
                            </Button>
                            <Button size="sm" variant="ghost" className="p-1 h-7 w-7" data-testid={`button-follow-${profile.id}`}>
                              <Users className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Followers Section */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600" data-testid="followers-section">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm" data-testid="followers-title">Followers</h3>
                    <Button size="sm" variant="outline" className="text-xs px-3 py-1 h-7" data-testid="button-follow-all">
                      <UserPlus className="w-3 h-3 mr-1" />
                      Follow All
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400" data-testid="followers-count">
                    Connect with 1,247 active traders in your network
                  </div>
                </div>

                {/* Join Community Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Join Trading Community</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Connect with experienced traders and share strategies
                  </p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm" data-testid="button-join-community">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Join Community
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}