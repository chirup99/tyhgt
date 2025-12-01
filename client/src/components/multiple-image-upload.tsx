import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Plus, Copy, Edit, Expand, Minimize2, Download, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Sync external images
    useEffect(() => {
      setImages(externalImages);
      if (externalImages.length > 0) {
        setIsSaved(true);
      } else {
        setIsSaved(false);
      }
    }, [externalImages]);

    const updateImages = useCallback((newImages: UploadedImage[]) => {
      setImages(newImages);
      onImagesChange?.(newImages);
    }, [onImagesChange]);

    useImperativeHandle(ref, () => ({
      getCurrentImages: () => images
    }), [images]);

    // Copy-paste
    useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
        if (isSaved) return;
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              processFiles([blob]);
            }
          }
        }
      };

      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }, [isSaved]);

    // Drag & drop
    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith("image/")
      );
      
      if (files.length > 0) {
        processFiles(files);
      }
    }, []);

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

    const removeImage = (id: string) => {
      const newImages = images.filter(img => img.id !== id);
      updateImages(newImages);
      if (currentIndex >= newImages.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    };

    const navigateLeft = () => {
      setCurrentIndex((currentIndex - 1 + images.length) % images.length);
    };

    const navigateRight = () => {
      setCurrentIndex((currentIndex + 1) % images.length);
    };

    const handleFullscreen = () => {
      setIsFullscreen(true);
    };

    const handleExitFullscreen = () => {
      setIsFullscreen(false);
    };

    const currentImage = images[currentIndex];

    return (
      <>
        {/* Main Container - Always visible */}
        <div
          ref={containerRef}
          className="w-full h-full flex flex-col bg-gray-900"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-testid="image-upload-container"
        >
          {/* Main Carousel Area */}
          <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-visible">
            {/* 5 Empty Colored Cards - Swipeable */}
            {[
              { id: 'card-1', color: 'bg-blue-500' },
              { id: 'card-2', color: 'bg-purple-500' },
              { id: 'card-3', color: 'bg-pink-500' },
              { id: 'card-4', color: 'bg-green-500' },
              { id: 'card-5', color: 'bg-orange-500' },
            ].map((card, idx) => {
              const offset = idx - currentIndex;
              let displayOffset = offset;
              if (displayOffset < -5 / 2) {
                displayOffset += 5;
              } else if (displayOffset > 5 / 2) {
                displayOffset -= 5;
              }

              if (Math.abs(displayOffset) > 4) return null;

              const rotation = displayOffset * 6;
              const translateX = displayOffset * 35;
              const translateY = Math.abs(displayOffset) * 10;
              const scale = 1 - Math.abs(displayOffset) * 0.04;
              const zIndex = 100 - Math.abs(displayOffset);
              const opacity = displayOffset === 0 ? 1 : 0.75;

              return (
                <div
                  key={card.id}
                  className="absolute transition-all duration-300 ease-out"
                  style={{
                    transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
                    zIndex: zIndex,
                    opacity: opacity,
                  }}
                >
                  <div className={`relative ${card.color} rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow`} style={{ width: '280px', height: '200px' }}>
                    {/* Empty card with subtle center text */}
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-70">Card {idx + 1}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Navigation arrows */}
            <>
              <Button
                size="sm"
                variant="secondary"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-800 z-20"
                onClick={navigateLeft}
                data-testid="button-nav-left"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-800 z-20"
                onClick={navigateRight}
                data-testid="button-nav-right"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>

            {/* Upload overlay when no images */}
            {images.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer bg-black/20 hover:bg-black/30 z-10"
                data-testid="empty-upload-button"
              >
                <Plus className="w-16 h-16" />
                <p className="text-sm">Upload images</p>
              </button>
            )}
          </div>

          {/* Thumbnail Row - Only show if images exist */}
          {images.length > 0 && (
            <div className="h-24 bg-gray-800 px-4 py-2 overflow-x-auto flex gap-2 items-center border-t border-gray-700">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 rounded-md overflow-hidden cursor-pointer transition-all duration-200 ${
                    idx === currentIndex
                      ? 'ring-2 ring-blue-500 scale-105'
                      : 'hover:ring-1 hover:ring-gray-600'
                  }`}
                  style={{ width: '80px', height: '80px' }}
                  data-testid={`thumbnail-${idx}`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* Add more slot */}
              {!isSaved && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 rounded-md border-2 border-dashed border-gray-600 hover:border-gray-500 flex items-center justify-center transition-colors"
                  style={{ width: '80px', height: '80px' }}
                  data-testid="button-add-thumbnail"
                >
                  <Plus className="w-6 h-6 text-gray-500" />
                </button>
              )}
            </div>
          )}

          {/* Curved Line Footer - Only show if images exist */}
          {images.length > 0 && (
            <div className="h-16 relative bg-gray-900 flex items-center justify-center overflow-hidden border-t border-gray-800">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 800 60"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 40 Q 200 10, 400 25 T 800 40"
                  stroke="#4b5563"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>

              <div className="relative z-10 bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow-lg font-bold text-sm">
                {currentIndex + 1}/{images.length}
              </div>
            </div>
          )}
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

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen */}
        {isFullscreen && currentImage && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <img
              src={currentImage.url}
              alt={currentImage.name}
              className="max-w-full max-h-full object-contain"
              data-testid="img-fullscreen"
            />

            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 right-4 h-10 w-10 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
              onClick={handleExitFullscreen}
              data-testid="button-exit-fullscreen"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>

            {images.length > 1 && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
                  onClick={navigateLeft}
                  data-testid="button-fullscreen-nav-left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
                  onClick={navigateRight}
                  data-testid="button-fullscreen-nav-right"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        )}
      </>
    );
  }
);
