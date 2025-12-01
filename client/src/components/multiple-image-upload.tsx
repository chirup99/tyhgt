import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle, createElement } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Image, BookOpen, TrendingUp, DollarSign, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  file?: File;
}

interface MultipleImageUploadProps {
  images?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
}

export interface MultipleImageUploadRef {
  getCurrentImages: () => UploadedImage[];
}

export const MultipleImageUpload = forwardRef<MultipleImageUploadRef, MultipleImageUploadProps>(
  function MultipleImageUpload({ images: externalImages = [], onImagesChange }, ref) {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Sync external images
    useEffect(() => {
      setImages(externalImages);
    }, [externalImages]);

    const updateImages = useCallback((newImages: UploadedImage[]) => {
      setImages(newImages);
      onImagesChange?.(newImages);
    }, [onImagesChange]);

    useImperativeHandle(ref, () => ({
      getCurrentImages: () => images
    }), [images]);

    const processFiles = (files: File[]) => {
      setIsUploading(true);
      const newImages: UploadedImage[] = [];
      let loaded = 0;

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({
            id: Math.random().toString(36).substr(2, 9),
            url: e.target?.result as string,
            name: file.name,
            file: file
          });
          
          loaded++;
          if (loaded === files.length) {
            const allImages = [...images, ...newImages];
            updateImages(allImages);
            setIsUploading(false);
            toast({
              title: "Images uploaded",
              description: `Added ${newImages.length} image(s)`
            });
          }
        };
        reader.readAsDataURL(file);
      });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        processFiles(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const navigateLeft = () => {
      setCurrentIndex((currentIndex - 1 + (images.length > 0 ? images.length : 5)) % (images.length > 0 ? images.length : 5));
    };

    const navigateRight = () => {
      setCurrentIndex((currentIndex + 1) % (images.length > 0 ? images.length : 5));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      setIsDragging(true);
      setDragOffset(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX.current;
      const deltaY = Math.abs(currentY - touchStartY.current);
      
      // Only horizontal swipe (not vertical)
      if (deltaY < 50) {
        setDragOffset(deltaX);
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      setIsDragging(false);
      const threshold = 50;
      
      if (dragOffset > threshold) {
        // Swiped right - go to previous
        navigateLeft();
      } else if (dragOffset < -threshold) {
        // Swiped left - go to next
        navigateRight();
      }
      
      setDragOffset(0);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      touchStartX.current = e.clientX;
      touchStartY.current = e.clientY;
      setIsDragging(true);
      setDragOffset(0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      const deltaX = currentX - touchStartX.current;
      const deltaY = Math.abs(currentY - touchStartY.current);
      
      if (deltaY < 50) {
        setDragOffset(deltaX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const threshold = 50;
      
      if (dragOffset > threshold) {
        navigateLeft();
      } else if (dragOffset < -threshold) {
        navigateRight();
      }
      
      setDragOffset(0);
    };

    // Determine cards to show
    const cardsToShow = images.length > 0 ? images : [
      { id: 'card-1', color: 'bg-blue-500', name: 'Upload Image', icon: Image },
      { id: 'card-2', color: 'bg-purple-500', name: 'Upload Articles Images', icon: BookOpen },
      { id: 'card-3', color: 'bg-pink-500', name: 'Technical Analysis', icon: TrendingUp },
      { id: 'card-4', color: 'bg-green-500', name: 'Fundamentals', icon: DollarSign },
      { id: 'card-5', color: 'bg-orange-500', name: 'Strategy Image', icon: Lightbulb },
    ];

    return (
      <div className="w-full h-full flex flex-col bg-transparent relative overflow-hidden">
        {/* Main Carousel Area - Full height, no wrapper */}
        <div 
          ref={carouselRef}
          className="flex-1 relative bg-transparent flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Cards Container */}
          <div className="absolute inset-0 flex items-center justify-center">
            {cardsToShow.map((card, idx) => {
              const offset = idx - currentIndex;
              let displayOffset = offset;
              const totalCards = cardsToShow.length;
              
              if (displayOffset < -totalCards / 2) {
                displayOffset += totalCards;
              } else if (displayOffset > totalCards / 2) {
                displayOffset -= totalCards;
              }

              if (Math.abs(displayOffset) > 2) return null;

              // Only apply drag offset to the center/top card (displayOffset === 0)
              const dragOffsetForThisCard = isDragging && displayOffset === 0 ? dragOffset : 0;
              const dragRotationForThisCard = isDragging && displayOffset === 0 ? (dragOffset * 0.15) : 0;

              const rotation = displayOffset * 8 + dragRotationForThisCard;
              const translateX = displayOffset * 45 + dragOffsetForThisCard * 0.3;
              const translateY = Math.abs(displayOffset) * 15;
              const scale = 1 - Math.abs(displayOffset) * 0.06;
              const zIndex = 100 - Math.abs(displayOffset);
              const opacity = displayOffset === 0 ? 1 : 0.65;

              return (
                <div
                  key={card.id}
                  className={`absolute ${isDragging ? '' : 'transition-all duration-400 ease-out'}`}
                  style={{
                    transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
                    zIndex: zIndex,
                    opacity: opacity,
                  }}
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ width: '300px', height: '220px' }}>
                    {images.length > 0 && 'url' in card ? (
                      <img
                        src={card.url}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        data-testid={`img-card-${idx}`}
                      />
                    ) : (
                      <div className={`w-full h-full ${(card as any).color} flex flex-col items-center justify-center gap-3`}>
                        {(card as any).icon && createElement((card as any).icon, { className: "w-10 h-10 text-white opacity-90" })}
                        <span className="text-white text-xs font-medium opacity-80 text-center px-2">{(card as any).name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Curved Line Footer - Transparent Background */}
        <div className="h-16 relative bg-transparent flex items-center justify-center overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full opacity-40"
            viewBox="0 0 800 60"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 15 Q 400 50, 800 15"
              stroke="#9ca3af"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>

          {/* Counter Badge - Tiny and minimalistic */}
          <div 
            className={`relative z-10 bg-gray-500 dark:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold shadow-md border border-gray-400 dark:border-gray-500 ${
              isDragging ? '' : 'transition-transform duration-400 ease-out'
            }`}
            style={{
              transform: `translateX(${(dragOffset * 0.5)}px)`
            }}
          >
            {currentIndex + 1}/{cardsToShow.length}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*"
          className="hidden"
          data-testid="input-file-upload"
        />
      </div>
    );
  }
);
