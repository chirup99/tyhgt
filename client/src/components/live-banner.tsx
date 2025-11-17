import { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Calendar,
  TrendingUp,
  Zap,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface BannerContent {
  id: string;
  type: 'live_stream' | 'ad' | 'update' | 'content';
  title: string;
  description: string;
  imageUrl?: string;
  youtubeEmbedUrl?: string;
  date?: string;
  isLive?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const getDefaultBannerContent = (youtubeUrl?: string | null): BannerContent[] => {
  return [
    {
      id: '1', 
      type: 'live_stream',
      title: 'CNBC Live Stream',
      description: 'Watch live market analysis and trading strategies',
      youtubeEmbedUrl: youtubeUrl || 'https://www.youtube.com/embed/0AzLJkgUtAo?enablejsapi=1&pp=ygUJY25iYyBsaXZl',
      isLive: true,
      priority: 'high'
    },
    {
      id: '2',
      type: 'content',
      title: 'Market Analysis Update',
      description: 'Latest market trends and analysis',
      date: '9 Sep 2024'
    },
    {
      id: '3',
      type: 'update',
      title: 'Important Trading Update',
      description: 'New features and market alerts now available',
      priority: 'high'
    },
    {
      id: '4',
      type: 'ad',
      title: 'Premium Trading Tools',
      description: 'Upgrade to access advanced analytics and insights',
      priority: 'medium'
    }
  ];
};

export function LiveBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [youtubePlayerState, setYoutubePlayerState] = useState<'playing' | 'paused' | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);

  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/embed/0AzLJkgUtAo?enablejsapi=1&pp=ygUJY25iYyBsaXZl');

  // Load saved URL from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('youtube_banner_url');
    if (savedUrl) {
      setYoutubeUrl(savedUrl);
    }
  }, []);

  // Listen for URL updates from LivestreamAdsControl
  useEffect(() => {
    const handleUrlUpdate = (event: CustomEvent) => {
      const newUrl = event.detail.url;
      if (newUrl) {
        setYoutubeUrl(newUrl);
        setCurrentIndex(0);
      } else {
        setYoutubeUrl('https://www.youtube.com/embed/0AzLJkgUtAo?enablejsapi=1&pp=ygUJY25iYyBsaXZl');
        setCurrentIndex(0);
      }
    };

    window.addEventListener('livestream-url-updated', handleUrlUpdate as EventListener);
    return () => {
      window.removeEventListener('livestream-url-updated', handleUrlUpdate as EventListener);
    };
  }, []);

  const bannerContent = useMemo(() => {
    return getDefaultBannerContent(youtubeUrl);
  }, [youtubeUrl]);
  
  const currentContent = bannerContent[currentIndex];

  useEffect(() => {
    if (!currentContent.youtubeEmbedUrl) {
      setYoutubePlayerState(null);
      return;
    }

    if (!(window as any).YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
    }

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      if ((window as any).YT && (window as any).YT.Player) {
        try {
          playerRef.current = new (window as any).YT.Player('youtube-player-iframe', {
            events: {
              onStateChange: (event: any) => {
                console.log('🎥 YouTube Player State Changed:', event.data);
                if (event.data === (window as any).YT.PlayerState.PLAYING) {
                  console.log('▶️ YouTube video is PLAYING - pausing carousel');
                  setYoutubePlayerState('playing');
                } else if (event.data === (window as any).YT.PlayerState.PAUSED || 
                           event.data === (window as any).YT.PlayerState.ENDED) {
                  console.log('⏸️ YouTube video is PAUSED - resuming carousel');
                  setYoutubePlayerState('paused');
                }
              },
              onReady: () => {
                console.log('✅ YouTube Player API Ready');
              }
            }
          });
        } catch (error) {
          console.error('❌ Error initializing YouTube Player:', error);
        }
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.log('Error destroying player:', e);
        }
        playerRef.current = null;
      }
    };
  }, [currentContent.youtubeEmbedUrl, currentIndex]);

  useEffect(() => {
    if (!isPlaying) return;
    
    if (currentContent.youtubeEmbedUrl && youtubePlayerState === 'playing') {
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerContent.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying, currentContent.youtubeEmbedUrl, youtubePlayerState]);

  const pauseYouTube = () => {
    if (iframeRef.current && currentContent.youtubeEmbedUrl) {
      iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
  };

  (window as any).pauseBannerYouTube = pauseYouTube;

  const navigateLeft = () => {
    setCurrentIndex((prev) => prev > 0 ? prev - 1 : bannerContent.length - 1);
  };

  const navigateRight = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerContent.length);
  };

  const getBadgeStyle = (type: string, priority?: string) => {
    switch (type) {
      case 'live_stream':
        return 'bg-red-500 text-white animate-pulse';
      case 'update':
        return priority === 'high' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white';
      case 'ad':
        return 'bg-green-500 text-white';
      default:
        return 'bg-indigo-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'live_stream':
        return <Zap className="w-3 h-3" />;
      case 'update':
        return <Bell className="w-3 h-3" />;
      case 'ad':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };

  return (
    <Card className="w-full h-32 md:h-48 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-2 border-indigo-400/30">
      <div className="absolute inset-0">
        {currentContent.youtubeEmbedUrl ? (
          <iframe
            id="youtube-player-iframe"
            ref={iframeRef}
            src={currentContent.youtubeEmbedUrl}
            title={currentContent.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-testid="banner-youtube-iframe"
          />
        ) : currentContent.imageUrl ? (
          <img
            src={currentContent.imageUrl}
            alt={currentContent.title}
            className="w-full h-full object-cover opacity-70"
            data-testid="banner-background-image"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-blue-600/20" />
        )}
        
        {!currentContent.youtubeEmbedUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        )}
      </div>

      {!currentContent.youtubeEmbedUrl && (
        <div className="relative z-10 h-full flex flex-col justify-between p-3 md:p-6">
          <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 md:gap-3">
            <Badge className={`flex items-center gap-1 text-xs ${getBadgeStyle(currentContent.type, currentContent.priority)}`}>
              {getTypeIcon(currentContent.type)}
              {currentContent.type === 'live_stream' && currentContent.isLive ? 'LIVE' : 
               currentContent.type.toUpperCase().replace('_', ' ')}
            </Badge>
            
            {currentContent.isLive && (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm">Live Stream Active</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="button-banner-play-pause"
            >
              {isPlaying ? <Pause className="w-3 h-3 md:w-4 md:h-4" /> : <Play className="w-3 h-3 md:w-4 md:h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => setIsMuted(!isMuted)}
              data-testid="button-banner-mute"
            >
              {isMuted ? <VolumeX className="w-3 h-3 md:w-4 md:h-4" /> : <Volume2 className="w-3 h-3 md:w-4 md:h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              data-testid="button-banner-fullscreen"
            >
              <Maximize2 className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10 p-0"
            onClick={navigateLeft}
            data-testid="button-banner-nav-left"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <div className="text-center text-white max-w-2xl px-2">
            <h2 className="text-sm md:text-2xl font-bold mb-1 md:mb-2" data-testid="banner-title">
              {currentContent.title}
            </h2>
            <p className="text-white/80 text-xs md:text-sm mb-1 md:mb-3" data-testid="banner-description">
              {currentContent.description}
            </p>
            
            {currentContent.date && (
              <div className="flex items-center justify-center gap-1 md:gap-2 text-white/70 text-xs">
                <Calendar className="w-3 h-3" />
                <span data-testid="banner-date">{currentContent.date}</span>
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10 p-0"
            onClick={navigateRight}
            data-testid="button-banner-nav-right"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2">
          {bannerContent.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-4 md:w-6' : 'bg-white/40'
              }`}
              onClick={() => setCurrentIndex(index)}
              data-testid={`banner-indicator-${index}`}
            />
          ))}
        </div>
      </div>
      )}

      {currentContent.isLive && !currentContent.youtubeEmbedUrl && (
        <div className="absolute top-2 md:top-4 right-12 md:right-20 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold animate-pulse">
          ● LIVE
        </div>
      )}
    </Card>
  );
}
