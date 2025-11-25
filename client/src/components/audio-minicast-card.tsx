import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Play, Heart, MessageCircle, Share, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '@/firebase';

interface SelectedPost {
  id: string | number;
  content: string;
}

interface AudioMinicastCardProps {
  content: string;
  author: {
    displayName: string;
    username: string;
  };
  selectedPostIds?: (string | number)[];
  selectedPosts?: SelectedPost[];
  timestamp: Date;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  postId?: string;
  isOwner?: boolean;
}

interface AudioCard {
  id: string;
  type: 'main' | 'post';
  content: string;
  postId?: string | number;
  colorIndex: number;
}

export function AudioMinicastCard({
  content,
  author,
  selectedPostIds = [],
  selectedPosts = [],
  timestamp,
  likes = 0,
  comments = 0,
  isLiked = false,
  postId,
  isOwner = false
}: AudioMinicastCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const previousCardIdRef = useRef<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cards, setCards] = useState<AudioCard[]>(() => {
    console.log('🎧 AudioMinicastCard Initializing:', {
      selectedPostsCount: selectedPosts.length,
      selectedPostIdsCount: selectedPostIds.length,
      hasPosts: selectedPosts.length > 0
    });
    
    // Only include posts with actual content (not the main announcement card)
    const allCards: AudioCard[] = [];
    
    // Only include posts with actual content (not placeholders or empty content)
    if (selectedPosts.length > 0) {
      console.log('✅ Using selectedPosts with actual content');
      selectedPosts.forEach((post, idx) => {
        // Filter out posts with no content or placeholder content
        const hasRealContent = post.content && 
                               post.content.trim().length > 0 && 
                               !post.content.startsWith('Selected Post');
        
        if (hasRealContent) {
          console.log(`  Card ${idx + 1}:`, {
            id: post.id,
            contentLength: post.content?.length || 0,
            contentPreview: post.content?.substring(0, 50) + '...'
          });
          allCards.push({
            id: `post-${post.id}`,
            type: 'post',
            content: post.content,
            postId: post.id,
            colorIndex: idx % 5
          });
        } else {
          console.log(`  Skipping card ${idx + 1}: No real content`);
        }
      });
    }
    
    console.log('📋 Total content cards created:', allCards.length);
    return allCards;
  });

  // Auto-play when swiping to a new card (skip first card)
  useEffect(() => {
    const currentCard = cards[0];
    const currentIndex = cards.findIndex(c => c.id === currentCard?.id);
    
    if (currentCard && currentCard.id !== previousCardIdRef.current) {
      previousCardIdRef.current = currentCard.id;
      
      // Only auto-play from 2nd card onwards (skip first card at index 0)
      if (currentCard.type === 'post' && currentIndex > 0) {
        // Stop any current playback
        window.speechSynthesis.cancel();
        
        // Start playing the new card
        const textToSpeak = cleanTextForSpeech(currentCard.content);
        console.log('🎵 Auto-playing card (skipping first):', {
          cardId: currentCard.id,
          cardIndex: currentIndex,
          textLength: textToSpeak.length,
          textPreview: textToSpeak.substring(0, 100) + '...'
        });
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        utterance.onerror = () => {
          setIsPlaying(false);
        };
        
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  }, [cards]);

  // Auto-play current (top) card when it changes (Reels-like behavior)
  useEffect(() => {
    if (shouldAutoPlay && cards.length > 0 && cards[0].id !== previousCardIdRef.current) {
      previousCardIdRef.current = cards[0].id;
      // Small delay to ensure card is rendered
      const timer = setTimeout(() => {
        const currentCard = cards[0];
        if (currentCard && currentCard.type === 'post') {
          const textToSpeak = cleanTextForSpeech(currentCard.content);
          
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          utterance.onend = () => {
            setIsPlaying(false);
          };
          
          utterance.onerror = () => {
            setIsPlaying(false);
          };
          
          window.speechSynthesis.speak(utterance);
          setIsPlaying(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    } else if (cards.length > 0) {
      previousCardIdRef.current = cards[0].id;
    }
  }, [cards, shouldAutoPlay]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const swipeCard = (direction: 'left' | 'right') => {
    // Stop any currently playing audio when swiping
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setShouldAutoPlay(true); // Enable auto-play for next card
    
    setCards((prevCards) => {
      const newCards = [...prevCards];
      if (direction === 'right') {
        const firstCard = newCards.shift();
        if (firstCard) newCards.push(firstCard);
      } else {
        const lastCard = newCards.pop();
        if (lastCard) newCards.unshift(lastCard);
      }
      return newCards;
    });
  };

  const [swipeOffset, setSwipeOffset] = useState(0);

  const getGradient = (idx: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-blue-600', label: 'AUDIO MINICAST', icon: '🎙️' },
      { from: 'from-purple-500', to: 'to-purple-600', label: 'MINICAST 1', icon: '📊' },
      { from: 'from-pink-500', to: 'to-pink-600', label: 'MINICAST 2', icon: '📈' },
      { from: 'from-indigo-500', to: 'to-indigo-600', label: 'MINICAST 3', icon: '💡' },
      { from: 'from-cyan-500', to: 'to-cyan-600', label: 'MINICAST 4', icon: '🎯' },
    ];
    return gradients[idx % gradients.length];
  };

  // Clean text for speech: remove emojis, links, and special characters
  const cleanTextForSpeech = (text: string): string => {
    // Remove URLs
    let cleaned = text.replace(/https?:\/\/[^\s]+/gi, '').replace(/www\.[^\s]+/gi, '');
    
    // Remove emojis by removing characters outside basic ASCII range
    cleaned = cleaned.replace(/[^\x20-\x7E\s]/g, '');
    
    // Remove extra whitespace and return
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  const togglePlay = () => {
    setShouldAutoPlay(false); // Disable auto-play for manual interactions
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      // Only read content cards (not the main announcement card)
      const currentCard = cards[0];
      if (currentCard && currentCard.type === 'post') {
        const textToSpeak = cleanTextForSpeech(currentCard.content);
        
        console.log('🔊 Playing audio:', {
          currentCardId: currentCard.id,
          currentCardType: currentCard.type,
          textLength: textToSpeak.length,
          textPreview: textToSpeak.substring(0, 100) + '...'
        });
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        utterance.onerror = () => {
          setIsPlaying(false);
        };
        
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  }

  const handleLike = () => {
    setLocalLiked(!localLiked);
    setLikeCount(prev => localLiked ? prev - 1 : prev + 1);
  };

  const handleDelete = async () => {
    if (!postId) {
      toast({ description: 'Unable to delete post', variant: 'destructive' });
      return;
    }

    setIsDeleting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const idToken = await user.getIdToken();
      const response = await fetch(`/api/social-posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete post');

      toast({ description: 'Audio post deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('❌ Error deleting audio post:', error);
      toast({ 
        description: error.message || 'Failed to delete post', 
        variant: 'destructive' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-0 border-b border-gray-200 dark:border-gray-700 rounded-none overflow-hidden">
      <CardContent className="p-0">
        {/* Author Header */}
        <div className="p-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
            {author.displayName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">{author.displayName}</span>
              <Radio className="h-3 w-3 text-purple-500" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>@{author.username}</span>
              <span>·</span>
              <span>{formatTimeAgo(timestamp)}</span>
            </div>
          </div>
          
          {/* Delete Menu - Only show for owner */}
          {isOwner && postId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  data-testid="button-audio-post-menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 dark:text-red-400 cursor-pointer"
                  data-testid="menu-item-delete-audio"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Swipeable Cards Container */}
        <div className="bg-gray-50 dark:bg-gray-800/30 pb-6 flex items-center justify-center">
          <div className="relative w-28 h-40" style={{ perspective: '1000px' }}>
            {cards.slice(0, 5).map((card, index) => {
              const isTop = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isFourth = index === 3;
              const isFifth = index === 4;
              const gradient = getGradient(card.colorIndex);
              
              let stackTransform = '';
              let stackOpacity = 1;
              let stackZ = 40;
              
              if (!isTop) {
                const rotationDeg = index * 3;
                const yOffset = index * 8;
                const scale = 1 - (index * 0.03);
                const xOffset = index * -2;
                
                stackTransform = `translateY(${yOffset}px) translateX(${xOffset}px) rotate(${rotationDeg}deg) scale(${scale})`;
                stackOpacity = isSecond ? 0.95 : (isThird ? 0.85 : (isFourth ? 0.75 : (isFifth ? 0.65 : 0.5)));
                stackZ = isSecond ? 30 : (isThird ? 20 : (isFourth ? 15 : (isFifth ? 10 : 5)));
              }

              return (
                <div
                  key={card.id}
                  data-card-index={index}
                  style={{
                    transform: stackTransform,
                    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                    opacity: stackOpacity,
                    zIndex: stackZ,
                  }}
                  className={`absolute inset-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                    if (!isTop) return;

                    const startX = e.clientX;
                    const startY = e.clientY;
                    const cardElement = e.currentTarget as HTMLElement;
                    let isDragging = false;

                    const handleMouseMove = (e: MouseEvent) => {
                      const deltaX = e.clientX - startX;
                      const deltaY = e.clientY - startY;

                      if (
                        !isDragging &&
                        (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                      ) {
                        isDragging = true;
                      }

                      if (isDragging) {
                        const rotation = deltaX * 0.1;
                        cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                        cardElement.style.opacity = String(
                          Math.max(0.3, 1 - Math.abs(deltaX) / 300)
                        );
                        setSwipeOffset(deltaX);
                      }
                    };

                    const handleMouseUp = (e: MouseEvent) => {
                      if (isDragging) {
                        const deltaX = e.clientX - startX;
                        setSwipeOffset(0);
                        
                        if (Math.abs(deltaX) > 40) {
                          const swipeDirection = deltaX > 0 ? "right" : "left";

                          if (swipeDirection === "right") {
                            const direction = "150%";
                            const rotation = "30deg";
                            cardElement.style.transform = `translate(${direction}, ${
                              deltaX * 0.5
                            }px) rotate(${rotation})`;
                            cardElement.style.opacity = "0";

                            setTimeout(() => {
                              cardElement.style.transform = "";
                              cardElement.style.opacity = "";
                              swipeCard(swipeDirection);
                            }, 300);
                          } else {
                            cardElement.style.transform = "";
                            cardElement.style.opacity = "";
                            swipeCard(swipeDirection);

                            setTimeout(() => {
                              const newTopCard =
                                cardElement.parentElement?.querySelector(
                                  '[data-card-index="0"]'
                                ) as HTMLElement;
                              if (newTopCard) {
                                newTopCard.style.transform =
                                  "translate(150%, 0) rotate(30deg)";
                                newTopCard.style.opacity = "0";

                                setTimeout(() => {
                                  newTopCard.style.transform = "";
                                  newTopCard.style.opacity = "";
                                  newTopCard.style.transition =
                                    "transform 300ms ease-out, opacity 300ms ease-out";

                                  setTimeout(() => {
                                    newTopCard.style.transition = "";
                                  }, 300);
                                }, 10);
                              }
                            }, 10);
                          }
                        } else {
                          cardElement.style.transform = "";
                          cardElement.style.opacity = "";
                        }
                      }

                      document.removeEventListener("mousemove", handleMouseMove);
                      document.removeEventListener("mouseup", handleMouseUp);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                  onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
                    if (!isTop) return;

                    const startX = e.touches[0].clientX;
                    const startY = e.touches[0].clientY;
                    const cardElement = e.currentTarget as HTMLElement;
                    let isDragging = false;

                    const handleTouchMove = (e: TouchEvent) => {
                      const deltaX = e.touches[0].clientX - startX;
                      const deltaY = e.touches[0].clientY - startY;

                      if (
                        !isDragging &&
                        (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                      ) {
                        isDragging = true;
                      }

                      if (isDragging) {
                        e.preventDefault();
                        const rotation = deltaX * 0.1;
                        cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                        cardElement.style.opacity = String(
                          Math.max(0.3, 1 - Math.abs(deltaX) / 300)
                        );
                        setSwipeOffset(deltaX);
                      }
                    };

                    const handleTouchEnd = (e: TouchEvent) => {
                      if (isDragging) {
                        const deltaX = e.changedTouches[0].clientX - startX;
                        setSwipeOffset(0);
                        
                        if (Math.abs(deltaX) > 40) {
                          const swipeDirection = deltaX > 0 ? "right" : "left";

                          if (swipeDirection === "right") {
                            const direction = "150%";
                            const rotation = "30deg";
                            cardElement.style.transform = `translate(${direction}, ${
                              deltaX * 0.5
                            }px) rotate(${rotation})`;
                            cardElement.style.opacity = "0";

                            setTimeout(() => {
                              cardElement.style.transform = "";
                              cardElement.style.opacity = "";
                              swipeCard(swipeDirection);
                            }, 300);
                          } else {
                            cardElement.style.transform = "";
                            cardElement.style.opacity = "";
                            swipeCard(swipeDirection);

                            setTimeout(() => {
                              const newTopCard =
                                cardElement.parentElement?.querySelector(
                                  '[data-card-index="0"]'
                                ) as HTMLElement;
                              if (newTopCard) {
                                newTopCard.style.transform =
                                  "translate(150%, 0) rotate(30deg)";
                                newTopCard.style.opacity = "0";

                                setTimeout(() => {
                                  newTopCard.style.transform = "";
                                  newTopCard.style.opacity = "";
                                  newTopCard.style.transition =
                                    "transform 300ms ease-out, opacity 300ms ease-out";

                                  setTimeout(() => {
                                    newTopCard.style.transition = "";
                                  }, 300);
                                }, 10);
                              }
                            }, 10);
                          }
                        } else {
                          cardElement.style.transform = "";
                          cardElement.style.opacity = "";
                        }
                      }

                      document.removeEventListener("touchmove", handleTouchMove);
                      document.removeEventListener("touchend", handleTouchEnd);
                    };

                    document.addEventListener("touchmove", handleTouchMove, { passive: false });
                    document.addEventListener("touchend", handleTouchEnd);
                  }}
                >
                  <div
                    className={`bg-gradient-to-br ${gradient.from} ${gradient.to} rounded-xl p-3 h-full relative overflow-hidden border-2 border-white/10`}
                    style={{
                      boxShadow: isTop 
                        ? '0 20px 40px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.3)' 
                        : `0 ${8 + index * 4}px ${16 + index * 8}px rgba(0,0,0,${0.3 + index * 0.1})`
                    }}
                  >
                    {/* Background decoration */}
                    <div className="absolute bottom-0 right-0 w-16 h-16 opacity-30">
                      <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 rounded-full"></div>
                    </div>

                    {/* Card content */}
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      {/* Top section - Label */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-[8px] text-white/80 uppercase tracking-wide font-medium">
                          {gradient.label}
                        </div>
                      </div>

                      {/* Display name - Center */}
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-white font-bold text-sm leading-tight">
                            {author.displayName}
                          </div>
                        </div>
                      </div>

                      {/* Play button - Bottom */}
                      <div className="flex justify-center">
                        <button
                          className="bg-white text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-full text-[10px] font-medium shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isTop) {
                              togglePlay();
                            }
                          }}
                          data-testid="button-play-audio-card"
                        >
                          <div className="flex items-center gap-1">
                            <Play className="w-2.5 h-2.5" />
                            <span>{isPlaying ? 'Playing' : 'Play Now'}</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="absolute top-2 right-2 text-sm filter drop-shadow-lg">
                      {gradient.icon}
                    </div>

                    {/* Stack indicator for non-top cards */}
                    {!isTop && (
                      <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            data-testid="button-comment-audio"
          >
            <MessageCircle className="h-5 w-5 mr-1" />
            <span className="text-sm">{comments}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`${
              localLiked
                ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
            data-testid="button-like-audio"
          >
            <Heart className={`h-5 w-5 mr-1 ${localLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            data-testid="button-share-audio"
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Audio Post</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this audio minicast? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                data-testid="button-cancel-delete-audio"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                data-testid="button-confirm-delete-audio"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
