import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useSearchBuses, getSearchBusesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/use-voice";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Bus, Mic, Search, MapPin, Users, ArrowRight, Star, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busNumber, setBusNumber] = useState("");

  const searchParams = {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(busNumber ? { busNumber } : {})
  };

  const { data: buses, isLoading, isError } = useSearchBuses(searchParams);

  const handleVoiceResult = useCallback((transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    let recognized = false;

    const fromToMatch = lowerTranscript.match(/from\s+([a-z\s]+)\s+to\s+([a-z\s]+)/i);
    if (fromToMatch) {
      setFrom(fromToMatch[1].trim());
      setTo(fromToMatch[2].trim());
      setBusNumber("");
      recognized = true;
    } else if (lowerTranscript.includes("bus")) {
      const busMatch = lowerTranscript.match(/bus\s+(\w+)/i);
      if (busMatch) {
        setBusNumber(busMatch[1].trim());
        setFrom("");
        setTo("");
        recognized = true;
      }
    }

    if (recognized) {
      toast({ title: "Voice recognized", description: `Searching: ${transcript}` });
    } else {
      toast({
        variant: "destructive",
        title: "Couldn't understand",
        description: "Try saying 'From London to Paris' or 'Bus 123'",
      });
    }
  }, [toast]);

  const { isListening, isSupported, startListening, stopListening } = useVoice({
    onResult: handleVoiceResult,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: getSearchBusesQueryKey(searchParams) });
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setBusNumber("");
  };

  return (
    <Layout>
      {/* Hero Banner with Background Image */}
      <div
        className="relative -mx-4 -mt-8 mb-10 rounded-2xl overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15,40,80,0.82) 0%, rgba(10,100,120,0.72) 100%), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: 320,
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 px-6 py-14 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-5 border border-white/20">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            Voice-powered smart booking
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3 drop-shadow-md">
            Where to next?
          </h1>
          <p className="text-white/75 text-lg max-w-xl mb-10">
            Search by route or speak your destination — we'll find the perfect ride.
          </p>

          {/* Voice Button */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={!isSupported}
            title={!isSupported ? "Voice search not supported in this browser" : "Tap to speak"}
            data-testid="button-voice-search"
            className={`w-20 h-20 rounded-full border-4 border-white/40 shadow-2xl flex items-center justify-center transition-all duration-300 focus:outline-none
              ${isListening
                ? "bg-red-500 scale-110 animate-pulse border-red-300"
                : "bg-white/20 backdrop-blur-md hover:bg-white/30 hover:scale-105"
              } ${!isSupported ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <Mic className={`w-8 h-8 text-white ${isListening ? "animate-bounce" : ""}`} />
          </button>

          {isListening ? (
            <p className="mt-4 text-white/90 font-medium animate-pulse text-sm">
              Listening... say something like "From Mumbai to Pune"
            </p>
          ) : (
            <p className="mt-4 text-white/55 text-sm">
              {isSupported ? "Tap the mic to search by voice" : "Voice search not supported"}
            </p>
          )}
        </div>
      </div>

      {/* Search Form Card */}
      <Card className="shadow-xl border-0 -mt-6 relative z-20 mx-0 ring-1 ring-gray-100">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="from" className="text-gray-600 font-semibold text-xs uppercase tracking-wide">From</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                <Input
                  id="from"
                  placeholder="Departure City"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="pl-9 h-11 border-gray-200 focus:border-primary"
                  data-testid="input-search-from"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to" className="text-gray-600 font-semibold text-xs uppercase tracking-wide">To</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                <Input
                  id="to"
                  placeholder="Arrival City"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="pl-9 h-11 border-gray-200 focus:border-primary"
                  data-testid="input-search-to"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="busNumber" className="text-gray-600 font-semibold text-xs uppercase tracking-wide">Bus Number</Label>
              <div className="relative">
                <Bus className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                <Input
                  id="busNumber"
                  placeholder="e.g. BUS101"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  className="pl-9 h-11 border-gray-200 focus:border-primary"
                  data-testid="input-search-busnumber"
                />
              </div>
            </div>

            <div className="flex gap-2 h-11">
              <Button type="button" variant="outline" onClick={clearFilters} className="h-full px-3 border-gray-200">
                Clear
              </Button>
              <Button type="submit" className="h-full flex-1 font-semibold" data-testid="button-submit-search">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-6 mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Buses
            {buses && !isLoading && (
              <Badge variant="secondary" className="ml-3 bg-primary/10 text-primary border-0">
                {buses.length} found
              </Badge>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden">
                <div className="p-6 flex gap-6 items-center">
                  <Skeleton className="h-16 w-32 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-12 w-32 rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-white rounded-xl border border-red-100">
            <p className="text-destructive font-medium">Failed to load buses. Please try again.</p>
          </div>
        ) : buses && buses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No buses found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">
              Try adjusting your filters or a different destination.
            </p>
            <Button variant="outline" className="mt-6" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {buses?.map(bus => (
              <Card
                key={bus.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-200 group border border-gray-100"
                data-testid={`card-bus-${bus.id}`}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Left accent bar */}
                    <div className="hidden md:flex w-1.5 bg-gradient-to-b from-primary to-cyan-500 flex-shrink-0" />

                    {/* Route & timing */}
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex items-center gap-2 bg-primary/8 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
                          <Bus className="w-3.5 h-3.5" />
                          {bus.busNumber}
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1 rounded-full">
                          <Users className="w-3.5 h-3.5" />
                          {bus.availableSeats} seats left
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-3xl font-extrabold text-gray-900">{bus.departureTime}</div>
                          <div className="text-sm font-semibold text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{bus.fromLocation}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-center gap-2">
                            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <ArrowRight className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                          </div>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Direct
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-extrabold text-gray-900">{bus.arrivalTime}</div>
                          <div className="text-sm font-semibold text-gray-500 mt-1 flex items-center gap-1 justify-end">
                            <MapPin className="w-3 h-3" />{bus.toLocation}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price & Book */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 md:w-56 p-6 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-gray-100 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Ticket Price</div>
                        <div className="text-4xl font-black text-gray-900" data-testid={`text-price-${bus.id}`}>
                          ${bus.price}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">per seat</div>
                      </div>
                      <Button
                        className="w-full h-11 text-sm font-bold shadow-md group-hover:shadow-lg transition-all"
                        onClick={() => setLocation(`/bus/${bus.id}`)}
                        data-testid={`button-book-${bus.id}`}
                      >
                        Book Now
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
