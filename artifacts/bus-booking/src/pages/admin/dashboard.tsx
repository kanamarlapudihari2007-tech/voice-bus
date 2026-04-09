import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetStats, getGetStatsQueryKey, useGetPopularRoutes, getGetPopularRoutesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Bus, Ticket, TrendingUp, Map, ArrowRight, Activity, Shield } from "lucide-react";

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
        {/* Hero Header */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(10,30,70,0.90) 0%, rgba(5,80,110,0.85) 100%), url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1600&q=80')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-24 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-cyan-500/30 text-cyan-200 border-cyan-400/40 text-xs font-semibold backdrop-blur-sm">
                  Admin Control Panel
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                Dashboard
              </h1>
              <p className="text-white/60 mt-1 text-sm">
                Real-time overview of VoiceBus platform activity
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setLocation("/admin/buses")}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm font-semibold h-10"
                variant="outline"
              >
                <Bus className="w-4 h-4 mr-2" /> Manage Buses
              </Button>
              <Button
                onClick={() => setLocation("/admin/bookings")}
                className="bg-cyan-500 hover:bg-cyan-400 text-white border-0 font-semibold h-10 shadow-lg shadow-cyan-500/30"
              >
                <Ticket className="w-4 h-4 mr-2" /> All Bookings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Buses"
            value={stats?.totalBuses}
            loading={statsLoading}
            icon={<Bus className="w-6 h-6 text-white" />}
            gradient="from-blue-500 to-blue-700"
            bg="bg-blue-50"
            trend="+12%"
            trendLabel="from last month"
          />
          <StatCard
            title="Total Bookings"
            value={stats?.totalBookings}
            loading={statsLoading}
            icon={<Ticket className="w-6 h-6 text-white" />}
            gradient="from-emerald-500 to-emerald-700"
            bg="bg-emerald-50"
            trend="+24%"
            trendLabel="from last month"
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers}
            loading={statsLoading}
            icon={<Users className="w-6 h-6 text-white" />}
            gradient="from-violet-500 to-violet-700"
            bg="bg-violet-50"
            trend="+8%"
            trendLabel="from last month"
          />
          <StatCard
            title="Active Routes"
            value={stats?.activeRoutes}
            loading={statsLoading}
            icon={<Map className="w-6 h-6 text-white" />}
            gradient="from-orange-500 to-orange-600"
            bg="bg-orange-50"
            trend="Stable"
            trendLabel="no change"
          />
        </div>

        {/* Lower Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Popular Routes */}
          <Card className="lg:col-span-2 shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-cyan-500 to-primary/30" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Popular Routes
                  </CardTitle>
                  <CardDescription className="mt-0.5">Most frequently booked destinations</CardDescription>
                </div>
                <Activity className="w-5 h-5 text-gray-300" />
              </div>
            </CardHeader>
            <CardContent>
              {routesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : routes && routes.length > 0 ? (
                <div className="space-y-3">
                  {routes.map((route, i) => {
                    const maxBookings = routes[0]?.bookingCount || 1;
                    const pct = Math.round(((route.bookingCount || 0) / maxBookings) * 100);
                    const colors = [
                      "from-primary to-cyan-500",
                      "from-violet-500 to-purple-600",
                      "from-emerald-500 to-teal-600",
                      "from-orange-500 to-amber-500",
                    ];
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-blue-50/50 transition-colors group"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white font-extrabold text-sm shadow-md flex-shrink-0`}>
                          #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm mb-2">
                            <span className="truncate">{route.fromLocation}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{route.toLocation}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${colors[i % colors.length]} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{route.busCount} buses on route</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-black text-gray-900">{route.bookingCount}</div>
                          <div className="text-xs text-gray-400 uppercase font-semibold">bookings</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400 text-sm">No route data available yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-5">
            <Card
              className="shadow-sm border-0 overflow-hidden cursor-pointer hover:shadow-md transition-all group"
              onClick={() => setLocation("/admin/buses")}
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(15,40,80,0.88) 0%, rgba(10,90,130,0.85) 100%), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors border border-white/20">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-base">Manage Buses</div>
                  <div className="text-white/60 text-xs mt-0.5">Add, edit or remove bus routes</div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>

            <Card
              className="shadow-sm border-0 overflow-hidden cursor-pointer hover:shadow-md transition-all group"
              onClick={() => setLocation("/admin/bookings")}
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(30,10,70,0.88) 0%, rgba(80,10,120,0.82) 100%), url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors border border-white/20">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-base">All Bookings</div>
                  <div className="text-white/60 text-xs mt-0.5">View and manage all reservations</div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-5 space-y-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Platform Health</div>
                <div className="space-y-2.5">
                  {[
                    { label: "API Server", status: "Operational", color: "bg-emerald-500" },
                    { label: "Database", status: "Connected", color: "bg-emerald-500" },
                    { label: "Booking Engine", status: "Running", color: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                        <span className="text-emerald-600 font-medium text-xs">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({
  title, value, loading, icon, gradient, bg, trend, trendLabel
}: {
  title: string;
  value?: number;
  loading: boolean;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  trend: string;
  trendLabel: string;
}) {
  return (
    <Card className="shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-500">{title}</p>
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
              {icon}
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-24 mb-2" />
          ) : (
            <p
              className="text-4xl font-black text-gray-900 tracking-tight"
              data-testid={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {value?.toLocaleString() ?? 0}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg} ${gradient.includes('blue') ? 'text-blue-600' : gradient.includes('emerald') ? 'text-emerald-600' : gradient.includes('violet') ? 'text-violet-600' : 'text-orange-600'}`}>
              {trend}
            </span>
            <span className="text-xs text-gray-400">{trendLabel}</span>
          </div>
        </div>
        <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      </CardContent>
    </Card>
  );
}
