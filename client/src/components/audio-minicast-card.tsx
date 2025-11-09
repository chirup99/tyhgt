import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Play, Heart, MessageCircle, Share } from 'lucide-react';

interface AudioMinicastCardProps {
  content: string;
  author: {
    displayName: string;
    username: string;
  };
  selectedPostIds?: number[];
  timestamp: Date;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
}

interface AudioCard {
  id: string;
  type: 'main' | 'post';
  content: string;
  postId?: number;
  colorIndex: number;
}

export function AudioMinicastCard({
  content,
  author,
  selectedPostIds = [],
  timestamp,
  likes = 0,
  comments = 0,
  isLiked = false
}: AudioMinicastCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const [cards, setCards] = useState<AudioCard[]>(() => {
    const allCards: AudioCard[] = [
      { id: 'main', type: 'main', content, colorIndex: 0 }
    ];
    selectedPostIds.forEach((postId, idx) => {
      allCards.push({
        id: `post-${postId}`,
        type: 'post',
        content: `Selected Post ${idx + 1}`,
        postId,
        colorIndex: (idx + 1) % 5
      });
    });
    return allCards;
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const swipeCard = (direction: 'left' | 'right') => {
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
      { from: 'from-purple-500', to: 'to-purple-600', label: 'POST 1', icon: '📊' },
      { from: 'from-pink-500', to: 'to-pink-600', label: 'POST 2', icon: '📈' },
      { from: 'from-indigo-500', to: 'to-indigo-600', label: 'POST 3', icon: '💡' },
      { from: 'from-cyan-500', to: 'to-cyan-600', label: 'POST 4', icon: '🎯' },
    ];
    return gradients[idx % gradients.length];
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLike = () => {
    setLocalLiked(!localLiked);
    setLikeCount(prev => localLiked ? prev - 1 : prev + 1);
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
        </div>

        {/* Swipeable Cards Container */}
        <div className="bg-gray-50 dark:bg-gray-800/30 py-8 flex items-center justify-center">
          <div className="relative w-28 h-40" style={{ perspective: '1000px' }}>
            {cards.map((card, index) => {
              const isTop = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isFourth = index === 3;
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
                stackOpacity = isSecond ? 0.95 : (isThird ? 0.85 : (isFourth ? 0.75 : 0.6));
                stackZ = isSecond ? 30 : (isThird ? 20 : (isFourth ? 15 : 10));
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
                    <div className="relative z-10">
                      <div className="text-[8px] text-white/80 mb-1 uppercase tracking-wide font-medium">
                        {gradient.label}
                      </div>
                      <h3 className="text-xs font-bold text-white mb-2 leading-tight">
                        {card.type === 'main' ? (
                          <>
                            Latest in
                            <br />
                            {author.displayName.toLowerCase()}
                          </>
                        ) : (
                          <>
                            Post #{card.postId}
                            <br />
                            selected
                          </>
                        )}
                      </h3>
                      <button
                        className="bg-white text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-full text-[10px] font-medium shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isTop) {
                            togglePlay();
                          }
                        }}
                        data-testid="button-play-audio-card"
                      >
                        <div className="flex items-center gap-1">
                          <Play className="w-2 h-2" />
                          <span>{isPlaying ? 'Playing' : 'Play Now'}</span>
                        </div>
                      </button>
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
      </CardContent>
    </Card>
  );
}
