import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Bus, LogOut, User as UserIcon, LayoutDashboard, Settings, MapPin } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary text-primary-foreground sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={user?.role === "ADMIN" ? "/admin" : "/search"} className="flex items-center gap-2 font-bold text-xl tracking-tight" data-testid="link-home">
            <Bus className="w-6 h-6" />
            <span>VoiceBus</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                {user.role === "ADMIN" ? (
                  <>
                    <Link href="/admin" className={`text-sm font-medium hover:text-white/80 transition-colors ${location === '/admin' ? 'text-white' : 'text-white/70'}`} data-testid="link-admin-dashboard">Dashboard</Link>
                    <Link href="/admin/buses" className={`text-sm font-medium hover:text-white/80 transition-colors ${location === '/admin/buses' ? 'text-white' : 'text-white/70'}`} data-testid="link-admin-buses">Buses</Link>
                    <Link href="/admin/bookings" className={`text-sm font-medium hover:text-white/80 transition-colors ${location === '/admin/bookings' ? 'text-white' : 'text-white/70'}`} data-testid="link-admin-bookings">Bookings</Link>
                  </>
                ) : (
                  <>
                    <Link href="/search" className={`text-sm font-medium hover:text-white/80 transition-colors ${location === '/search' ? 'text-white' : 'text-white/70'}`} data-testid="link-search">Search</Link>
                    <Link href="/bookings" className={`text-sm font-medium hover:text-white/80 transition-colors ${location === '/bookings' ? 'text-white' : 'text-white/70'}`} data-testid="link-bookings">My Bookings</Link>
                  </>
                )}
                
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
                  <div className="flex items-center gap-2 text-sm" data-testid="text-username">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:inline-block font-medium">{user.username}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-white/20 hover:text-white" data-testid="button-logout">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/" className="text-sm font-medium hover:text-white/80 transition-colors" data-testid="link-login">Login</Link>
                <Link href="/register">
                  <Button variant="secondary" size="sm" className="font-semibold text-primary" data-testid="button-register-nav">Register</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-white border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} VoiceBus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
