import { useState, useRef, useEffect } from 'react';
import { X, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SelectedTextSnippet } from '@/contexts/AudioModeContext';

interface StackedSwipeableCardsProps {
  snippets: SelectedTextSnippet[];
  onRemove: (id: string) => void;
}

export function StackedSwipeableCards({ snippets, onRemove }: StackedSwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const nextCard = () => {
    if (isTransitioning || snippets.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % snippets.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevCard = () => {
    if (isTransitioning || snippets.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + snippets.length) % snippets.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const diff = startX.current - currentX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextCard();
      } else {
        prevCard();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const diff = startX.current - currentX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextCard();
      } else {
        prevCard();
      }
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging.current) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getGradient = (idx: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-blue-600', label: 'TECH NEWS', icon: '💻' },
      { from: 'from-purple-500', to: 'to-purple-600', label: 'MARKET UPDATE', icon: '📊' },
      { from: 'from-pink-500', to: 'to-pink-600', label: 'TRADING ALERT', icon: '📈' },
      { from: 'from-indigo-500', to: 'to-indigo-600', label: 'FINANCE NEWS', icon: '💡' },
      { from: 'from-cyan-500', to: 'to-cyan-600', label: 'INSIGHT', icon: '🎯' },
    ];
    return gradients[idx % gradients.length];
  };

  if (snippets.length === 0) return null;

  const currentSnippet = snippets[currentIndex];
  const gradient = getGradient(currentIndex);
  const authorName = currentSnippet.authorDisplayName || currentSnippet.authorUsername || 'Trading';

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Stacked Cards Container - Centered */}
      <div className="relative w-44 h-56 mb-4 group">
        {/* Swipe area */}
        <div
          className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
        
        {/* Bottom stacked layers (visible cards behind) */}
        {snippets.length > 2 && (
          <div className="absolute top-4 left-2 right-2 bottom-0 bg-gray-400 dark:bg-gray-600 rounded-xl opacity-20 transform rotate-1" />
        )}
        {snippets.length > 1 && (
          <div className="absolute top-2 left-1 right-1 bottom-1 bg-gray-300 dark:bg-gray-700 rounded-xl opacity-40 transform -rotate-1" />
        )}
        
        {/* Main card (top layer) */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br ${gradient.from} ${gradient.to} p-4 text-white shadow-2xl flex flex-col justify-between transition-all duration-300 ${
            isTransitioning ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
          }`}
        >
          {/* Remove button */}
          <button
            onClick={() => onRemove(currentSnippet.id)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all hover:scale-110 z-30"
            data-testid={`button-remove-snippet-${currentSnippet.id}`}
          >
            <X className="w-3 h-3" />
          </button>
          
          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{gradient.icon}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                {gradient.label}
              </p>
            </div>
            
            <h3 className="text-base font-bold leading-tight">
              Latest in {authorName.toLowerCase()}
            </h3>
            
            <p className="text-[11px] leading-relaxed opacity-90 line-clamp-5">
              {truncateText(currentSnippet.text, 100)}
            </p>
          </div>
          
          {/* Action Button */}
          <button 
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-100 transition-colors w-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Play className="w-3 h-3 fill-current" />
            Read Now
          </button>
        </div>

        {/* Navigation Arrows - Show on hover */}
        {snippets.length > 1 && (
          <>
            <button
              onClick={prevCard}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-10 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextCard}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-10 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
              aria-label="Next card"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Card Counter & Dot Indicators */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentIndex + 1} / {snippets.length}
        </div>
        
        {/* Dot Indicators */}
        {snippets.length > 1 && (
          <div className="flex justify-center space-x-1.5">
            {snippets.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isTransitioning) {
                    setIsTransitioning(true);
                    setCurrentIndex(index);
                    setTimeout(() => setIsTransitioning(false), 300);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-purple-600 dark:bg-purple-400 scale-110' 
                    : 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-400'
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
