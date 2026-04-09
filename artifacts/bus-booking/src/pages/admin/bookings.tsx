import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListAllBookings, getListAllBookingsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Ticket, Loader2, ArrowRight, CalendarDays, User } from "lucide-react";

export default function AdminBookings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== "ADMIN") setLocation("/");
  }, [user, setLocation]);

  const { data: bookings, isLoading } = useListAllBookings({
    query: {
      enabled: !!user && user.role === "ADMIN",
      queryKey: getListAllBookingsQueryKey()
    }
  });

  if (!user || user.role !== "ADMIN") return null;

  const confirmed = bookings?.filter(b => b.status === "CONFIRMED").length ?? 0;
  const cancelled = (bookings?.length ?? 0) - confirmed;

  return (
    <Layout>
      <div className="space-y-8">

        {/* Hero Header */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(30,10,70,0.90) 0%, rgba(80,10,120,0.82) 100%), url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-violet-500/30 text-violet-200 border-violet-400/40 text-xs font-semibold">
                  Admin View
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">All Bookings</h1>
              <p className="text-white/60 mt-1 text-sm">Complete transaction history across the platform</p>
            </div>

            <div className="flex gap-4">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/15">
                <div className="text-2xl font-black text-white">{confirmed}</div>
                <div className="text-xs text-white/60 font-semibold uppercase tracking-wide">Confirmed</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/15">
                <div className="text-2xl font-black text-white">{cancelled}</div>
                <div className="text-xs text-white/60 font-semibold uppercase tracking-wide">Cancelled</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const isConfirmed = booking.status === "CONFIRMED";
              const seats = booking.seatNumbers.split(",");
              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row overflow-hidden ${isConfirmed ? "border-gray-100" : "border-gray-200 opacity-70"}`}
                >
                  {/* Colored strip */}
                  <div className={`w-full sm:w-1.5 sm:flex-shrink-0 h-1.5 sm:h-auto bg-gradient-to-b sm:bg-gradient-to-b ${isConfirmed ? "from-violet-500 to-purple-600" : "from-gray-300 to-gray-400"}`} />

                  {/* ID + Date */}
                  <div className="sm:w-36 flex-shrink-0 p-4 flex flex-row sm:flex-col justify-between sm:justify-center gap-2 border-b sm:border-b-0 sm:border-r border-gray-100">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">ID</div>
                      <div className="font-mono font-black text-gray-800 text-sm">#{booking.id}</div>
                    </div>
                    <div className="text-right sm:text-left">
                      <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Date</div>
                      <div className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(booking.bookingTime), "MMM d, HH:mm")}
                      </div>
                    </div>
                  </div>

                  {/* User */}
                  <div className="sm:w-36 flex-shrink-0 p-4 flex sm:flex-col justify-center gap-1 border-b sm:border-b-0 sm:border-r border-gray-100">
                    <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold hidden sm:block">User</div>
                    <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-violet-500" />
                      </div>
                      {booking.username}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex-1 p-4 flex items-center gap-3 border-b sm:border-b-0 sm:border-r border-gray-100">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Route</div>
                      <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                        <span>{booking.bus?.fromLocation}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{booking.bus?.toLocation}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Bus {booking.bus?.busNumber}</div>
                    </div>
                  </div>

                  {/* Seats */}
                  <div className="sm:w-40 p-4 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-gray-100">
                    <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">
                      {seats.length} Seat{seats.length !== 1 ? "s" : ""}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {seats.slice(0, 6).map(seat => (
                        <span key={seat} className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200">
                          {seat}
                        </span>
                      ))}
                      {seats.length > 6 && (
                        <span className="text-xs text-gray-400">+{seats.length - 6}</span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="sm:w-32 p-4 flex items-center justify-start sm:justify-center">
                    <Badge
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 ${isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {isConfirmed ? "✓ Confirmed" : "Cancelled"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No bookings on the platform yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
