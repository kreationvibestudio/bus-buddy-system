import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench, Clock, Package, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { useRecentCompletedJobCards, useOverdueJobCards, useMechanicStats } from '@/hooks/useMechanicDashboard';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function MechanicDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useMechanicStats();
  const { data: recentCompleted, isLoading: recentLoading } = useRecentCompletedJobCards(5);
  const { data: overdueCards, isLoading: overdueLoading } = useOverdueJobCards();

  const mechanicStats = [
    { 
      title: 'Active Job Cards', 
      value: stats?.activeCount || 0, 
      icon: Wrench, 
      color: 'text-primary',
      description: 'Assigned to you'
    },
    { 
      title: 'In Progress', 
      value: stats?.inProgressCount || 0, 
      icon: Clock, 
      color: 'text-warning',
      description: 'Currently working on'
    },
    { 
      title: 'Awaiting Parts', 
      value: stats?.awaitingPartsCount || 0, 
      icon: Package, 
      color: 'text-info',
      description: 'Waiting for parts'
    },
    { 
      title: 'Completed This Week', 
      value: stats?.completedThisWeek || 0, 
      icon: CheckCircle, 
      color: 'text-success',
      description: 'Great work!'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Mechanic'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your workshop overview for today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-20 mt-1" />
              </CardContent>
            </Card>
          ))
        ) : (
          mechanicStats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button onClick={() => navigate('/job-cards')} className="gap-2">
          <Wrench className="h-4 w-4" />
          View Job Cards
        </Button>
        <Button variant="outline" onClick={() => navigate('/maintenance')} className="gap-2">
          <Clock className="h-4 w-4" />
          Maintenance Records
        </Button>
        <Button variant="outline" onClick={() => navigate('/inventory')} className="gap-2">
          <Package className="h-4 w-4" />
          Request Parts
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Completed Job Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Completions
            </CardTitle>
            <CardDescription>Job cards you've recently completed</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <Skeleton className="h-2 w-2 rounded-full mt-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48 mt-1" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentCompleted && recentCompleted.length > 0 ? (
              <div className="space-y-4">
                {recentCompleted.map((jobCard) => (
                  <div key={jobCard.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="h-2 w-2 rounded-full bg-success mt-2" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{jobCard.job_card_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {jobCard.bus?.registration_number} - {jobCard.reason_for_visit}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {jobCard.actual_completion 
                          ? formatDistanceToNow(new Date(jobCard.actual_completion), { addSuffix: true })
                          : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No completed job cards yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Overdue Job Cards Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerts & Reminders
            </CardTitle>
            <CardDescription>Job cards open for more than 2 days</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueLoading ? (
              <div className="space-y-3">
                {Array(2).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : overdueCards && overdueCards.length > 0 ? (
              <div className="space-y-3">
                {overdueCards.slice(0, 5).map((jobCard) => (
                  <div 
                    key={jobCard.id} 
                    className="p-3 rounded-lg bg-warning/10 border border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors"
                    onClick={() => navigate('/job-cards')}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{jobCard.job_card_number}</p>
                      <Badge variant="outline" className="text-xs">
                        {jobCard.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {jobCard.bus?.registration_number} - {jobCard.reason_for_visit}
                    </p>
                    <p className="text-xs text-warning mt-1">
                      Open for {formatDistanceToNow(new Date(jobCard.created_at))}
                    </p>
                  </div>
                ))}
                {overdueCards.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{overdueCards.length - 5} more overdue job cards
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="font-medium text-sm text-success">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No job cards are overdue
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
