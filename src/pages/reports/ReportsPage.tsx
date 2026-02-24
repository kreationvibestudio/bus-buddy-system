import { useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Bus, Ticket, Banknote, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { useBookings } from '@/hooks/useBookings';
import { useBuses } from '@/hooks/useBuses';
import { useDrivers } from '@/hooks/useDrivers';
import { useTransactions } from '@/hooks/useAccounts';
import { formatCurrency } from '@/lib/currency';
import { format, subMonths, startOfMonth } from 'date-fns';

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  success: 'hsl(var(--success))',
};

export default function ReportsPage() {
  const { data: bookings } = useBookings();
  const { data: buses } = useBuses();
  const { data: drivers } = useDrivers();
  const { data: transactions } = useTransactions();
  const reportRef = useRef<HTMLDivElement>(null);

  const totalRevenue = transactions
    ?.filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

  const totalExpenses = transactions
    ?.filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

  // Route performance from actual bookings (by route)
  const routePerformance = useMemo(() => {
    if (!bookings?.length) return [];
    const byRoute: Record<string, { bookings: number; revenue: number }> = {};
    bookings
      .filter((b: any) => b.status !== 'cancelled')
      .forEach((b: any) => {
        const route = b.trip?.route;
        const name = route
          ? `${route.origin || 'Origin'}–${route.destination || 'Destination'}`
          : 'Unknown route';
        if (!byRoute[name]) byRoute[name] = { bookings: 0, revenue: 0 };
        byRoute[name].bookings += 1;
        byRoute[name].revenue += Number(b.total_fare) || 0;
      });
    return Object.entries(byRoute)
      .map(([name, d]) => ({ name, bookings: d.bookings, revenue: d.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12);
  }, [bookings]);

  // Monthly revenue and bookings (last 6 months from bookings)
  const monthlyRevenue = useMemo(() => {
    const months: { month: string; revenue: number; bookings: number; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months.push({
        key: format(d, 'yyyy-MM'),
        month: format(d, 'MMM'),
        revenue: 0,
        bookings: 0,
      });
    }
    const start = startOfMonth(subMonths(new Date(), 5));
    (bookings || [])
      .filter((b: any) => b.status !== 'cancelled')
      .forEach((b: any) => {
        const d = new Date(b.booked_at);
        if (d < start) return;
        const key = format(d, 'yyyy-MM');
        const row = months.find((m) => m.key === key);
        if (row) {
          row.bookings += 1;
          row.revenue += Number((b as any).total_fare) || 0;
        }
      });
    return months.map(({ month, revenue, bookings: count }) => ({ month, revenue, bookings: count }));
  }, [bookings]);

  // Bus utilization from actual buses
  const busUtilization = useMemo(() => {
    if (!buses?.length) {
      return [
        { name: 'Active', value: 0, color: CHART_COLORS.primary },
        { name: 'Maintenance', value: 0, color: CHART_COLORS.warning },
        { name: 'Out of Service', value: 0, color: CHART_COLORS.destructive },
      ];
    }
    const active = buses.filter((b: any) => b.status === 'active').length;
    const maintenance = buses.filter((b: any) => b.status === 'maintenance').length;
    const out = buses.filter((b: any) => b.status === 'out_of_service' || (b.status && b.status !== 'active' && b.status !== 'maintenance')).length;
    const list = [
      { name: 'Active', value: active, color: CHART_COLORS.primary },
      { name: 'Maintenance', value: maintenance, color: CHART_COLORS.warning },
      { name: 'Out of Service', value: out || 0, color: CHART_COLORS.destructive },
    ];
    return list.some((d) => d.value > 0) ? list.filter((d) => d.value > 0) : list;
  }, [buses]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div ref={reportRef} className="reports-print-area space-y-6 animate-fade-in">
      <style>{`
        @media print {
          [data-sidebar="sidebar"] { display: none !important; }
          header[class*="flex"][class*="h-14"] { display: none !important; }
          .reports-print-area { padding: 0 !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Insights and performance metrics for your fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="6months">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 print:hidden">
            <Printer className="h-4 w-4" />
            Print report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <Banknote className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-success mt-1">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <Ticket className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings?.length || 0}</div>
            <p className="text-xs text-success mt-1">+8.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Buses</CardTitle>
            <Bus className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buses?.filter((b: any) => b.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {buses?.length || 0} total buses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Drivers</CardTitle>
            <Users className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers?.filter((d: any) => d.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {drivers?.length || 0} total drivers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="routes">Route Performance</TabsTrigger>
          <TabsTrigger value="fleet">Fleet Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Revenue Trend
                </CardTitle>
                <CardDescription>Revenue and booking trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Monthly Bookings
                </CardTitle>
                <CardDescription>Number of bookings per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Performance</CardTitle>
              <CardDescription>Bookings and revenue by route</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={routePerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" name="Bookings" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" name="Revenue (₦)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bus Status Distribution</CardTitle>
                <CardDescription>Current status of your fleet</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={busUtilization}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {busUtilization.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fleet Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
                  <span>Average Trip Duration</span>
                  <span className="font-bold">4.5 hours</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
                  <span>Fleet Utilization Rate</span>
                  <span className="font-bold text-success">78%</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
                  <span>Average Occupancy</span>
                  <span className="font-bold">85%</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
                  <span>On-Time Performance</span>
                  <span className="font-bold text-success">92%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
