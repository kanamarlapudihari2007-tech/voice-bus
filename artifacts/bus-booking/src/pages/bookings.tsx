import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListBookings, getListBookingsQueryKey, useCancelBooking } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Ticket, XCircle, MapPin, CalendarDays, Loader2, ArrowRight, Clock, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Bookings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) setLocation("/");
  }, [user, setLocation]);

  const { data: bookings, isLoading, isError } = useListBookings({ userId: user?.id }, {
    query: {
      enabled: !!user?.id,
      queryKey: getListBookingsQueryKey({ userId: user?.id })
    }
  });

  const cancelBooking = useCancelBooking();

  const handleCancel = async (bookingId: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await cancelBooking.mutateAsync({ id: bookingId });
      toast({ title: "Booking cancelled", description: "Your tickets have been cancelled successfully." });
      queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey({ userId: user?.id }) });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action failed", description: error.message || "Failed to cancel booking" });
    }
  };

  if (!user) return null;

  const confirmed = bookings?.filter(b => b.status === "CONFIRMED") ?? [];
  const cancelled = bookings?.filter(b => b.status !== "CONFIRMED") ?? [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Hero Header */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(10,30,70,0.90) 0%, rgba(10,100,90,0.82) 100%), url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 p-8 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/40 text-xs font-semibold">
                  {confirmed.length} Active
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">My Bookings</h1>
              <p className="text-white/60 mt-1 text-sm">Your tickets and travel history</p>
            </div>
            <Button
              onClick={() => setLocation("/search")}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm font-semibold h-10 flex-shrink-0"
              variant="outline"
            >
              <Search className="w-4 h-4 mr-2" /> Find Buses
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-24 w-full rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <p className="text-destructive font-medium">Failed to load bookings.</p>
          </div>
        ) : bookings && bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Ticket className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
              You haven't booked any trips. Search for buses and book your first ride!
            </p>
            <Button size="lg" onClick={() => setLocation("/search")} className="font-bold shadow-md">
              Find a Bus
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings?.map(booking => {
              const isConfirmed = booking.status === "CONFIRMED";
              const seats = booking.seatNumbers.split(",");

              return (
                <div
                  key={booking.id}
                  data-testid={`card-booking-${booking.id}`}
                  className={`relative rounded-2xl overflow-hidden border transition-all ${isConfirmed ? "border-gray-100 shadow-md hover:shadow-lg" : "border-gray-200 opacity-70"}`}
                >
                  {/* Boarding pass style */}
                  <div className="flex flex-col md:flex-row bg-white">

                    {/* Left colored strip */}
                    <div className={`w-full md:w-2 flex-shrink-0 bg-gradient-to-b ${isConfirmed ? "from-primary to-cyan-500" : "from-gray-300 to-gray-400"}`} />

                    {/* Main content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            Booked {format(new Date(booking.bookingTime), "MMM d, yyyy")}
                          </div>
                          <h3 className="text-lg font-extrabold text-gray-900">
                            Bus {booking.bus?.busNumber}
                          </h3>
                        </div>
                        <Badge
                          className={`text-xs font-bold px-3 py-1 rounded-full border-0 ${isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {isConfirmed ? "✓ Confirmed" : "Cancelled"}
                        </Badge>
                      </div>

                      {/* Route row */}
                      <div className="flex items-center gap-3 mb-5 bg-gray-50 rounded-xl p-4">
                        <div className="text-center flex-1">
                          <div className="text-xl font-black text-gray-900">{booking.bus?.departureTime}</div>
                          <div className="text-xs font-semibold text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3" />{booking.bus?.fromLocation}
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <div className="w-10 border-t-2 border-dashed border-gray-300" />
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <ArrowRight className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="w-10 border-t-2 border-dashed border-gray-300" />
                          </div>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Direct
                          </span>
                        </div>

                        <div className="text-center flex-1">
                          <div className="text-xl font-black text-gray-900">{booking.bus?.arrivalTime}</div>
                          <div className="text-xs font-semibold text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3" />{booking.bus?.toLocation}
                          </div>
                        </div>
                      </div>

                      {/* Seats */}
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          {seats.length} Seat{seats.length !== 1 ? "s" : ""}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {seats.map(seat => (
                            <span
                              key={seat}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${isConfirmed ? "bg-primary/8 text-primary border-primary/20" : "bg-gray-100 text-gray-500 border-gray-200"}`}
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dashed divider */}
                    <div className="hidden md:flex flex-col items-center justify-center px-2 py-6">
                      <div className="w-px h-full border-l-2 border-dashed border-gray-200" />
                    </div>

                    {/* Right — price & action */}
                    <div className="md:w-48 p-6 flex flex-col items-center justify-center gap-4 border-t md:border-t-0 border-gray-100 bg-gray-50/60">
                      {isConfirmed ? (
                        <Button
                          variant="destructive"
                          className="w-full font-bold h-10 shadow-sm"
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelBooking.isPending}
                          data-testid={`button-cancel-${booking.id}`}
                        >
                          {cancelBooking.isPending
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><XCircle className="w-4 h-4 mr-1.5" /> Cancel</>
                          }
                        </Button>
                      ) : (
                        <div className="text-xs font-semibold text-gray-400 bg-gray-100 px-4 py-2 rounded-full">
                          Cancelled
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Booking ID</div>
                        <div className="font-mono font-bold text-gray-600 text-sm">#{booking.id}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
