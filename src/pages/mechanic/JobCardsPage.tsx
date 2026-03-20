import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useJobCards, JobCard, JobCardStatus } from '@/hooks/useJobCards';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, FileText, Clock, AlertCircle, CheckCircle2, Pause } from 'lucide-react';
import { CreateJobCardDialog } from '@/components/mechanic/CreateJobCardDialog';
import { JobCardDetail } from '@/components/mechanic/JobCardDetail';
import { format } from 'date-fns';

const statusConfig: Record<JobCardStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: <FileText className="h-3 w-3" /> },
  inspection_complete: { label: 'Inspected', variant: 'outline', icon: <CheckCircle2 className="h-3 w-3" /> },
  in_progress: { label: 'In Progress', variant: 'default', icon: <Clock className="h-3 w-3" /> },
  awaiting_parts: { label: 'Awaiting Parts', variant: 'destructive', icon: <Pause className="h-3 w-3" /> },
  completed: { label: 'Completed', variant: 'outline', icon: <CheckCircle2 className="h-3 w-3" /> },
  closed: { label: 'Closed', variant: 'secondary', icon: <CheckCircle2 className="h-3 w-3" /> },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-600' },
  high: { label: 'High', className: 'bg-orange-500/20 text-orange-600' },
  urgent: { label: 'Urgent', className: 'bg-destructive/20 text-destructive' },
};

export default function JobCardsPage() {
  const { role } = useAuth();
  const { data: jobCards, isLoading } = useJobCards();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);

  const filteredJobCards = jobCards?.filter((jc) => {
    const matchesSearch = 
      jc.job_card_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jc.buses?.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jc.reason_for_visit.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || jc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: jobCards?.length || 0,
    draft: jobCards?.filter(jc => jc.status === 'draft').length || 0,
    inProgress: jobCards?.filter(jc => jc.status === 'in_progress').length || 0,
    awaitingParts: jobCards?.filter(jc => jc.status === 'awaiting_parts').length || 0,
    completed: jobCards?.filter(jc => jc.status === 'completed' || jc.status === 'closed').length || 0,
  };

  if (selectedJobCard) {
    return (
      <JobCardDetail 
        jobCard={selectedJobCard} 
        onBack={() => setSelectedJobCard(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Cards</h1>
          <p className="text-muted-foreground">
            Manage vehicle intake, inspections, and repairs
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Job Card
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draft</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{stats.draft}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl text-primary">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting Parts</CardDescription>
            <CardTitle className="text-2xl text-destructive">{stats.awaitingParts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by job card number, vehicle, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inspection_complete">Inspected</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Job Cards List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading job cards...
            </CardContent>
          </Card>
        ) : filteredJobCards.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No job cards found. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          filteredJobCards.map((jobCard) => (
            <Card 
              key={jobCard.id} 
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setSelectedJobCard(jobCard)}
            >
              <CardContent className="py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{jobCard.job_card_number}</span>
                      <Badge variant={statusConfig[jobCard.status].variant} className="gap-1">
                        {statusConfig[jobCard.status].icon}
                        {statusConfig[jobCard.status].label}
                      </Badge>
                      <Badge className={priorityConfig[jobCard.priority]?.className || ''}>
                        {priorityConfig[jobCard.priority]?.label || jobCard.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {jobCard.buses?.registration_number} - {jobCard.buses?.manufacturer} {jobCard.buses?.model}
                    </p>
                    <p className="text-sm">{jobCard.reason_for_visit}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                    <span>Odometer: {jobCard.odometer_reading.toLocaleString()} km</span>
                    <span>{format(new Date(jobCard.created_at), 'PPp')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateJobCardDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={(newJobCard) => {
          setCreateDialogOpen(false);
          setSelectedJobCard(newJobCard);
        }}
      />
    </div>
  );
}
