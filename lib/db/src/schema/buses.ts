import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const busesTable = pgTable("buses", {
  id: serial("id").primaryKey(),
  busNumber: text("bus_number").notNull().unique(),
  fromLocation: text("from_location").notNull(),
  toLocation: text("to_location").notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  totalSeats: integer("total_seats").notNull().default(40),
  price: real("price").notNull().default(250),
});

export const insertBusSchema = createInsertSchema(busesTable).omit({ id: true });
export type InsertBus = z.infer<typeof insertBusSchema>;
export type Bus = typeof busesTable.$inferSelect;
