import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PersonalHeatmap } from "@/components/PersonalHeatmap";
import { auth } from "@/firebase";
import { useLocation } from "wouter";

export default function PublicHeatmap() {
  const [, params] = useRoute("/share/heatmap/:userId");
  const userId = params?.userId || "";
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Fetch public heatmap data
    const fetchHeatmapData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/user-journal/${userId}/all`);
        if (response.ok) {
          const data = await response.json();
          setHeatmapData(data);
        }
      } catch (error) {
        console.error("Error fetching heatmap data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchHeatmapData();
    }
  }, [userId]);

  const handleClose = () => {
    // If user is not authenticated, show sign-in dialog
    if (!currentUser) {
      setShowSignInDialog(true);
    } else {
      // If authenticated, go to their dashboard
      setLocation("/");
    }
  };

  const handleSignIn = () => {
    setLocation("/login");
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/share/heatmap/${userId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share this link with anyone to showcase your trading calendar",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header with close and share */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-md hover-elevate"
              data-testid="button-close-public-heatmap"
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Perala Watermark */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full shadow-md">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <span className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                perala
              </span>
            </div>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleCopyLink}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            data-testid="button-copy-share-link"
          >
            <LinkIcon className="h-4 w-4" />
            Share Link
          </Button>
        </div>

        {/* Heatmap Container - Scrollable */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 overflow-auto max-h-[calc(100vh-12rem)]">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Trading Calendar
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Public trading performance view
            </p>
          </div>

          <PersonalHeatmap
            userId={userId}
            onDateSelect={() => {}}
            selectedDate={null}
            isPublicView={true}
          />
        </div>

        {/* Promotional footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Track your trading journey with perala
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/login")}
            className="hover-elevate"
            data-testid="button-get-started"
          >
            Get Started Free
          </Button>
        </div>
      </div>

      {/* Sign-in Dialog */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              Create your free account to start tracking your trading performance with perala
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleSignIn}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="button-sign-in-dialog"
            >
              Sign In / Sign Up
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowSignInDialog(false)}
              data-testid="button-cancel-sign-in"
            >
              Continue Browsing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
