import { Router, type IRouter } from "express";
import { eq, or, ilike, sql } from "drizzle-orm";
import { db, busesTable, bookingsTable } from "@workspace/db";
import {
  CreateBusBody,
  UpdateBusBody,
  GetBusByIdParams,
  UpdateBusParams,
  DeleteBusParams,
  SearchBusesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getBookedSeats(busId: number, seatNumbers: string[]): Promise<string[]> {
  return db
    .select({ seatNumbers: bookingsTable.seatNumbers })
    .from(bookingsTable)
    .where(
      sql`${bookingsTable.busId} = ${busId} AND ${bookingsTable.status} = 'CONFIRMED'`
    )
    .then((rows) => {
      const booked: string[] = [];
      for (const row of rows) {
        booked.push(...row.seatNumbers.split(",").map((s) => s.trim()));
      }
      return booked;
    });
}

async function enrichBusWithSeats(bus: typeof busesTable.$inferSelect) {
  const bookedRaw = await getBookedSeats(bus.id, []);
  const bookedSet = new Set(bookedRaw);
  const seats = [];
  for (let i = 1; i <= bus.totalSeats; i++) {
    seats.push({ seatNumber: i, isBooked: bookedSet.has(String(i)) });
  }
  const availableSeats = bus.totalSeats - bookedRaw.length;
  return { ...bus, availableSeats: Math.max(0, availableSeats), seats };
}

async function enrichBus(bus: typeof busesTable.$inferSelect) {
  const bookedRaw = await getBookedSeats(bus.id, []);
  const availableSeats = bus.totalSeats - bookedRaw.length;
  return { ...bus, availableSeats: Math.max(0, availableSeats) };
}

router.get("/buses", async (_req, res): Promise<void> => {
  const buses = await db.select().from(busesTable);
  const enriched = await Promise.all(buses.map(enrichBus));
  res.json(enriched);
});

router.get("/buses/search", async (req, res): Promise<void> => {
  const params = SearchBusesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { from, to, busNumber, query } = params.data;

  let buses = await db.select().from(busesTable);

  if (busNumber) {
    buses = buses.filter((b) =>
      b.busNumber.toLowerCase().includes(busNumber.toLowerCase())
    );
  } else if (from || to) {
    buses = buses.filter((b) => {
      const matchFrom = from
        ? b.fromLocation.toLowerCase().includes(from.toLowerCase())
        : true;
      const matchTo = to
        ? b.toLocation.toLowerCase().includes(to.toLowerCase())
        : true;
      return matchFrom && matchTo;
    });
  } else if (query) {
    const q = query.toLowerCase();
    buses = buses.filter(
      (b) =>
        b.busNumber.toLowerCase().includes(q) ||
        b.fromLocation.toLowerCase().includes(q) ||
        b.toLocation.toLowerCase().includes(q)
    );
  }

  const enriched = await Promise.all(buses.map(enrichBus));
  res.json(enriched);
});

router.get("/buses/:id", async (req, res): Promise<void> => {
  const params = GetBusByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bus] = await db
    .select()
    .from(busesTable)
    .where(eq(busesTable.id, params.data.id));

  if (!bus) {
    res.status(404).json({ error: "Bus not found" });
    return;
  }

  const detail = await enrichBusWithSeats(bus);
  res.json(detail);
});

router.post("/buses", async (req, res): Promise<void> => {
  const parsed = CreateBusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bus] = await db.insert(busesTable).values(parsed.data).returning();
  const enriched = await enrichBus(bus);
  res.status(201).json(enriched);
});

router.put("/buses/:id", async (req, res): Promise<void> => {
  const params = UpdateBusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bus] = await db
    .update(busesTable)
    .set(parsed.data)
    .where(eq(busesTable.id, params.data.id))
    .returning();

  if (!bus) {
    res.status(404).json({ error: "Bus not found" });
    return;
  }

  const enriched = await enrichBus(bus);
  res.json(enriched);
});

router.delete("/buses/:id", async (req, res): Promise<void> => {
  const params = DeleteBusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bus] = await db
    .delete(busesTable)
    .where(eq(busesTable.id, params.data.id))
    .returning();

  if (!bus) {
    res.status(404).json({ error: "Bus not found" });
    return;
  }

  res.json({ success: true, message: "Bus deleted successfully" });
});

export default router;
