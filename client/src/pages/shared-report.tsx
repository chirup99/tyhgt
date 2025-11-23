import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoHeatmap } from "@/components/DemoHeatmap";
import { X, Copy, ExternalLink, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { VerifiedReport } from "@shared/schema";
import { useState } from "react";

export default function SharedReport() {
  const { reportId } = useParams<{ reportId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentUser } = useCurrentUser();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: reportData, isLoading, error } = useQuery<{ success: boolean; report: VerifiedReport }>({
    queryKey: ['/api/verified-reports', reportId],
    queryFn: async () => {
      const response = await fetch(`/api/verified-reports/${reportId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch verified report');
      }
      return response.json();
    },
    enabled: !!reportId,
  });

  const handleClose = () => {
    if (currentUser) {
      setLocation('/home');
    } else {
      setLocation('/');
    }
  };

  const handleCopyUrl = () => {
    if (reportData?.report.shareUrl) {
      navigator.clipboard.writeText(reportData.report.shareUrl);
      toast({
        title: "Link copied!",
        description: "Shareable URL copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
              <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-75" />
              <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-150" />
            </div>
            <p className="text-center mt-4 text-muted-foreground">Loading report...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !reportData?.success) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-destructive">Report Not Found</CardTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClose}
                data-testid="button-close-error"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This report may have expired or does not exist. Shareable reports are valid for 7 days.
            </p>
            <Button
              className="mt-4"
              onClick={handleClose}
              data-testid="button-return-home"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { report } = reportData;
  const { username, reportData: data, shareUrl, createdAt, expiresAt, views } = report;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="w-full max-w-6xl my-8">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle data-testid="text-report-title">Trading Report</CardTitle>
                  <p className="text-sm text-muted-foreground" data-testid="text-report-owner">
                    by {username}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClose}
                data-testid="button-close-report"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Report Metadata */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span data-testid="text-views">
                  {views} {views === 1 ? 'view' : 'views'}
                </span>
                <span data-testid="text-created-date">
                  Created {new Date(createdAt).toLocaleDateString()}
                </span>
                <span data-testid="text-expires-date">
                  Expires {new Date(expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Share URL */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    data-testid="input-share-url"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUrl}
                    data-testid="button-copy-url"
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trading Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trading Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.totalTrades !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="text-2xl font-bold" data-testid="text-total-trades">
                        {data.totalTrades}
                      </p>
                    </div>
                  )}
                  {data.winRate !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-2xl font-bold" data-testid="text-win-rate">
                        {data.winRate}%
                      </p>
                    </div>
                  )}
                  {data.totalPnL !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Total P&L</p>
                      <p
                        className={`text-2xl font-bold ${
                          data.totalPnL >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                        }`}
                        data-testid="text-total-pnl"
                      >
                        {data.totalPnL >= 0 ? '+' : ''}
                        {data.totalPnL.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {data.fomoCount !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">FOMO Trades</p>
                      <p className="text-2xl font-bold" data-testid="text-fomo-count">
                        {data.fomoCount}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trading Heatmap */}
            {data.tradingDataByDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Trading Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DemoHeatmap
                    tradingDataByDate={data.tradingDataByDate}
                    selectedDate={selectedDate}
                    onDateSelect={(date) => setSelectedDate(date)}
                    isPublicView={true}
                  />
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
