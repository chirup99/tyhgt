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
            {images.length === 0 ? (
              // Empty state - minimal
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 text-gray-500 hover:text-gray-400 transition-colors cursor-pointer"
                data-testid="empty-upload-button"
              >
                <Plus className="w-16 h-16" />
                <p className="text-sm">Click or drag images</p>
              </button>
            ) : (
              // Carousel with fanned cards
              <>
                {images.map((img, idx) => {
                  const offset = idx - currentIndex;
                  let displayOffset = offset;
                  if (displayOffset < -images.length / 2) {
                    displayOffset += images.length;
                  } else if (displayOffset > images.length / 2) {
                    displayOffset -= images.length;
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
                      key={img.id}
                      className="absolute transition-all duration-300 ease-out"
                      style={{
                        transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
                        zIndex: zIndex,
                        opacity: opacity,
                      }}
                    >
                      <div className="relative bg-black rounded-md overflow-hidden shadow-xl" style={{ width: '280px', height: '200px' }}>
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                          data-testid={`img-card-${idx}`}
                        />

                        {/* Image label */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/40 to-transparent p-3">
                          <p className="text-white text-xs font-medium truncate">{img.name}</p>
                        </div>

                        {/* Controls - only on center card */}
                        {displayOffset === 0 && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 w-7 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
                              onClick={handleFullscreen}
                              data-testid="button-fullscreen"
                            >
                              <Expand className="w-3 h-3" />
                            </Button>

                            {!isSaved ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 w-7 p-0"
                                onClick={() => removeImage(img.id)}
                                data-testid={`button-remove-${idx}`}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 w-7 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
                                    data-testid="button-image-menu"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-gray-800 border border-gray-700">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setIsSaved(false);
                                      toast({ title: "Edit mode enabled" });
                                    }}
                                    className="cursor-pointer hover:bg-gray-700"
                                  >
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => navigator.clipboard.writeText(img.url)}
                                    className="cursor-pointer hover:bg-gray-700"
                                  >
                                    <Copy className="w-3 h-3 mr-2" />
                                    Copy URL
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = img.url;
                                      link.download = img.name || `image_1`;
                                      link.click();
                                    }}
                                    className="cursor-pointer hover:bg-gray-700"
                                  >
                                    <Download className="w-3 h-3 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Navigation arrows */}
                {images.length > 1 && (
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
                )}

                {/* Bottom controls */}
                {!isSaved && (
                  <div className="absolute bottom-4 left-4 flex gap-2 z-20">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                      onClick={() => {
                        setIsSaved(true);
                        toast({ title: "Images saved" });
                      }}
                      disabled={isUploading || images.length === 0}
                      data-testid="button-save-post"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Save
                    </Button>

                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      data-testid="button-add-more"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {isUploading ? 'Uploading...' : 'Add More'}
                    </Button>
                  </div>
                )}
              </>
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
