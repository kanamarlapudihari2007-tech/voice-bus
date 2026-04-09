import { useState, useEffect } from "react";
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
import { Bus, Mic, Search, MapPin, Clock, Users, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busNumber, setBusNumber] = useState("");
  
  // Create stable params object
  const searchParams = {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(busNumber ? { busNumber } : {})
  };
  
  // Use enabled: true so it fetches immediately, but we can also trigger manually
  const { data: buses, isLoading, isError } = useSearchBuses(searchParams);

  // Voice recognition hook
  const { isListening, isSupported, startListening, stopListening } = useVoice({
    onResult: (transcript) => {
      const lowerTranscript = transcript.toLowerCase();
      let recognized = false;
      
      // Basic NLP parsing for voice commands
      // "from [city] to [city]"
      const fromToMatch = lowerTranscript.match(/from\s+([a-z\s]+)\s+to\s+([a-z\s]+)/i);
      if (fromToMatch) {
        setFrom(fromToMatch[1].trim());
        setTo(fromToMatch[2].trim());
        setBusNumber("");
        recognized = true;
      } 
      // "bus [number]"
      else if (lowerTranscript.includes("bus")) {
        const busMatch = lowerTranscript.match(/bus\s+(\w+)/i);
        if (busMatch) {
          setBusNumber(busMatch[1].trim());
          setFrom("");
          setTo("");
          recognized = true;
        }
      }
      
      if (recognized) {
        toast({
          title: "Voice recognized",
          description: `Searching: ${transcript}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't understand",
          description: "Try saying 'From London to Paris' or 'Bus 123'",
        });
      }
    }
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Where to next?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Search your destination or use your voice to find the perfect ride.
          </p>
        </div>

        <Card className="border-t-4 border-t-primary shadow-lg overflow-visible relative">
          {/* Voice Button - Prominent */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <Button
              type="button"
              size="icon"
              className={`w-16 h-16 rounded-full shadow-xl border-4 border-white transition-all duration-300 ${
                isListening 
                  ? "bg-destructive hover:bg-destructive/90 animate-pulse scale-110" 
                  : "bg-primary hover:bg-primary/90 hover:scale-105"
              }`}
              onClick={isListening ? stopListening : startListening}
              disabled={!isSupported}
              title={!isSupported ? "Voice search not supported in this browser" : "Voice search"}
              data-testid="button-voice-search"
            >
              <Mic className={`w-7 h-7 ${isListening ? "animate-bounce" : ""}`} />
            </Button>
          </div>

          <CardContent className="pt-12 pb-6 px-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="from"
                    placeholder="Departure City"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="pl-9 h-11"
                    data-testid="input-search-from"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="to"
                    placeholder="Arrival City"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="pl-9 h-11"
                    data-testid="input-search-to"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="busNumber">Bus Number</Label>
                <div className="relative">
                  <Bus className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="busNumber"
                    placeholder="e.g. 101"
                    value={busNumber}
                    onChange={(e) => setBusNumber(e.target.value)}
                    className="pl-9 h-11"
                    data-testid="input-search-busnumber"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 h-11">
                <Button type="button" variant="outline" onClick={clearFilters} className="h-full px-3" title="Clear filters">
                  Clear
                </Button>
                <Button type="submit" className="h-full flex-1" data-testid="button-submit-search">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </form>

            {isListening && (
              <div className="mt-6 text-center text-primary font-medium flex items-center justify-center gap-2 animate-pulse">
                <Mic className="w-4 h-4" /> Listening... Speak a destination or bus number
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Available Buses
              {buses && !isLoading && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                  {buses.length} found
                </Badge>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden">
                  <div className="p-6 flex flex-col md:flex-row gap-6 items-center">
                    <Skeleton className="h-16 w-32 rounded-lg" />
                    <div className="flex-1 w-full space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-12 w-32 rounded-lg" />
                  </div>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-destructive font-medium">Failed to load buses. Please try again.</p>
            </div>
          ) : buses && buses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No buses found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">
                We couldn't find any buses matching your search criteria. Try adjusting your filters or destination.
              </p>
              <Button variant="outline" className="mt-6" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {buses?.map(bus => (
                <Card key={bus.id} className="overflow-hidden hover:shadow-md transition-shadow group border-l-4 border-l-primary" data-testid={`card-bus-${bus.id}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Left: Timing & Route */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge variant="outline" className="font-mono bg-gray-50 text-gray-700 text-sm">
                            Bus {bus.busNumber}
                          </Badge>
                          <div className="flex items-center text-sm font-medium text-emerald-600 gap-1">
                            <Users className="w-4 h-4" />
                            {bus.availableSeats} seats left
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{bus.departureTime}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">{bus.fromLocation}</div>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center px-4 relative">
                            <Separator className="flex-1 bg-gray-300" />
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                              <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{bus.arrivalTime}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">{bus.toLocation}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Price & Action */}
                      <div className="bg-gray-50 p-6 md:w-64 flex flex-col justify-center border-t md:border-t-0 md:border-l">
                        <div className="text-center mb-6">
                          <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Ticket Price</div>
                          <div className="text-3xl font-bold text-gray-900 mt-1" data-testid={`text-price-${bus.id}`}>${bus.price}</div>
                        </div>
                        <Button 
                          className="w-full h-12 text-base font-semibold group-hover:bg-primary/90 transition-all"
                          onClick={() => setLocation(`/bus/${bus.id}`)}
                          data-testid={`button-book-${bus.id}`}
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
