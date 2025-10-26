import {
  type Owner,
  type Vet,
  type Animal,
  type VeterinaryRecord,
  type Vaccination,
  type HealthMetric,
  type Clinic,
  type File,
  type RecordAttachment,
  type InsertOwner,
  type InsertVet,
  type InsertAnimal,
  type InsertVeterinaryRecord,
  type InsertVaccination,
  type InsertHealthMetric,
  type InsertClinic,
  type InsertFile,
  type InsertRecordAttachment,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Owner methods
  getOwner(id: string): Promise<Owner | undefined>;
  getOwnerByEmail(email: string): Promise<Owner | undefined>;
  createOwner(owner: InsertOwner): Promise<Owner>;
  updateOwner(id: string, owner: Partial<InsertOwner>): Promise<Owner | undefined>;
  deleteOwner(id: string): Promise<boolean>;

  // Vet methods
  getVet(id: string): Promise<Vet | undefined>;
  getVetByEmail(email: string): Promise<Vet | undefined>;
  getAllVets(): Promise<Vet[]>;
  getVetsByClinic(clinicId: string): Promise<Vet[]>;
  createVet(vet: InsertVet): Promise<Vet>;
  updateVet(id: string, vet: Partial<InsertVet>): Promise<Vet | undefined>;
  deleteVet(id: string): Promise<boolean>;

  // Clinic methods
  getClinic(id: string): Promise<Clinic | undefined>;
  getAllClinics(): Promise<Clinic[]>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: string, clinic: Partial<InsertClinic>): Promise<Clinic | undefined>;
  deleteClinic(id: string): Promise<boolean>;

  // Animal methods
  getAnimal(id: string): Promise<Animal | undefined>;
  getAnimalsByOwner(ownerId: string): Promise<Animal[]>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: string, animal: Partial<InsertAnimal>): Promise<Animal | undefined>;
  deleteAnimal(id: string): Promise<boolean>;

  // Veterinary Record methods
  getVeterinaryRecord(id: string): Promise<VeterinaryRecord | undefined>;
  getVeterinaryRecordsByAnimal(animalId: string): Promise<VeterinaryRecord[]>;
  createVeterinaryRecord(record: InsertVeterinaryRecord): Promise<VeterinaryRecord>;
  updateVeterinaryRecord(id: string, record: Partial<InsertVeterinaryRecord>): Promise<VeterinaryRecord | undefined>;
  deleteVeterinaryRecord(id: string): Promise<boolean>;

  // Record Attachment methods
  addRecordAttachment(attachment: InsertRecordAttachment): Promise<RecordAttachment>;
  getRecordAttachments(recordId: string): Promise<File[]>;
  deleteRecordAttachment(id: string): Promise<boolean>;

  // Vaccination methods
  getVaccination(id: string): Promise<Vaccination | undefined>;
  getVaccinationsByAnimal(animalId: string): Promise<Vaccination[]>;
  createVaccination(vaccination: InsertVaccination): Promise<Vaccination>;
  updateVaccination(id: string, vaccination: Partial<InsertVaccination>): Promise<Vaccination | undefined>;
  deleteVaccination(id: string): Promise<boolean>;

  // Health Metric methods
  getHealthMetric(id: string): Promise<HealthMetric | undefined>;
  getHealthMetricsByAnimal(animalId: string): Promise<HealthMetric[]>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  updateHealthMetric(id: string, metric: Partial<InsertHealthMetric>): Promise<HealthMetric | undefined>;
  deleteHealthMetric(id: string): Promise<boolean>;

  // File methods
  createFile(file: InsertFile): Promise<File>;
  getFile(id: string): Promise<File | undefined>;
  deleteFile(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private owners: Map<string, Owner>;
  private vets: Map<string, Vet>;
  private clinics: Map<string, Clinic>;
  private animals: Map<string, Animal>;
  private veterinaryRecords: Map<string, VeterinaryRecord>;
  private recordAttachments: Map<string, RecordAttachment>;
  private vaccinations: Map<string, Vaccination>;
  private healthMetrics: Map<string, HealthMetric>;
  private files: Map<string, File>;

  constructor() {
    this.owners = new Map();
    this.vets = new Map();
    this.clinics = new Map();
    this.animals = new Map();
    this.veterinaryRecords = new Map();
    this.recordAttachments = new Map();
    this.vaccinations = new Map();
    this.healthMetrics = new Map();
    this.files = new Map();
  }

  async getOwner(id: string): Promise<Owner | undefined> {
    return this.owners.get(id);
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    return Array.from(this.owners.values()).find((owner) => owner.email === email);
  }

  async createOwner(insertOwner: InsertOwner): Promise<Owner> {
    const id = randomUUID();
    const owner: Owner = {
      ...insertOwner,
      country: insertOwner.country ?? "UA",
      preferredLanguage: insertOwner.preferredLanguage ?? "uk",
      addressLine2: insertOwner.addressLine2 ?? null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.owners.set(id, owner);
    return owner;
  }

  async updateOwner(id: string, updates: Partial<InsertOwner>): Promise<Owner | undefined> {
    const owner = this.owners.get(id);
    if (!owner) return undefined;
    const updated = { ...owner, ...updates, updatedAt: new Date() };
    this.owners.set(id, updated);
    return updated;
  }

  async getVet(id: string): Promise<Vet | undefined> {
    return this.vets.get(id);
  }

  async getVetByEmail(email: string): Promise<Vet | undefined> {
    return Array.from(this.vets.values()).find((vet) => vet.email === email);
  }

  async getAllVets(): Promise<Vet[]> {
    return Array.from(this.vets.values());
  }

  async getVetsByClinic(clinicId: string): Promise<Vet[]> {
    return Array.from(this.vets.values()).filter((vet) => vet.clinicId === clinicId);
  }

  async createVet(insertVet: InsertVet): Promise<Vet> {
    const id = randomUUID();
    const vet: Vet = {
      ...insertVet,
      country: insertVet.country ?? "UA",
      phone: insertVet.phone ?? null,
      specialization: insertVet.specialization ?? null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.vets.set(id, vet);
    return vet;
  }

  async updateVet(id: string, updates: Partial<InsertVet>): Promise<Vet | undefined> {
    const vet = this.vets.get(id);
    if (!vet) return undefined;
    const updated = { ...vet, ...updates, updatedAt: new Date() };
    this.vets.set(id, updated);
    return updated;
  }

  async getClinic(id: string): Promise<Clinic | undefined> {
    return this.clinics.get(id);
  }

  async getAllClinics(): Promise<Clinic[]> {
    return Array.from(this.clinics.values());
  }

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const id = randomUUID();
    const clinic: Clinic = {
      ...insertClinic,
      country: insertClinic.country ?? "UA",
      timezone: insertClinic.timezone ?? "Europe/Kiev",
      phone: insertClinic.phone ?? null,
      email: insertClinic.email ?? null,
      website: insertClinic.website ?? null,
      addressLine2: insertClinic.addressLine2 ?? null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clinics.set(id, clinic);
    return clinic;
  }

  async getAnimal(id: string): Promise<Animal | undefined> {
    return this.animals.get(id);
  }

  async getAnimalsByOwner(ownerId: string): Promise<Animal[]> {
    return Array.from(this.animals.values()).filter(
      (animal) => animal.ownerId === ownerId
    );
  }

  async createAnimal(insertAnimal: InsertAnimal): Promise<Animal> {
    const id = randomUUID();
    const animal: Animal = {
      ...insertAnimal,
      microchipId: insertAnimal.microchipId ?? null,
      passportNumber: insertAnimal.passportNumber ?? null,
      color: insertAnimal.color ?? null,
      weightKg: insertAnimal.weightKg ?? null,
      imageUrl: insertAnimal.imageUrl ?? null,
      clinicId: insertAnimal.clinicId ?? null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.animals.set(id, animal);
    return animal;
  }

  async updateAnimal(id: string, updates: Partial<InsertAnimal>): Promise<Animal | undefined> {
    const animal = this.animals.get(id);
    if (!animal) return undefined;
    const updated = { ...animal, ...updates, updatedAt: new Date() };
    this.animals.set(id, updated);
    return updated;
  }

  async deleteAnimal(id: string): Promise<boolean> {
    return this.animals.delete(id);
  }

  async deleteOwner(id: string): Promise<boolean> {
    return this.owners.delete(id);
  }

  async deleteVet(id: string): Promise<boolean> {
    return this.vets.delete(id);
  }

  async updateClinic(id: string, updates: Partial<InsertClinic>): Promise<Clinic | undefined> {
    const clinic = this.clinics.get(id);
    if (!clinic) return undefined;
    const updated = { ...clinic, ...updates, updatedAt: new Date() };
    this.clinics.set(id, updated);
    return updated;
  }

  async deleteClinic(id: string): Promise<boolean> {
    return this.clinics.delete(id);
  }

  async getVeterinaryRecord(id: string): Promise<VeterinaryRecord | undefined> {
    return this.veterinaryRecords.get(id);
  }

  async getVeterinaryRecordsByAnimal(animalId: string): Promise<VeterinaryRecord[]> {
    return Array.from(this.veterinaryRecords.values()).filter(
      (record) => record.animalId === animalId
    );
  }

  async createVeterinaryRecord(insertRecord: InsertVeterinaryRecord): Promise<VeterinaryRecord> {
    const id = randomUUID();
    const record: VeterinaryRecord = {
      ...insertRecord,
      vetId: insertRecord.vetId ?? null,
      diagnosis: insertRecord.diagnosis ?? null,
      symptoms: insertRecord.symptoms ?? null,
      treatment: insertRecord.treatment ?? null,
      notes: insertRecord.notes ?? null,
      clinicId: insertRecord.clinicId ?? null,
      clinicName: insertRecord.clinicName ?? null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.veterinaryRecords.set(id, record);
    return record;
  }

  async updateVeterinaryRecord(id: string, updates: Partial<InsertVeterinaryRecord>): Promise<VeterinaryRecord | undefined> {
    const record = this.veterinaryRecords.get(id);
    if (!record) return undefined;
    const updated = { ...record, ...updates, updatedAt: new Date() };
    this.veterinaryRecords.set(id, updated);
    return updated;
  }

  async addRecordAttachment(insertAttachment: InsertRecordAttachment): Promise<RecordAttachment> {
    const id = randomUUID();
    const attachment: RecordAttachment = {
      ...insertAttachment,
      id,
      createdAt: new Date(),
    };
    this.recordAttachments.set(id, attachment);
    return attachment;
  }

  async getRecordAttachments(recordId: string): Promise<File[]> {
    const attachments = Array.from(this.recordAttachments.values()).filter(
      (att) => att.recordId === recordId
    );
    const fileIds = attachments.map((att) => att.fileId);
    return Array.from(this.files.values()).filter((file) => fileIds.includes(file.id));
  }

  async getVaccination(id: string): Promise<Vaccination | undefined> {
    return this.vaccinations.get(id);
  }

  async getVaccinationsByAnimal(animalId: string): Promise<Vaccination[]> {
    return Array.from(this.vaccinations.values()).filter(
      (vaccination) => vaccination.animalId === animalId
    );
  }

  async createVaccination(insertVaccination: InsertVaccination): Promise<Vaccination> {
    const id = randomUUID();
    const vaccination: Vaccination = {
      ...insertVaccination,
      vetId: insertVaccination.vetId ?? null,
      manufacturer: insertVaccination.manufacturer ?? null,
      batchNumber: insertVaccination.batchNumber ?? null,
      nextDueDate: insertVaccination.nextDueDate ?? null,
      notes: insertVaccination.notes ?? null,
      clinicId: insertVaccination.clinicId ?? null,
      clinicName: insertVaccination.clinicName ?? null,
      id,
      createdAt: new Date(),
    };
    this.vaccinations.set(id, vaccination);
    return vaccination;
  }

  async updateVaccination(id: string, updates: Partial<InsertVaccination>): Promise<Vaccination | undefined> {
    const vaccination = this.vaccinations.get(id);
    if (!vaccination) return undefined;
    const updated = { ...vaccination, ...updates };
    this.vaccinations.set(id, updated);
    return updated;
  }

  async getHealthMetric(id: string): Promise<HealthMetric | undefined> {
    return this.healthMetrics.get(id);
  }

  async getHealthMetricsByAnimal(animalId: string): Promise<HealthMetric[]> {
    return Array.from(this.healthMetrics.values()).filter(
      (metric) => metric.animalId === animalId
    );
  }

  async createHealthMetric(insertMetric: InsertHealthMetric): Promise<HealthMetric> {
    const id = randomUUID();
    const metric: HealthMetric = {
      ...insertMetric,
      notes: insertMetric.notes ?? null,
      referenceMin: insertMetric.referenceMin ?? null,
      referenceMax: insertMetric.referenceMax ?? null,
      id,
      createdAt: new Date(),
    };
    this.healthMetrics.set(id, metric);
    return metric;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = {
      ...insertFile,
      id,
      uploadedAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async getFile(id: string): Promise<File | undefined> {
    return this.files.get(id);
  }

  async deleteFile(id: string): Promise<boolean> {
    return this.files.delete(id);
  }

  async deleteVeterinaryRecord(id: string): Promise<boolean> {
    return this.veterinaryRecords.delete(id);
  }

  async deleteRecordAttachment(id: string): Promise<boolean> {
    return this.recordAttachments.delete(id);
  }

  async updateHealthMetric(id: string, updates: Partial<InsertHealthMetric>): Promise<HealthMetric | undefined> {
    const metric = this.healthMetrics.get(id);
    if (!metric) return undefined;
    const updated = { ...metric, ...updates };
    this.healthMetrics.set(id, updated);
    return updated;
  }

  async deleteHealthMetric(id: string): Promise<boolean> {
    return this.healthMetrics.delete(id);
  }

  async deleteVaccination(id: string): Promise<boolean> {
    return this.vaccinations.delete(id);
  }
}

export const storage = new MemStorage();
