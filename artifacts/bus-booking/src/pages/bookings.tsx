import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListBookings, getListBookingsQueryKey, useCancelBooking } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Ticket, XCircle, Clock, MapPin, CalendarDays, Loader2, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Bookings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
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
      
      toast({
        title: "Booking cancelled",
        description: "Your tickets have been cancelled successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey({ userId: user?.id }) });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.message || "Failed to cancel booking",
      });
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Bookings</h1>
            <p className="text-gray-500 mt-2">Manage your tickets and travel history</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-destructive font-medium">Failed to load bookings.</p>
          </div>
        ) : bookings && bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              You haven't booked any trips. Search for buses and book your first ride!
            </p>
            <Button size="lg" onClick={() => setLocation("/search")} className="font-semibold shadow-md">
              Find a Bus
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings?.map(booking => {
              const isConfirmed = booking.status === "CONFIRMED";
              const seatCount = booking.seatNumbers.split(",").length;
              
              return (
                <Card key={booking.id} className={`overflow-hidden transition-all shadow-sm ${!isConfirmed ? 'opacity-75 grayscale-[0.5]' : 'hover:shadow-md'}`} data-testid={`card-booking-${booking.id}`}>
                  <div className={`h-2 ${isConfirmed ? 'bg-primary' : 'bg-gray-300'}`} />
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6 md:p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <CalendarDays className="w-4 h-4" /> 
                              Booked on {format(new Date(booking.bookingTime), "MMM d, yyyy")}
                            </div>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                              Bus {booking.bus?.busNumber}
                            </h3>
                          </div>
                          <Badge variant={isConfirmed ? "default" : "secondary"} className={isConfirmed ? "bg-emerald-500" : ""}>
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Route</div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {booking.bus?.fromLocation} <ArrowRight className="w-3 h-3 text-gray-400" /> {booking.bus?.toLocation}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Time</div>
                            <div className="font-medium text-gray-900">
                              {booking.bus?.departureTime} - {booking.bus?.arrivalTime}
                            </div>
                          </div>
                          <div className="sm:col-span-2 pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Seats ({seatCount})</div>
                            <div className="flex flex-wrap gap-2">
                              {booking.seatNumbers.split(",").map(seat => (
                                <Badge key={seat} variant="outline" className="bg-white text-gray-700 font-bold px-3">
                                  {seat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 md:bg-white md:w-56 p-6 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l space-y-4">
                        {isConfirmed && (
                          <Button 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancelBooking.isPending}
                            data-testid={`button-cancel-${booking.id}`}
                          >
                            {cancelBooking.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Cancel Tickets
                          </Button>
                        )}
                        {!isConfirmed && (
                          <div className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                            Cancelled
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
