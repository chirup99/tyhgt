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
          // Empty state with upload area
          <div
            ref={dropZoneRef}
            className={`flex-1 flex flex-col items-center justify-center p-6 ${
              isDragOver 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' 
                : 'bg-gray-50 dark:bg-gray-900'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-testid="image-upload-zone"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Upload Images
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag & drop images here, or click to browse
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Copy className="w-4 h-4" />
                  <span>Copy-paste images from anywhere</span>
                </div>
              </div>

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-upload-images"
              >
                <Plus className="w-4 h-4 mr-2" />
                Choose Images
              </Button>
            </div>
          </div>
        ) : (
          // New card swiping layout: 80% cards, 20% curved bottom
          <>
            {/* 80% Card Swiping Area */}
            <div className="flex-[4] relative bg-gray-900 flex items-center justify-center overflow-hidden">
              {/* Card stack effect - show current image and 2 behind it */}
              {images.map((img, idx) => {
                const offset = idx - currentIndex;
                if (offset < 0 || offset > 2) return null;
                
                const rotation = offset * 5;
                const translateY = offset * 12;
                const scale = 1 - offset * 0.03;
                const zIndex = 10 - offset;
                
                return (
                  <div
                    key={img.id}
                    className="absolute transition-all duration-300 ease-out"
                    style={{
                      transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
                      zIndex: zIndex,
                    }}
                  >
                    <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl" style={{ width: '320px', height: '420px' }}>
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                        data-testid={`img-card-${idx}`}
                      />
                      
                      {/* Image label overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
                        <p className="text-white text-sm font-medium truncate">{img.name}</p>
                      </div>

                      {/* Top right controls */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        {/* Fullscreen button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
                          onClick={handleFullscreen}
                          data-testid="button-fullscreen"
                        >
                          <Expand className="w-4 h-4" />
                        </Button>

                        {!isSaved ? (
                          // Remove button for unsaved images
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={() => removeImage(img.id)}
                            data-testid={`button-remove-${idx}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          // 3-dot menu for saved images
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-black/70 hover:bg-black/90 text-white border-none"
                                data-testid="button-image-menu"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setIsSaved(false);
                                  toast({
                                    title: "Edit mode enabled",
                                    description: "You can now modify images",
                                  });
                                }}
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Images
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => navigator.clipboard.writeText(img.url)}
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Image URL
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = img.url;
                                  link.download = img.name || `image_${idx + 1}`;
                                  link.click();
                                }}
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Image
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Navigation arrows - positioned in card area */}
              {images.length > 1 && (
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex gap-4 z-20">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-10 w-10 p-0 bg-white/90 hover:bg-white text-gray-800"
                    onClick={navigateLeft}
                    data-testid="button-nav-left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-10 w-10 p-0 bg-white/90 hover:bg-white text-gray-800"
                    onClick={navigateRight}
                    data-testid="button-nav-right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {/* Bottom controls for unsaved posts - inside card area */}
              {!isSaved && (
                <div className="absolute bottom-6 left-6 flex gap-2 z-20">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleSavePost}
                    disabled={isUploading || images.length === 0}
                    data-testid="button-save-post"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-add-more"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {isUploading ? 'Uploading...' : 'Add More'}
                  </Button>
                </div>
              )}
            </div>

            {/* 20% Curved Bottom Counter Section */}
            <div className="flex-1 relative bg-gray-800 flex items-center justify-center overflow-hidden">
              {/* SVG Curved Line */}
              <svg
                className="absolute top-0 left-0 w-full h-full"
                viewBox={`0 0 ${images.length > 0 ? 800 : 800} 120`}
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 50 Q 200 10, 400 30 T 800 50"
                  stroke="#475569"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                />
              </svg>

              {/* Center Counter Badge */}
              {images.length > 0 && (
                <div className="relative z-10 flex items-center justify-center">
                  <div className="bg-white text-gray-900 rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold">
                      {currentIndex + 1}/{images.length}
                    </span>
                  </div>
                </div>
              )}
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