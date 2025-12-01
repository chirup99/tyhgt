import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    // Determine cards to show
    const cardsToShow = images.length > 0 ? images : [
      { id: 'card-1', color: 'bg-blue-500', name: 'Card 1' },
      { id: 'card-2', color: 'bg-purple-500', name: 'Card 2' },
      { id: 'card-3', color: 'bg-pink-500', name: 'Card 3' },
      { id: 'card-4', color: 'bg-green-500', name: 'Card 4' },
      { id: 'card-5', color: 'bg-orange-500', name: 'Card 5' },
    ];

    return (
      <div className="w-full h-full flex flex-col bg-gray-900 relative overflow-hidden">
        {/* Main Carousel Area - Full height, no wrapper */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
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

              const rotation = displayOffset * 8;
              const translateX = displayOffset * 45;
              const translateY = Math.abs(displayOffset) * 15;
              const scale = 1 - Math.abs(displayOffset) * 0.06;
              const zIndex = 100 - Math.abs(displayOffset);
              const opacity = displayOffset === 0 ? 1 : 0.65;

              return (
                <div
                  key={card.id}
                  className="absolute transition-all duration-400 ease-out"
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
                      <div className={`w-full h-full ${(card as any).color} flex items-center justify-center`}>
                        <span className="text-white text-sm font-medium opacity-70">{(card as any).name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white text-gray-800 z-20"
            onClick={navigateLeft}
            data-testid="button-nav-left"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white text-gray-800 z-20"
            onClick={navigateRight}
            data-testid="button-nav-right"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Curved Line Footer */}
        <div className="h-16 relative bg-gray-900 flex items-center justify-center overflow-hidden border-t border-gray-800">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 800 60"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 15 Q 400 50, 800 15"
              stroke="#6b7280"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          <div className="relative z-10 bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow-lg font-bold text-sm">
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
