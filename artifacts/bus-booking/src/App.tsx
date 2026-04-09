import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import SearchPage from "@/pages/search";
import BusDetail from "@/pages/bus-detail";
import Bookings from "@/pages/bookings";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminBuses from "@/pages/admin/buses";
import AdminBookings from "@/pages/admin/bookings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/");
    return null;
  }

  if (adminOnly && user.role !== "ADMIN") {
    setLocation("/search");
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* User Routes */}
      <Route path="/search">
        {(params) => <ProtectedRoute component={SearchPage} {...params} />}
      </Route>
      <Route path="/bus/:id">
        {(params) => <ProtectedRoute component={BusDetail} {...params} />}
      </Route>
      <Route path="/bookings">
        {(params) => <ProtectedRoute component={Bookings} {...params} />}
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin">
        {(params) => <ProtectedRoute component={AdminDashboard} adminOnly {...params} />}
      </Route>
      <Route path="/admin/buses">
        {(params) => <ProtectedRoute component={AdminBuses} adminOnly {...params} />}
      </Route>
      <Route path="/admin/bookings">
        {(params) => <ProtectedRoute component={AdminBookings} adminOnly {...params} />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
