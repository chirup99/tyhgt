import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Upload, X, Plus, Copy, Save, MoreVertical, Trash2, Share2, Edit, Expand, Minimize2, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  file?: File; // Optional for saved images
}

interface SavedPost {
  id: string;
  images: UploadedImage[];
  savedAt: Date;
  title?: string;
}

interface MultipleImageUploadProps {
  images?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
}

export interface MultipleImageUploadRef {
  getCurrentImages: () => UploadedImage[];
}

export const MultipleImageUpload = forwardRef<MultipleImageUploadRef, MultipleImageUploadProps>(function MultipleImageUpload({ images: externalImages = [], onImagesChange }, ref) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Sync external images with internal state
  useEffect(() => {
    setImages(externalImages);
    
    // If images are loaded externally, treat them as saved (display-only mode)
    if (externalImages.length > 0) {
      setIsSaved(true);
      console.log('📸 Loaded saved images in display-only mode:', externalImages.length);
    } else {
      setIsSaved(false);
    }
  }, [externalImages]);

  // Update internal images and notify parent
  const updateImages = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages);
    onImagesChange?.(newImages);
  }, [onImagesChange]);

  // Expose method to get current images for manual save
  useImperativeHandle(ref, () => ({
    getCurrentImages: () => images
  }), [images]);

  // Copy-paste functionality
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only allow paste if not in saved mode (edit mode only)
      if (isSaved) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter(item => 
        item.type.startsWith('image/')
      );

      if (imageItems.length > 0) {
        e.preventDefault();
        imageItems.forEach(item => {
          const file = item.getAsFile();
          if (file && file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024) {
            setIsUploading(true);
            
            const reader = new FileReader();
            reader.onload = (e) => {
              const previewUrl = e.target?.result as string;
              const newImage: UploadedImage = {
                id: Math.random().toString(36).substr(2, 9),
                url: previewUrl,
                name: file.name,
                file: file,
              };
              
              // Update images and notify parent component
              const newImages = [...images, newImage];
              updateImages(newImages);
              setCurrentIndex(newImages.length - 1);
              setIsUploading(false);
            };
            reader.readAsDataURL(file);
          }
        });
        
        toast({
          title: "Images pasted successfully",
          description: `${imageItems.length} image(s) added from clipboard`,
        });
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isSaved, toast, updateImages]);

  // Drag and drop functionality
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );
    
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    // Process all files and collect them before updating
    let processedCount = 0;
    const newImages: UploadedImage[] = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        const newImage: UploadedImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: previewUrl,
          name: file.name,
          file: file,
        };
        
        newImages.push(newImage);
        processedCount++;
        
        // When all files are processed, update the state once
        if (processedCount === files.length) {
          const allImages = [...images, ...newImages];
          updateImages(allImages);
          setCurrentIndex(allImages.length - 1);
          setIsUploading(false);
          
          toast({
            title: "Images uploaded successfully",
            description: `${files.length} image(s) added`,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }, [toast, images, updateImages]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload only image files",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload images smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert image to base64 for persistent storage
      const previewUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      const newImage: UploadedImage = {
        id: Math.random().toString(36).substr(2, 9),
        url: previewUrl, // Now using base64 data URL instead of blob URL
        name: file.name,
        file: file,
      };

      // Update images and notify parent component
      const newImages = [...images, newImage];
      updateImages(newImages);
      setCurrentIndex(newImages.length - 1); // Show newly added image
      
      // TODO: Implement actual upload to object storage here
      // For now, we're just showing the preview
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [images.length, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => handleFileUpload(file));
  };

  const removeImage = (id: string) => {
    const newImages = images.filter(img => img.id !== id);
    // Adjust current index if needed
    if (currentIndex >= newImages.length && newImages.length > 0) {
      setCurrentIndex(newImages.length - 1);
    } else if (newImages.length === 0) {
      setCurrentIndex(0);
    }
    // Update images and notify parent component
    updateImages(newImages);
  };

  const navigateLeft = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  };

  const navigateRight = () => {
    setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  };

  const handleSavePost = () => {
    if (images.length === 0) {
      toast({
        title: "No images to save",
        description: "Please add some images before saving",
        variant: "destructive",
      });
      return;
    }

    const newPost: SavedPost = {
      id: Math.random().toString(36).substr(2, 9),
      images: [...images],
      savedAt: new Date(),
      title: `Image Collection ${savedPosts.length + 1}`,
    };

    setSavedPosts(prev => [...prev, newPost]);
    setCurrentPostId(newPost.id);
    setIsSaved(true);

    toast({
      title: "Post saved successfully",
      description: `${images.length} image(s) saved to your collection`,
    });
  };

  const handleDeletePost = () => {
    if (currentPostId) {
      setSavedPosts(prev => prev.filter(post => post.id !== currentPostId));
      setCurrentPostId(null);
      setIsSaved(false);
      // Only update local state without auto-saving to prevent unwanted saves
      setImages([]);
      setCurrentIndex(0);

      toast({
        title: "Post deleted",
        description: "Your saved post has been deleted",
      });
    }
  };

  const handleSharePost = () => {
    if (currentPostId) {
      // Create a simple share URL or copy link
      const shareText = `Check out my image collection with ${images.length} images!`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Image Collection',
          text: shareText,
        }).catch(() => {
          // Fallback to clipboard
          navigator.clipboard.writeText(shareText);
          toast({
            title: "Link copied to clipboard",
            description: "Share this with your friends!",
          });
        });
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        toast({
          title: "Link copied to clipboard",
          description: "Share this with your friends!",
        });
      }
    }
  };

  const handleEditPost = () => {
    if (currentPostId) {
      setIsSaved(false);
      setCurrentPostId(null);
      
      toast({
        title: "Edit mode enabled",
        description: "You can now add more images and save again",
      });
    }
  };

  const handleAddMoreFromMenu = () => {
    fileInputRef.current?.click();
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const currentImage = images[currentIndex];

  return (
    <Card className="h-full border-2 border-gray-300 dark:border-gray-600 relative overflow-hidden transition-none bg-gray-900">
      <CardContent className="p-0 h-full relative max-h-full flex flex-col">
        {images.length === 0 ? (
          // Empty state - minimal upload trigger
          <div
            ref={dropZoneRef}
            className={`flex-1 flex flex-col items-center justify-center p-6 cursor-pointer ${
              isDragOver 
                ? 'bg-blue-900/30 border-blue-400' 
                : 'bg-gray-900 hover:bg-gray-800'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="image-upload-zone"
          >
            <div className="text-center space-y-3">
              <Plus className="w-12 h-12 mx-auto text-gray-500" />
              <div>
                <p className="text-gray-400 text-sm">Drag images or click to upload</p>
              </div>
            </div>
          </div>
        ) : (
          // Card carousel layout with thumbnails below and curved line
          <>
            {/* Main Card Display Area */}
            <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-visible pt-4">
              {/* Card carousel - show fanned stack */}
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
                      
                      {/* Image label overlay - bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/40 to-transparent p-3">
                        <p className="text-white text-xs font-medium truncate">{img.name}</p>
                      </div>

                      {/* Controls - only on current card */}
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
                                <DropdownMenuItem onClick={() => {
                                  setIsSaved(false);
                                  toast({ title: "Edit mode enabled" });
                                }} className="cursor-pointer hover:bg-gray-700">
                                  <Edit className="w-3 h-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(img.url)} className="cursor-pointer hover:bg-gray-700">
                                  <Copy className="w-3 h-3 mr-2" />
                                  Copy URL
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = img.url;
                                  link.download = img.name || `image_${idx + 1}`;
                                  link.click();
                                }} className="cursor-pointer hover:bg-gray-700">
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

              {/* Navigation */}
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

              {/* Bottom controls for unsaved posts */}
              {!isSaved && (
                <div className="absolute bottom-4 left-4 flex gap-2 z-20">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                    onClick={handleSavePost}
                    disabled={isUploading || images.length === 0}
                    data-testid="button-save-post"
                  >
                    <Save className="w-3 h-3 mr-1" />
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
            </div>

            {/* Thumbnail Cards Row */}
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

            {/* Curved Line Footer */}
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

              {/* Counter Badge */}
              <div className="relative z-10 bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow-lg font-bold text-sm">
                {currentIndex + 1}/{images.length}
              </div>
            </div>
          </>
        )}

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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-none">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 transition-none">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen overlay */}
        {isFullscreen && currentImage && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center transition-none">
            {/* Fullscreen image */}
            <img
              src={currentImage.url}
              alt={currentImage.name}
              className="max-w-full max-h-full object-contain"
              data-testid="img-fullscreen"
            />

            {/* Exit fullscreen button */}
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 right-4 h-10 w-10 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
              onClick={handleExitFullscreen}
              data-testid="button-exit-fullscreen"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>

            {/* Navigation arrows for fullscreen */}
            {images.length > 1 && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
                  onClick={navigateLeft}
                  data-testid="button-fullscreen-nav-left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
                  onClick={navigateRight}
                  data-testid="button-fullscreen-nav-right"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}

            {/* Image counter for fullscreen */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});