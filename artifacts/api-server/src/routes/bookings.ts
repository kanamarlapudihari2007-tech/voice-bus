import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, bookingsTable, busesTable, usersTable } from "@workspace/db";
import {
  CreateBookingBody,
  GetBookingByIdParams,
  CancelBookingParams,
  ListBookingsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichBooking(booking: typeof bookingsTable.$inferSelect) {
  const [bus] = await db.select().from(busesTable).where(eq(busesTable.id, booking.busId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));

  let availableSeats = (bus?.totalSeats ?? 0);
  if (bus) {
    const booked = await db
      .select({ seatNumbers: bookingsTable.seatNumbers })
      .from(bookingsTable)
      .where(
        sql`${bookingsTable.busId} = ${bus.id} AND ${bookingsTable.status} = 'CONFIRMED'`
      );
    const bookedCount = booked.reduce(
      (acc, r) => acc + r.seatNumbers.split(",").filter(Boolean).length,
      0
    );
    availableSeats = Math.max(0, bus.totalSeats - bookedCount);
  }

  return {
    ...booking,
    bookingTime: booking.bookingTime.toISOString(),
    bus: bus
      ? { ...bus, availableSeats }
      : undefined,
    username: user?.username,
  };
}

router.get("/bookings", async (req, res): Promise<void> => {
  const params = ListBookingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let rows;
  if (params.data.userId) {
    rows = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, params.data.userId));
  } else {
    rows = await db.select().from(bookingsTable);
  }

  const enriched = await Promise.all(rows.map(enrichBooking));
  res.json(enriched);
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, busId, seatNumbers } = parsed.data;

  const [bus] = await db.select().from(busesTable).where(eq(busesTable.id, busId));
  if (!bus) {
    res.status(404).json({ error: "Bus not found" });
    return;
  }

  const existingBookings = await db
    .select({ seatNumbers: bookingsTable.seatNumbers })
    .from(bookingsTable)
    .where(
      sql`${bookingsTable.busId} = ${busId} AND ${bookingsTable.status} = 'CONFIRMED'`
    );

  const bookedSeats = new Set(
    existingBookings.flatMap((b) => b.seatNumbers.split(",").map((s) => s.trim()))
  );

  const requestedSeats = seatNumbers.split(",").map((s) => s.trim());
  const conflicting = requestedSeats.filter((s) => bookedSeats.has(s));

  if (conflicting.length > 0) {
    res.status(400).json({
      error: "Seats already booked",
      message: `Seats ${conflicting.join(", ")} are already booked`,
    });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({ userId, busId, seatNumbers, status: "CONFIRMED" })
    .returning();

  const enriched = await enrichBooking(booking);
  res.status(201).json(enriched);
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const enriched = await enrichBooking(booking);
  res.json(enriched);
});

router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const params = CancelBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: "CANCELLED" })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json({ success: true, message: "Booking cancelled successfully" });
});

export default router;
