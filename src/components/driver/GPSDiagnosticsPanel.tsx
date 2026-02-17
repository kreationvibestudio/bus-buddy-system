import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Signal,
  SignalHigh,
  SignalLow,
  Loader2,
  RefreshCw,
  ExternalLink,
  Smartphone,
  MapPin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GPSDiagnostics {
  stage: string;
  permissionStatus: string;
  lastFixAge: number | null;
  fixCount: number;
  lastSendResult: 'success' | 'error' | 'pending' | null;
  lastSendTime: number | null;
  lastError: string | null;
  watchAttempts: number;
  provider: string;
}

interface GPSPosition {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number;
  timestamp: number;
}

interface GPSDiagnosticsPanelProps {
  diagnostics: GPSDiagnostics;
  position: GPSPosition | null;
  isTracking: boolean;
  isNative: boolean;
  onRefreshPosition: () => void;
  onRequestPermissions: () => void;
}

export default function GPSDiagnosticsPanel({
  diagnostics,
  position,
  isTracking,
  isNative,
  onRefreshPosition,
  onRequestPermissions,
}: GPSDiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStageInfo = () => {
    switch (diagnostics.stage) {
      case 'idle':
        return { label: 'Idle', color: 'bg-muted text-muted-foreground', icon: Signal };
      case 'warming_up':
        return { label: 'Warming Up', color: 'bg-warning text-warning-foreground', icon: Loader2 };
      case 'acquiring':
        return { label: 'Acquiring Signal', color: 'bg-warning text-warning-foreground', icon: SignalLow };
      case 'tracking':
        return { label: 'Tracking', color: 'bg-success text-success-foreground', icon: SignalHigh };
      case 'error':
        return { label: 'Error', color: 'bg-destructive text-destructive-foreground', icon: XCircle };
      default:
        return { label: diagnostics.stage, color: 'bg-muted text-muted-foreground', icon: Signal };
    }
  };

  const stageInfo = getStageInfo();
  const StageIcon = stageInfo.icon;

  const getPermissionBadge = () => {
    switch (diagnostics.permissionStatus) {
      case 'granted':
        return <Badge variant="outline" className="text-success border-success gap-1"><CheckCircle2 className="h-3 w-3" />Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Denied</Badge>;
      case 'prompt':
        return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" />Needs Permission</Badge>;
      default:
        return <Badge variant="outline">{diagnostics.permissionStatus}</Badge>;
    }
  };

  const getSendResultBadge = () => {
    switch (diagnostics.lastSendResult) {
      case 'success':
        return <Badge variant="outline" className="text-success border-success gap-1"><CheckCircle2 className="h-3 w-3" />Success</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />Sending</Badge>;
      default:
        return <Badge variant="outline">Not sent</Badge>;
    }
  };

  const formatFixAge = (seconds: number | null) => {
    if (seconds === null) return 'Never';
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    return `${Math.round(seconds / 3600)}h ago`;
  };

  const getAccuracyLevel = (accuracy: number) => {
    if (accuracy < 10) return { label: 'Excellent', color: 'text-success' };
    if (accuracy < 30) return { label: 'Good', color: 'text-success' };
    if (accuracy < 100) return { label: 'Fair', color: 'text-warning' };
    return { label: 'Poor', color: 'text-destructive' };
  };

  const openDeviceSettings = () => {
    // This opens the app settings on Android/iOS
    // On web, we'll just show an alert
    if (isNative) {
      // For Capacitor, we'd need a plugin like @capacitor/app-launcher
      // For now, show instructions
      alert('Please open your device Settings > Apps > EagleLine > Permissions > Location and enable "Allow all the time" or "While using the app"');
    } else {
      alert('Please enable location in your browser settings');
    }
  };

  return (
    <Card className="border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">GPS Diagnostics</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${stageInfo.color} gap-1`}>
                  <StageIcon className={`h-3 w-3 ${diagnostics.stage === 'warming_up' ? 'animate-spin' : ''}`} />
                  {stageInfo.label}
                </Badge>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onRefreshPosition}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Force GPS Fix
              </Button>
              {diagnostics.permissionStatus !== 'granted' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onRequestPermissions}
                  className="gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  Request Permission
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={openDeviceSettings}
                className="gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Device Settings
              </Button>
            </div>

            <Separator />

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Permission</span>
                <div>{getPermissionBadge()}</div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Platform</span>
                <div className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  <span>{isNative ? 'Native (Capacitor)' : 'Web Browser'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">GPS Provider</span>
                <Badge variant="outline" className="capitalize">{diagnostics.provider}</Badge>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Fix Count</span>
                <span className="font-mono">{diagnostics.fixCount}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Last Fix</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatFixAge(diagnostics.lastFixAge)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Watch Attempts</span>
                <span className="font-mono">{diagnostics.watchAttempts}</span>
              </div>
            </div>

            <Separator />

            {/* Backend Send Status */}
            <div className="space-y-2">
              <span className="text-muted-foreground text-xs">Backend Transmission</span>
              <div className="flex items-center gap-3">
                {getSendResultBadge()}
                {diagnostics.lastSendTime && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(diagnostics.lastSendTime, { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>

            {/* Current Position Details */}
            {position && (
              <>
                <Separator />
                <div className="space-y-2">
                  <span className="text-muted-foreground text-xs">Current Position</span>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 p-2 rounded">
                    <div>
                      <span className="text-muted-foreground">Lat:</span>{' '}
                      <span className="font-mono">{position.latitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lng:</span>{' '}
                      <span className="font-mono">{position.longitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Speed:</span>{' '}
                      <span className="font-mono">
                        {position.speed != null ? `${(position.speed * 3.6).toFixed(1)} km/h` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Heading:</span>{' '}
                      <span className="font-mono">
                        {position.heading != null ? `${position.heading.toFixed(0)}°` : 'N/A'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Accuracy:</span>{' '}
                      <span className={`font-mono ${getAccuracyLevel(position.accuracy).color}`}>
                        {position.accuracy.toFixed(0)}m ({getAccuracyLevel(position.accuracy).label})
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Error Display */}
            {diagnostics.lastError && (
              <>
                <Separator />
                <div className="bg-destructive/10 text-destructive text-xs p-2 rounded">
                  <strong>Last Error:</strong> {diagnostics.lastError}
                </div>
              </>
            )}

            {/* Troubleshooting Checklist */}
            <Separator />
            <div className="space-y-2">
              <span className="text-muted-foreground text-xs font-medium">Troubleshooting Checklist</span>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Turn on Location (GPS) in device settings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Set Location accuracy to "High" or enable "Google Location Accuracy"
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Allow "Precise location" for this app
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Disable battery optimization for this app
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Go outside or near a window for better GPS signal
                </li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
