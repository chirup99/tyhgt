import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Radio } from "lucide-react";

export function LivestreamAds() {
  const [streamUrl, setStreamUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (streamUrl.trim()) {
      setIsConnected(true);
      console.log("Connecting to livestream:", streamUrl);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          Livestream Ads
        </CardTitle>
        <CardDescription>
          Insert livestream link to display advertisements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stream-link" data-testid="label-stream-link">
            Stream Link
          </Label>
          <Input
            id="stream-link"
            type="url"
            placeholder="https://example.com/livestream"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            disabled={isConnected}
            data-testid="input-stream-link"
          />
        </div>
        
        <Button
          onClick={handleConnect}
          disabled={!streamUrl.trim() || isConnected}
          className="w-full"
          data-testid="button-connect-stream"
        >
          {isConnected ? "Connected" : "Connect"}
        </Button>

        {isConnected && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Livestream connected: {streamUrl}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
