import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export function MonthlyProgressTracker() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-5 w-5" />
          Historical Data Collection
        </CardTitle>
        <CardDescription>Data collection feature disabled</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-8 space-y-3">
          <Database className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            Firebase data collection has been disabled.
          </p>
          <p className="text-xs text-muted-foreground">
            Historical data collection and storage features are no longer active.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}