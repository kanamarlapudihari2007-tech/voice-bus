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
import { ArrowLeft, Clock, MapPin, CheckCircle2, Loader2, Bus, Users, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function BusDetail() {
  const params = useParams();
  const busId = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const { data: bus, isLoading, isError } = useGetBusById(busId, {
    query: { enabled: !!busId, queryKey: getGetBusByIdQueryKey(busId) }
  });

  const createBooking = useCreateBooking();

  const handleSeatClick = (seatNumber: number, isBooked: boolean) => {
    if (isBooked) return;
    setSelectedSeats(prev =>
      prev.includes(seatNumber) ? prev.filter(s => s !== seatNumber) : [...prev, seatNumber]
    );
  };

  const handleBook = async () => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please login to book tickets" });
      setLocation("/");
      return;
    }
    if (selectedSeats.length === 0) return;
    try {
      await createBooking.mutateAsync({ data: { busId, userId: user.id, seatNumbers: selectedSeats.join(",") } });
      toast({ title: "Booking confirmed!", description: `Successfully booked ${selectedSeats.length} seat${selectedSeats.length !== 1 ? "s" : ""}.` });
      queryClient.invalidateQueries({ queryKey: getGetBusByIdQueryKey(busId) });
      setLocation("/bookings");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Booking failed", description: error.message || "Failed to confirm booking" });
    }
  };

  const seatRows = useMemo(() => {
    if (!bus?.seats) return [];
    const sorted = [...bus.seats].sort((a, b) => a.seatNumber - b.seatNumber);
    const rows = [];
    for (let i = 0; i < sorted.length; i += 4) rows.push(sorted.slice(i, i + 4));
    return rows;
  }, [bus?.seats]);

  const totalPrice = bus ? bus.price * selectedSeats.length : 0;
  const bookedCount = bus?.seats?.filter(s => s.isBooked).length ?? 0;
  const availableCount = (bus?.seats?.length ?? 0) - bookedCount;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2"><Skeleton className="h-96 w-full rounded-xl" /></div>
            <div><Skeleton className="h-64 w-full rounded-xl" /></div>
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

        <Button variant="ghost" onClick={() => setLocation("/search")} className="-ml-2 text-gray-500 hover:text-gray-800" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
        </Button>

        {/* Hero route banner */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(8,25,60,0.90) 0%, rgba(5,80,115,0.84) 100%), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <Badge className="bg-white/15 text-white/90 border-white/20 text-sm font-bold backdrop-blur-sm">
                Bus {bus.busNumber}
              </Badge>
              <Badge className={`text-xs font-semibold border-0 ${availableCount > 10 ? "bg-emerald-500/30 text-emerald-200" : availableCount > 0 ? "bg-amber-500/30 text-amber-200" : "bg-red-500/30 text-red-200"}`}>
                <Users className="w-3 h-3 mr-1" /> {availableCount} seats left
              </Badge>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-4xl font-black text-white">{bus.departureTime}</div>
                <div className="text-white/60 mt-1 font-medium flex items-center gap-1 text-sm">
                  <MapPin className="w-3.5 h-3.5" />{bus.fromLocation}
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-center gap-2">
                  <div className="flex-1 border-t-2 border-dashed border-white/30" />
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-white/30" />
                </div>
                <span className="text-white/40 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Direct Route
                </span>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white">{bus.arrivalTime}</div>
                <div className="text-white/60 mt-1 font-medium flex items-center gap-1 justify-end text-sm">
                  <MapPin className="w-3.5 h-3.5" />{bus.toLocation}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Seat map */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-cyan-500" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900">Select Your Seats</CardTitle>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md border-2 border-emerald-500 bg-white" />
                      <span className="text-gray-500">Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md border-2 border-red-300 bg-red-50" />
                      <span className="text-gray-500">Booked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-primary border-2 border-primary" />
                      <span className="text-gray-500">Selected</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                {/* Driver */}
                <div className="flex justify-end mb-6 pr-10">
                  <div className="border-2 border-gray-200 rounded-t-xl rounded-b px-5 py-2 bg-gray-50 text-gray-400 font-semibold text-xs uppercase tracking-wide">
                    Driver
                  </div>
                </div>

                {/* Seats */}
                <div className="max-w-sm mx-auto bg-gradient-to-b from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-inner">
                  <div className="space-y-3">
                    {seatRows.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex justify-center items-center gap-3">
                        <div className="flex gap-2">
                          {row.slice(0, 2).map(seat => (
                            <SeatButton
                              key={seat.seatNumber}
                              seat={seat}
                              isSelected={selectedSeats.includes(seat.seatNumber)}
                              onClick={() => handleSeatClick(seat.seatNumber, seat.isBooked)}
                            />
                          ))}
                        </div>
                        <div className="w-6" />
                        <div className="flex gap-2">
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

          {/* Booking summary */}
          <div>
            <Card className="sticky top-24 shadow-lg border border-gray-100 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-gray-900">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Departure", value: bus.fromLocation },
                    { label: "Arrival", value: bus.toLocation },
                    { label: "Departure time", value: bus.departureTime },
                    { label: "Price per seat", value: `$${bus.price}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-bold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Selected Seats</div>
                  {selectedSeats.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.sort((a, b) => a - b).map(seatNum => (
                        <span
                          key={seatNum}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20"
                        >
                          Seat {seatNum}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Tap seats on the map to select them.</p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-600 text-sm">Total</span>
                  <span className="text-3xl font-black text-gray-900" data-testid="text-total-price">
                    ${totalPrice}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 pt-4">
                <Button
                  className="w-full h-12 text-base font-bold shadow-md"
                  disabled={selectedSeats.length === 0 || createBooking.isPending}
                  onClick={handleBook}
                  data-testid="button-confirm-booking"
                >
                  {createBooking.isPending
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                    : selectedSeats.length === 0
                      ? "Select seats to book"
                      : `Book ${selectedSeats.length} Ticket${selectedSeats.length !== 1 ? "s" : ""}`
                  }
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SeatButton({ seat, isSelected, onClick }: { seat: any; isSelected: boolean; onClick: () => void }) {
  let cls = "";
  if (seat.isBooked) {
    cls = "bg-red-50 border-red-200 text-red-300 cursor-not-allowed";
  } else if (isSelected) {
    cls = "bg-primary border-primary text-white shadow-lg scale-105";
  } else {
    cls = "bg-white border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:shadow-md";
  }

  return (
    <button
      disabled={seat.isBooked}
      onClick={onClick}
      className={`w-12 h-14 rounded-t-xl rounded-b border-2 flex flex-col items-center justify-center transition-all duration-150 ${cls}`}
      data-testid={`button-seat-${seat.seatNumber}`}
      title={seat.isBooked ? `Seat ${seat.seatNumber} (Booked)` : `Seat ${seat.seatNumber}`}
    >
      <span className="text-sm font-black">{seat.seatNumber}</span>
      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 mt-0.5" />}
    </button>
  );
}
