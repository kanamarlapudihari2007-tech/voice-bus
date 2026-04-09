import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useGetBusById, getGetBusByIdQueryKey, useCreateBooking } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function BusDetail() {
  const params = useParams();
  const busId = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  // Fetch bus details
  const { data: bus, isLoading, isError } = useGetBusById(busId, {
    query: {
      enabled: !!busId,
      queryKey: getGetBusByIdQueryKey(busId)
    }
  });

  const createBooking = useCreateBooking();

  const handleSeatClick = (seatNumber: number, isBooked: boolean) => {
    if (isBooked) return;

    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleBook = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to book tickets",
      });
      setLocation("/");
      return;
    }

    if (selectedSeats.length === 0) return;

    try {
      await createBooking.mutateAsync({
        data: {
          busId,
          userId: user.id,
          seatNumbers: selectedSeats.join(",")
        }
      });

      toast({
        title: "Booking confirmed!",
        description: `Successfully booked ${selectedSeats.length} seats.`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: getGetBusByIdQueryKey(busId) });
      
      setLocation("/bookings");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message || "Failed to confirm booking",
      });
    }
  };

  // Organize seats into a layout if we have them
  const seatRows = useMemo(() => {
    if (!bus?.seats) return [];
    
    const rows = [];
    const seatsPerRow = 4; // 2x2 layout with aisle
    
    // Sort seats by number
    const sortedSeats = [...bus.seats].sort((a, b) => a.seatNumber - b.seatNumber);
    
    for (let i = 0; i < sortedSeats.length; i += seatsPerRow) {
      rows.push(sortedSeats.slice(i, i + seatsPerRow));
    }
    
    return rows;
  }, [bus?.seats]);

  const totalPrice = bus ? bus.price * selectedSeats.length : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !bus) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bus not found</h2>
          <Button onClick={() => setLocation("/search")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/search")} className="mb-2 -ml-4" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Seat Layout */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50 border-b pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      Bus {bus.busNumber}
                    </CardTitle>
                    <div className="text-sm text-gray-500 mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {bus.fromLocation} to {bus.toLocation}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {bus.departureTime}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm font-medium">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border-2 border-emerald-500"></div> Available</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div> Booked</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary border-2 border-primary shadow-sm"></div> Selected</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                
                {/* Driver Area Indicator */}
                <div className="flex justify-end mb-8 pr-12">
                  <div className="border-2 border-gray-300 rounded-t-xl rounded-b-md px-4 py-2 bg-gray-100 text-gray-500 font-medium text-xs">
                    Driver
                  </div>
                </div>

                {/* Seat Grid */}
                <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-3xl border shadow-inner">
                  <div className="space-y-4">
                    {seatRows.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex justify-center items-center gap-4">
                        {/* Left seats (0, 1) */}
                        <div className="flex gap-3">
                          {row.slice(0, 2).map(seat => (
                            <SeatButton 
                              key={seat.seatNumber} 
                              seat={seat} 
                              isSelected={selectedSeats.includes(seat.seatNumber)}
                              onClick={() => handleSeatClick(seat.seatNumber, seat.isBooked)}
                            />
                          ))}
                        </div>
                        
                        {/* Aisle */}
                        <div className="w-8 md:w-12 flex justify-center text-gray-300">
                          {/* Aisle marker, empty space */}
                        </div>
                        
                        {/* Right seats (2, 3) */}
                        <div className="flex gap-3">
                          {row.slice(2, 4).map(seat => (
                            <SeatButton 
                              key={seat.seatNumber} 
                              seat={seat} 
                              isSelected={selectedSeats.includes(seat.seatNumber)}
                              onClick={() => handleSeatClick(seat.seatNumber, seat.isBooked)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg border-primary/20 border-2">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Departure</span>
                    <span className="font-semibold text-gray-900">{bus.fromLocation}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Arrival</span>
                    <span className="font-semibold text-gray-900">{bus.toLocation}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Time</span>
                    <span className="font-semibold text-gray-900">{bus.departureTime}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Price per seat</span>
                    <span className="font-semibold text-gray-900">${bus.price}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-3">Selected Seats</h4>
                  {selectedSeats.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.sort((a,b) => a-b).map(seatNum => (
                        <Badge key={seatNum} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">
                          Seat {seatNum}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No seats selected yet. Click on available seats to select them.</p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Amount</span>
                  <span className="text-3xl font-bold text-primary" data-testid="text-total-price">
                    ${totalPrice}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 pt-6">
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-md" 
                  size="lg"
                  disabled={selectedSeats.length === 0 || createBooking.isPending}
                  onClick={handleBook}
                  data-testid="button-confirm-booking"
                >
                  {createBooking.isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    `Book ${selectedSeats.length} Ticket${selectedSeats.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}

// Seat Component helper
function SeatButton({ seat, isSelected, onClick }: { seat: any, isSelected: boolean, onClick: () => void }) {
  let btnClass = "";
  
  if (seat.isBooked) {
    btnClass = "bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-60";
  } else if (isSelected) {
    btnClass = "bg-primary border-primary text-white shadow-md transform scale-105";
  } else {
    btnClass = "bg-white border-emerald-500 text-emerald-700 hover:bg-emerald-50 shadow-sm hover:shadow";
  }

  return (
    <button
      disabled={seat.isBooked}
      onClick={onClick}
      className={`w-12 h-14 sm:w-14 sm:h-16 rounded-t-xl rounded-b-md border-2 flex flex-col items-center justify-center transition-all duration-200 ${btnClass}`}
      data-testid={`button-seat-${seat.seatNumber}`}
      title={seat.isBooked ? `Seat ${seat.seatNumber} (Booked)` : `Seat ${seat.seatNumber} (Available)`}
    >
      <span className="text-xs sm:text-sm font-bold block">{seat.seatNumber}</span>
      {isSelected && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mt-1" />}
    </button>
  );
}
