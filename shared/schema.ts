import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, date, timestamp, pgEnum, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const speciesEnum = pgEnum("species", ["Dog", "Cat", "Bird", "Reptile", "Rodent", "Horse", "Other"]);
export const sexEnum = pgEnum("sex", ["Male", "Female", "Unknown"]);

// Owners table
export const owners = pgTable("owners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull().default("UA"),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  preferredLanguage: text("preferred_language").notNull().default("uk"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Animals table
export const animals = pgTable("animals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  species: speciesEnum("species").notNull(),
  breed: text("breed").notNull(),
  sex: sexEnum("sex").notNull(),
  dateOfBirth: date("date_of_birth"),
  microchipId: text("microchip_id"),
  passportNumber: text("passport_number"),
  color: text("color"),
  weightKg: real("weight_kg"),
  imageUrl: text("image_url"),
  ownerId: uuid("owner_id").notNull().references(() => owners.id),
  vectorStoreId: text("vector_store_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lab Tests table (group of health metrics from one analysis)
export const labTests = pgTable("lab_tests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  animalId: uuid("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  testDate: date("test_date").notNull(),
  clinicName: text("clinic_name"),
  testType: text("test_type"), // Free text field to allow custom test types
  notes: text("notes"),
  vectorStoreFileId: text("vector_store_file_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

// Files table
export const files = pgTable("files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  url: text("url").notNull(),
  uploadedBy: uuid("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Health Metrics table (for weight, blood tests, etc.)
export const healthMetrics = pgTable("health_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  animalId: uuid("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  labTestId: uuid("lab_test_id").references(() => labTests.id, { onDelete: "cascade" }),
  metricName: text("metric_name").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  referenceMin: real("reference_min"),
  referenceMax: real("reference_max"),
  recordDate: date("record_date").notNull(),
  notes: text("notes"),
  vectorStoreFileId: text("vector_store_file_id"), // For standalone metrics (without labTestId)
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Messages table (for AI assistant conversation history)
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  animalId: uuid("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas with validation
export const insertOwnerSchema = createInsertSchema(owners, {
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnimalSchema = createInsertSchema(animals, {
  name: z.string().min(1),
  breed: z.string().min(1),
  ownerId: z.string().uuid(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics, {
  metricName: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages, {
  animalId: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
});

export const insertLabTestSchema = createInsertSchema(labTests, {
  animalId: z.string().uuid(),
  testDate: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadedAt: true,
});

// Login schema (only for owners now)
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  userType: z.literal("owner"),
});

// Types
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type Owner = typeof owners.$inferSelect;

export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animals.$inferSelect;

export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type LabTest = typeof labTests.$inferSelect;

export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type HealthMetric = typeof healthMetrics.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type LoginCredentials = z.infer<typeof loginSchema>;

// User type for session (owners only)
export type User = Owner & { userType: "owner" };
