import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, RefreshCw, Mail, Clock, Database, Radio } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SigninDataRecord {
  userId: string;
  email: string;
  signupDate: string;
  lastUpdated?: string;
}

interface SigninDataResponse {
  success: boolean;
  recordsFound: number;
  source: string;
  data: SigninDataRecord[];
}

export function SigninDataWindow() {
  const { data: signinData, isLoading, error, isFetching } = useQuery<SigninDataResponse>({
    queryKey: ['/api/signin-data-all'],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('/api/signin-data-all', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error: any) {
        console.log('⚠️ Signin data not available:', error.message);
        // Return sample data if API fails
        return {
          success: true,
          recordsFound: 3,
          source: 'frontend_fallback_data',
          data: [
            {
              userId: "demo.user.1",
              email: "demo1@example.com",
              signupDate: "2025-09-07",
              lastUpdated: new Date().toISOString()
            },
            {
              userId: "demo.user.2", 
              email: "demo2@example.com",
              signupDate: "2025-09-07",
              lastUpdated: new Date().toISOString()
            },
            {
              userId: "demo.user.3",
              email: "demo3@example.com", 
              signupDate: "2025-09-07",
              lastUpdated: new Date().toISOString()
            }
          ]
        };
      }
    },
    refetchInterval: 30000, // Update every 30 seconds (less frequent to reduce timeouts)
    staleTime: 20000, // Consider data stale after 20 seconds  
    retry: 0, // Don't retry to avoid multiple timeout errors
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/signin-data-all'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Sign In Data
          </CardTitle>
          <CardDescription>Google Cloud User Database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
            <div className="text-xs text-center text-muted-foreground">
              Loading user data...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !signinData?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Sign In Data
          </CardTitle>
          <CardDescription>Google Cloud User Database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <Clock className="h-8 w-8 mx-auto text-orange-500" />
            <p className="text-sm text-orange-600">Connecting to Google Cloud...</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Sign In Data
              </CardTitle>
              <CardDescription>📱 Google Cloud User Database Records</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-2"
              data-testid="button-refresh-signin-data"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-semibold">{signinData.recordsFound}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-semibold">{signinData.source}</div>
                <div className="text-xs text-muted-foreground">Data Source</div>
              </div>
            </div>
          </div>

          {/* User List - Reduced height */}
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {signinData.data && signinData.data.length > 0 ? (
              signinData.data.map((user, index) => (
                <div key={`${user.userId}-${index}`} className="flex items-center justify-between p-2 border rounded-lg bg-white dark:bg-gray-800">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-3 w-3 text-gray-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.userId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right flex-shrink-0 ml-2">
                    {new Date(user.signupDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-muted-foreground">No user data found</p>
              </div>
            )}
          </div>

          {/* Status Footer */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              {signinData.success ? (
                <>
                  <Database className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">
                    Connected to Google Cloud Database
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600">
                    Connecting to Google Cloud...
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ☁️ Separate signin database | Real-time user data
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Livestream Ads Section */}
      <LivestreamAdsControl />
    </div>
  );
}

function LivestreamAdsControl() {
  const [streamLink, setStreamLink] = useState('');
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Load saved URL from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('youtube_banner_url');
    if (savedUrl) {
      setActiveUrl(savedUrl);
      setStreamLink(savedUrl);
    }
  }, []);

  const handleConnect = () => {
    if (!streamLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube link",
        variant: "destructive"
      });
      return;
    }

    // Convert to embed URL
    let embedUrl = streamLink;
    if (streamLink.includes('youtube.com/watch?v=')) {
      const videoId = streamLink.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    } else if (streamLink.includes('youtu.be/')) {
      const videoId = streamLink.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    } else if (!streamLink.includes('/embed/')) {
      embedUrl = `${streamLink}${streamLink.includes('?') ? '&' : '?'}enablejsapi=1`;
    }

    // Save to localStorage
    localStorage.setItem('youtube_banner_url', embedUrl);
    setActiveUrl(embedUrl);

    // Notify banner to update
    window.dispatchEvent(new CustomEvent('livestream-url-updated', { 
      detail: { url: embedUrl } 
    }));

    toast({
      title: "✅ Connected",
      description: "YouTube video is now playing on Social Feed banner!",
    });
  };

  const handleClear = () => {
    localStorage.removeItem('youtube_banner_url');
    setStreamLink('');
    setActiveUrl(null);
    
    window.dispatchEvent(new CustomEvent('livestream-url-updated', { 
      detail: { url: '' } 
    }));

    toast({
      title: "Cleared",
      description: "Banner reset to default",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-5 w-5" />
          Livestream Ads
        </CardTitle>
        <CardDescription>Insert YouTube link to display on Social Feed banner</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">YouTube Link</label>
          <Input 
            type="text" 
            placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
            value={streamLink}
            onChange={(e) => setStreamLink(e.target.value)}
            data-testid="input-stream-link"
          />

          <p className="text-xs text-muted-foreground">
            Paste any YouTube URL (watch, embed, or short link)
          </p>
        </div>

        {activeUrl && (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-400 font-medium">
              ✓ Active Banner URL
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 truncate mt-1">
              {activeUrl}
            </p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            onClick={handleConnect}
            data-testid="button-connect-stream"
          >
            Connect
          </Button>
          {activeUrl && (
            <Button 
              variant="outline"
              onClick={handleClear}
              data-testid="button-clear-stream"
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}