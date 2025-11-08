import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Play, Pause, ChevronLeft, ChevronRight, Heart, MessageCircle, Share } from 'lucide-react';

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

export function AudioMinicastCard({
  content,
  author,
  selectedPostIds = [],
  timestamp,
  likes = 0,
  comments = 0,
  isLiked = false
}: AudioMinicastCardProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const handlePrevious = () => {
    setCurrentCardIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentCardIndex(prev => Math.min(selectedPostIds.length, prev + 1));
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual audio playback
  };

  const handleLike = () => {
    setLocalLiked(!localLiked);
    setLikeCount(prev => localLiked ? prev - 1 : prev + 1);
  };

  // Card colors for swipe effect
  const cardColors = [
    'from-blue-500 to-purple-600',
    'from-purple-500 to-pink-600',
    'from-pink-500 to-rose-600',
    'from-orange-500 to-red-600',
    'from-green-500 to-emerald-600',
    'from-cyan-500 to-blue-600'
  ];

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

        {/* Swipeable Card Display */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          {/* Card Content with Index */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${cardColors[currentCardIndex % cardColors.length]} flex flex-col items-center justify-center p-6 transition-all duration-300`}
            data-testid="audio-minicast-card-display"
          >
            {/* Card Index Indicator */}
            <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
              {currentCardIndex + 1} / {selectedPostIds.length + 1}
            </div>

            {/* Card Content */}
            <div className="text-center space-y-4">
              <Radio className="h-12 w-12 text-white mx-auto animate-pulse" />
              <div className="text-white">
                {currentCardIndex === 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Audio MiniCast</h3>
                    <p className="text-sm opacity-90 max-w-md">{content}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Selected Post {currentCardIndex}</h3>
                    <p className="text-sm opacity-75">Post ID: {selectedPostIds[currentCardIndex - 1]}</p>
                  </div>
                )}
              </div>

              {/* Play/Pause Button */}
              <Button
                onClick={togglePlay}
                size="lg"
                className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white/50 text-white"
                data-testid="button-play-pause-audio"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Play Audio
                  </>
                )}
              </Button>
            </div>

            {/* Navigation Arrows */}
            {currentCardIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 transition-all"
                data-testid="button-previous-card"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            )}
            {currentCardIndex < selectedPostIds.length && (
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 transition-all"
                data-testid="button-next-card"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            )}
          </div>

          {/* Progress Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {[...Array(selectedPostIds.length + 1)].map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentCardIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50'
                }`}
                data-testid={`progress-dot-${index}`}
              />
            ))}
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
