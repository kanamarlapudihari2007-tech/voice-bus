import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, busesTable, bookingsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/overview", async (_req, res): Promise<void> => {
  const [busCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(busesTable);

  const [bookingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable);

  const [userCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);

  const routes = await db
    .selectDistinct({ from: busesTable.fromLocation, to: busesTable.toLocation })
    .from(busesTable);

  res.json({
    totalBuses: busCount?.count ?? 0,
    totalBookings: bookingCount?.count ?? 0,
    totalUsers: userCount?.count ?? 0,
    activeRoutes: routes.length,
  });
});

router.get("/stats/popular-routes", async (_req, res): Promise<void> => {
  const bookings = await db
    .select({
      busId: bookingsTable.busId,
    })
    .from(bookingsTable);

  const buses = await db.select().from(busesTable);

  const busMap = new Map(buses.map((b) => [b.id, b]));
  const routeBookingCount = new Map<string, number>();
  const routeBusCount = new Map<string, Set<number>>();

  for (const booking of bookings) {
    const bus = busMap.get(booking.busId);
    if (!bus) continue;
    const routeKey = `${bus.fromLocation}::${bus.toLocation}`;
    routeBookingCount.set(routeKey, (routeBookingCount.get(routeKey) ?? 0) + 1);
    if (!routeBusCount.has(routeKey)) {
      routeBusCount.set(routeKey, new Set());
    }
    routeBusCount.get(routeKey)!.add(bus.id);
  }

  const routes = [...routeBookingCount.entries()]
    .map(([key, bookingCount]) => {
      const [fromLocation, toLocation] = key.split("::");
      return {
        fromLocation,
        toLocation,
        bookingCount,
        busCount: routeBusCount.get(key)?.size ?? 0,
      };
    })
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);

  if (routes.length === 0) {
    const topBuses = buses.slice(0, 5);
    res.json(
      topBuses.map((b) => ({
        fromLocation: b.fromLocation,
        toLocation: b.toLocation,
        bookingCount: 0,
        busCount: 1,
      }))
    );
    return;
  }

  res.json(routes);
});

router.get("/admin/bookings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(bookingsTable);
  const buses = await db.select().from(busesTable);
  const users = await db.select().from(usersTable);

  const busMap = new Map(buses.map((b) => [b.id, b]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched = rows.map((booking) => {
    const bus = busMap.get(booking.busId);
    const bookedCount = rows
      .filter((b) => b.busId === booking.busId && b.status === "CONFIRMED")
      .reduce((acc, r) => acc + r.seatNumbers.split(",").filter(Boolean).length, 0);
    const availableSeats = bus ? Math.max(0, bus.totalSeats - bookedCount) : 0;

    return {
      ...booking,
      bookingTime: booking.bookingTime.toISOString(),
      bus: bus ? { ...bus, availableSeats } : undefined,
      username: userMap.get(booking.userId)?.username,
    };
  });

  res.json(enriched);
});

export default router;
