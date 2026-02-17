import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowRight, Clock } from 'lucide-react';
import { usePendingApprovals } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export function PendingApprovalsWidget() {
  const { role } = useAuth();
  const { data: pendingItems = [], isLoading } = usePendingApprovals();
  const navigate = useNavigate();

  if (role !== 'admin' && role !== 'storekeeper') {
    return null;
  }

  const title = role === 'admin' ? 'Pending Approvals' : 'Ready to Dispatch';
  const description = role === 'admin' 
    ? 'Parts requests awaiting your approval' 
    : 'Admin-approved requests ready for dispatch';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={pendingItems.length > 0 ? 'border-warning/50 bg-warning/5' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Package className={`h-5 w-5 ${pendingItems.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
          {title}
          {pendingItems.length > 0 && (
            <span className="ml-auto bg-warning text-warning-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingItems.length}
            </span>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending items</p>
        ) : (
          <div className="space-y-3">
            {pendingItems.slice(0, 3).map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-background border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {item.quantity_requested}x {item.inventory_items?.name || 'Item'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {pendingItems.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{pendingItems.length - 3} more items
              </p>
            )}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => navigate('/inventory')}
            >
              View All Requests
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
