import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, date, timestamp, pgEnum, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const speciesEnum = pgEnum("species", ["Dog", "Cat", "Bird", "Reptile", "Rodent", "Horse", "Other"]);
export const sexEnum = pgEnum("sex", ["Male", "Female", "Unknown"]);
export const recordTypeEnum = pgEnum("record_type", ["Consultation", "Vaccination", "Surgery", "Checkup", "Emergency", "LabTest", "Other"]);

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

// Clinics table
export const clinics = pgTable("clinics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  country: text("country").notNull().default("UA"),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  timezone: text("timezone").notNull().default("Europe/Kiev"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vets table
export const vets = pgTable("vets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  licenseNumber: text("license_number").notNull(),
  specialization: text("specialization"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  country: text("country").notNull().default("UA"),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id),
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
  dateOfBirth: date("date_of_birth").notNull(),
  microchipId: text("microchip_id"),
  passportNumber: text("passport_number"),
  color: text("color"),
  weightKg: real("weight_kg"),
  imageUrl: text("image_url"),
  ownerId: uuid("owner_id").notNull().references(() => owners.id),
  clinicId: uuid("clinic_id").references(() => clinics.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Veterinary Records table
export const veterinaryRecords = pgTable("veterinary_records", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  animalId: uuid("animal_id").notNull().references(() => animals.id),
  vetId: uuid("vet_id").references(() => vets.id),
  clinicId: uuid("clinic_id").references(() => clinics.id),
  clinicName: text("clinic_name"),
  visitDate: date("visit_date").notNull(),
  type: recordTypeEnum("type").notNull(),
  diagnosis: text("diagnosis"),
  symptoms: text("symptoms"),
  treatment: text("treatment"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Record Attachments join table
export const recordAttachments = pgTable("record_attachments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  recordId: uuid("record_id").notNull().references(() => veterinaryRecords.id),
  fileId: uuid("file_id").notNull().references(() => files.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vaccinations table
export const vaccinations = pgTable("vaccinations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  animalId: uuid("animal_id").notNull().references(() => animals.id),
  vaccineName: text("vaccine_name").notNull(),
  manufacturer: text("manufacturer"),
  batchNumber: text("batch_number"),
  dateAdministered: date("date_administered").notNull(),
  nextDueDate: date("next_due_date"),
  vetId: uuid("vet_id").references(() => vets.id),
  clinicId: uuid("clinic_id").references(() => clinics.id),
  clinicName: text("clinic_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health Metrics table (for weight, blood tests, etc.)
export const healthMetrics = pgTable("health_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  animalId: uuid("animal_id").notNull().references(() => animals.id),
  metricName: text("metric_name").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  referenceMin: real("reference_min"),
  referenceMax: real("reference_max"),
  recordDate: date("record_date").notNull(),
  notes: text("notes"),
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

export const insertVetSchema = createInsertSchema(vets, {
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  licenseNumber: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClinicSchema = createInsertSchema(clinics).omit({
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

export const insertVeterinaryRecordSchema = createInsertSchema(veterinaryRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVaccinationSchema = createInsertSchema(vaccinations, {
  vaccineName: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics, {
  metricName: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadedAt: true,
});

export const insertRecordAttachmentSchema = createInsertSchema(recordAttachments).omit({
  id: true,
  createdAt: true,
});

// Login schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  userType: z.enum(["owner", "vet"]),
});

// Types
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type Owner = typeof owners.$inferSelect;

export type InsertVet = z.infer<typeof insertVetSchema>;
export type Vet = typeof vets.$inferSelect;

export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Clinic = typeof clinics.$inferSelect;

export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animals.$inferSelect;

export type InsertVeterinaryRecord = z.infer<typeof insertVeterinaryRecordSchema>;
export type VeterinaryRecord = typeof veterinaryRecords.$inferSelect;

export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;
export type Vaccination = typeof vaccinations.$inferSelect;

export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type HealthMetric = typeof healthMetrics.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertRecordAttachment = z.infer<typeof insertRecordAttachmentSchema>;
export type RecordAttachment = typeof recordAttachments.$inferSelect;

export type LoginCredentials = z.infer<typeof loginSchema>;

// User type for session (union of Owner and Vet)
export type User = (Owner | Vet) & { userType: "owner" | "vet" };
