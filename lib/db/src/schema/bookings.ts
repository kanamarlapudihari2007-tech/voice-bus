import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { busesTable } from "./buses";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  busId: integer("bus_id")
    .notNull()
    .references(() => busesTable.id),
  seatNumbers: text("seat_numbers").notNull(),
  bookingTime: timestamp("booking_time", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("CONFIRMED"),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, bookingTime: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
