import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetStats, getGetStatsQueryKey, useGetPopularRoutes, getGetPopularRoutesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Users, Bus, Ticket, TrendingUp, Map } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: stats, isLoading: statsLoading } = useGetStats({
    query: {
      enabled: !!user && user.role === "ADMIN",
      queryKey: getGetStatsQueryKey()
    }
  });

  const { data: routes, isLoading: routesLoading } = useGetPopularRoutes({
    query: {
      enabled: !!user && user.role === "ADMIN",
      queryKey: getGetPopularRoutesQueryKey()
    }
  });

  if (!user || user.role !== "ADMIN") return null;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Overview of platform activity and metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Buses" 
            value={stats?.totalBuses} 
            loading={statsLoading} 
            icon={<Bus className="w-5 h-5 text-blue-600" />} 
            trend="+12% from last month"
          />
          <StatCard 
            title="Total Bookings" 
            value={stats?.totalBookings} 
            loading={statsLoading} 
            icon={<Ticket className="w-5 h-5 text-emerald-600" />} 
            trend="+24% from last month"
          />
          <StatCard 
            title="Total Users" 
            value={stats?.totalUsers} 
            loading={statsLoading} 
            icon={<Users className="w-5 h-5 text-purple-600" />} 
            trend="+8% from last month"
          />
          <StatCard 
            title="Active Routes" 
            value={stats?.activeRoutes} 
            loading={statsLoading} 
            icon={<Map className="w-5 h-5 text-orange-600" />} 
            trend="Stable"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Popular Routes
              </CardTitle>
              <CardDescription>Most frequently booked destinations</CardDescription>
            </CardHeader>
            <CardContent>
              {routesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {routes?.map((route, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          #{i + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{route.fromLocation} to {route.toLocation}</div>
                          <div className="text-sm text-gray-500">{route.busCount} buses on this route</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-primary">{route.bookingCount}</div>
                        <div className="text-xs text-gray-500 uppercase">Bookings</div>
                      </div>
                    </div>
                  ))}
                  {routes?.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No route data available yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="secondary" 
                className="w-full justify-start h-12"
                onClick={() => setLocation("/admin/buses")}
              >
                <Bus className="w-4 h-4 mr-3" /> Manage Buses
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-start h-12"
                onClick={() => setLocation("/admin/bookings")}
              >
                <Ticket className="w-4 h-4 mr-3" /> View All Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, loading, icon, trend }: { title: string, value?: number, loading: boolean, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-gray-900" data-testid={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}>
                {value?.toLocaleString() || 0}
              </p>
            )}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500 flex items-center gap-1">
          {trend}
        </div>
      </CardContent>
    </Card>
  );
}
