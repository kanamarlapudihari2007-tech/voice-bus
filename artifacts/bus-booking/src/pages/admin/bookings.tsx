import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListAllBookings, getListAllBookingsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Ticket, Loader2 } from "lucide-react";

export default function AdminBookings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: bookings, isLoading } = useListAllBookings({
    query: {
      enabled: !!user && user.role === "ADMIN",
      queryKey: getListAllBookingsQueryKey()
    }
  });

  if (!user || user.role !== "ADMIN") return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">All Bookings</h1>
          <p className="text-gray-500 mt-1">View all user transactions across the platform</p>
        </div>

        <Card className="shadow-sm border-t-4 border-t-emerald-500">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">ID</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">User</TableHead>
                  <TableHead className="font-bold">Bus / Route</TableHead>
                  <TableHead className="font-bold">Seats</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading bookings...
                    </TableCell>
                  </TableRow>
                ) : bookings && bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono font-medium text-gray-500">#{booking.id}</TableCell>
                      <TableCell>{format(new Date(booking.bookingTime), "MMM d, yyyy HH:mm")}</TableCell>
                      <TableCell className="font-medium text-gray-900">{booking.username}</TableCell>
                      <TableCell>
                        <div className="font-medium">Bus {booking.bus?.busNumber}</div>
                        <div className="text-xs text-gray-500">{booking.bus?.fromLocation} → {booking.bus?.toLocation}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {booking.seatNumbers.split(",").map(seat => (
                            <Badge key={seat} variant="outline" className="text-xs">{seat}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.status === "CONFIRMED" ? "default" : "secondary"} className={booking.status === "CONFIRMED" ? "bg-emerald-500" : ""}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center text-gray-500">
                        <Ticket className="w-12 h-12 mb-3 text-gray-300" />
                        <p>No bookings found on the platform.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
