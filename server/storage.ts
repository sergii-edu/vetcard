import {
  type Owner,
  type Animal,
  type LabTest,
  type HealthMetric,
  type ChatMessage,
  type File,
  type InsertOwner,
  type InsertAnimal,
  type InsertLabTest,
  type InsertHealthMetric,
  type InsertChatMessage,
  type InsertFile,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Owner methods
  getOwner(id: string): Promise<Owner | undefined>;
  getOwnerByEmail(email: string): Promise<Owner | undefined>;
  createOwner(owner: InsertOwner): Promise<Owner>;
  updateOwner(id: string, owner: Partial<InsertOwner>): Promise<Owner | undefined>;
  deleteOwner(id: string): Promise<boolean>;

  // Animal methods
  getAnimal(id: string): Promise<Animal | undefined>;
  getAnimalsByOwner(ownerId: string): Promise<Animal[]>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: string, animal: Partial<InsertAnimal>): Promise<Animal | undefined>;
  deleteAnimal(id: string): Promise<boolean>;

  // Lab Test methods
  getLabTest(id: string): Promise<LabTest | undefined>;
  getLabTestsByAnimal(animalId: string): Promise<LabTest[]>;
  createLabTest(labTest: InsertLabTest): Promise<LabTest>;
  updateLabTest(id: string, labTest: Partial<InsertLabTest>): Promise<LabTest | undefined>;
  deleteLabTest(id: string): Promise<boolean>;

  // Health Metric methods
  getHealthMetric(id: string): Promise<HealthMetric | undefined>;
  getHealthMetricsByAnimal(animalId: string): Promise<HealthMetric[]>;
  getHealthMetricsByLabTest(labTestId: string): Promise<HealthMetric[]>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  updateHealthMetric(id: string, metric: Partial<InsertHealthMetric>): Promise<HealthMetric | undefined>;
  deleteHealthMetric(id: string): Promise<boolean>;

  // Chat Message methods
  getChatMessagesByAnimal(animalId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<boolean>;
  deleteChatMessagesByAnimal(animalId: string): Promise<boolean>;

  // File methods
  createFile(file: InsertFile): Promise<File>;
  getFile(id: string): Promise<File | undefined>;
  deleteFile(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private owners: Map<string, Owner>;
  private animals: Map<string, Animal>;
  private labTests: Map<string, LabTest>;
  private healthMetrics: Map<string, HealthMetric>;
  private chatMessages: Map<string, ChatMessage>;
  private files: Map<string, File>;

  constructor() {
    this.owners = new Map();
    this.animals = new Map();
    this.labTests = new Map();
    this.healthMetrics = new Map();
    this.chatMessages = new Map();
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

  async deleteOwner(id: string): Promise<boolean> {
    return this.owners.delete(id);
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
      dateOfBirth: insertAnimal.dateOfBirth ?? null,
      microchipId: insertAnimal.microchipId ?? null,
      passportNumber: insertAnimal.passportNumber ?? null,
      color: insertAnimal.color ?? null,
      weightKg: insertAnimal.weightKg ?? null,
      imageUrl: insertAnimal.imageUrl ?? null,
      vectorStoreId: insertAnimal.vectorStoreId ?? null,
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

  async getLabTest(id: string): Promise<LabTest | undefined> {
    return this.labTests.get(id);
  }

  async getLabTestsByAnimal(animalId: string): Promise<LabTest[]> {
    return Array.from(this.labTests.values()).filter(
      (test) => test.animalId === animalId
    );
  }

  async createLabTest(insertLabTest: InsertLabTest): Promise<LabTest> {
    const id = randomUUID();
    const now = new Date();
    const labTest: LabTest = {
      ...insertLabTest,
      clinicName: insertLabTest.clinicName ?? null,
      testType: insertLabTest.testType ?? null,
      notes: insertLabTest.notes ?? null,
      vectorStoreFileId: insertLabTest.vectorStoreFileId ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.labTests.set(id, labTest);
    return labTest;
  }

  async updateLabTest(id: string, updates: Partial<InsertLabTest>): Promise<LabTest | undefined> {
    const labTest = this.labTests.get(id);
    if (!labTest) return undefined;
    const updated = { ...labTest, ...updates, updatedAt: new Date() };
    this.labTests.set(id, updated);
    return updated;
  }

  async deleteLabTest(id: string): Promise<boolean> {
    return this.labTests.delete(id);
  }

  async getHealthMetric(id: string): Promise<HealthMetric | undefined> {
    return this.healthMetrics.get(id);
  }

  async getHealthMetricsByAnimal(animalId: string): Promise<HealthMetric[]> {
    return Array.from(this.healthMetrics.values()).filter(
      (metric) => metric.animalId === animalId
    );
  }

  async getHealthMetricsByLabTest(labTestId: string): Promise<HealthMetric[]> {
    return Array.from(this.healthMetrics.values()).filter(
      (metric) => metric.labTestId === labTestId
    );
  }

  async createHealthMetric(insertMetric: InsertHealthMetric): Promise<HealthMetric> {
    const id = randomUUID();
    const metric: HealthMetric = {
      ...insertMetric,
      labTestId: insertMetric.labTestId ?? null,
      notes: insertMetric.notes ?? null,
      referenceMin: insertMetric.referenceMin ?? null,
      referenceMax: insertMetric.referenceMax ?? null,
      vectorStoreFileId: insertMetric.vectorStoreFileId ?? null,
      id,
      createdAt: new Date(),
    };
    this.healthMetrics.set(id, metric);
    return metric;
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

  async getChatMessagesByAnimal(animalId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((msg) => msg.animalId === animalId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async deleteChatMessage(id: string): Promise<boolean> {
    return this.chatMessages.delete(id);
  }

  async deleteChatMessagesByAnimal(animalId: string): Promise<boolean> {
    const messagesToDelete = Array.from(this.chatMessages.values())
      .filter((msg) => msg.animalId === animalId);
    
    messagesToDelete.forEach((msg) => this.chatMessages.delete(msg.id));
    return true;
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
}

import { db } from "./db";
import { eq } from "drizzle-orm";
import * as schema from "../shared/schema";

class DbStorage implements IStorage {
  async getOwner(id: string): Promise<Owner | undefined> {
    const result = await db.select().from(schema.owners).where(eq(schema.owners.id, id)).limit(1);
    return result[0];
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const result = await db.select().from(schema.owners).where(eq(schema.owners.email, email)).limit(1);
    return result[0];
  }

  async createOwner(insertOwner: InsertOwner): Promise<Owner> {
    const result = await db.insert(schema.owners).values(insertOwner).returning();
    return result[0];
  }

  async updateOwner(id: string, insertOwner: Partial<InsertOwner>): Promise<Owner | undefined> {
    const result = await db.update(schema.owners).set(insertOwner).where(eq(schema.owners.id, id)).returning();
    return result[0];
  }

  async deleteOwner(id: string): Promise<boolean> {
    const result = await db.delete(schema.owners).where(eq(schema.owners.id, id)).returning();
    return result.length > 0;
  }

  async getAnimal(id: string): Promise<Animal | undefined> {
    const result = await db.select().from(schema.animals).where(eq(schema.animals.id, id)).limit(1);
    return result[0];
  }

  async getAnimalsByOwner(ownerId: string): Promise<Animal[]> {
    return await db.select().from(schema.animals).where(eq(schema.animals.ownerId, ownerId));
  }

  async createAnimal(animal: InsertAnimal): Promise<Animal> {
    const result = await db.insert(schema.animals).values(animal).returning();
    return result[0];
  }

  async updateAnimal(id: string, animal: Partial<InsertAnimal>): Promise<Animal | undefined> {
    const result = await db.update(schema.animals).set(animal).where(eq(schema.animals.id, id)).returning();
    return result[0];
  }

  async deleteAnimal(id: string): Promise<boolean> {
    const result = await db.delete(schema.animals).where(eq(schema.animals.id, id)).returning();
    return result.length > 0;
  }

  async getLabTest(id: string): Promise<LabTest | undefined> {
    const result = await db.select().from(schema.labTests).where(eq(schema.labTests.id, id)).limit(1);
    return result[0];
  }

  async getLabTestsByAnimal(animalId: string): Promise<LabTest[]> {
    return await db.select().from(schema.labTests).where(eq(schema.labTests.animalId, animalId));
  }

  async createLabTest(labTest: InsertLabTest): Promise<LabTest> {
    const result = await db.insert(schema.labTests).values(labTest).returning();
    return result[0];
  }

  async updateLabTest(id: string, labTest: Partial<InsertLabTest>): Promise<LabTest | undefined> {
    const result = await db.update(schema.labTests).set(labTest).where(eq(schema.labTests.id, id)).returning();
    return result[0];
  }

  async deleteLabTest(id: string): Promise<boolean> {
    const result = await db.delete(schema.labTests).where(eq(schema.labTests.id, id)).returning();
    return result.length > 0;
  }

  async getHealthMetric(id: string): Promise<HealthMetric | undefined> {
    const result = await db.select().from(schema.healthMetrics).where(eq(schema.healthMetrics.id, id)).limit(1);
    return result[0];
  }

  async getHealthMetricsByAnimal(animalId: string): Promise<HealthMetric[]> {
    return await db.select().from(schema.healthMetrics).where(eq(schema.healthMetrics.animalId, animalId));
  }

  async getHealthMetricsByLabTest(labTestId: string): Promise<HealthMetric[]> {
    return await db.select().from(schema.healthMetrics).where(eq(schema.healthMetrics.labTestId, labTestId));
  }

  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const result = await db.insert(schema.healthMetrics).values(metric).returning();
    return result[0];
  }

  async updateHealthMetric(id: string, metric: Partial<InsertHealthMetric>): Promise<HealthMetric | undefined> {
    const result = await db.update(schema.healthMetrics).set(metric).where(eq(schema.healthMetrics.id, id)).returning();
    return result[0];
  }

  async deleteHealthMetric(id: string): Promise<boolean> {
    const result = await db.delete(schema.healthMetrics).where(eq(schema.healthMetrics.id, id)).returning();
    return result.length > 0;
  }

  async getChatMessagesByAnimal(animalId: string): Promise<ChatMessage[]> {
    return await db.select().from(schema.chatMessages).where(eq(schema.chatMessages.animalId, animalId));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(schema.chatMessages).values(message).returning();
    return result[0];
  }

  async deleteChatMessage(id: string): Promise<boolean> {
    const result = await db.delete(schema.chatMessages).where(eq(schema.chatMessages.id, id)).returning();
    return result.length > 0;
  }

  async deleteChatMessagesByAnimal(animalId: string): Promise<boolean> {
    const result = await db.delete(schema.chatMessages).where(eq(schema.chatMessages.animalId, animalId)).returning();
    return result.length > 0;
  }

  async createFile(file: InsertFile): Promise<File> {
    const result = await db.insert(schema.files).values(file).returning();
    return result[0];
  }

  async getFile(id: string): Promise<File | undefined> {
    const result = await db.select().from(schema.files).where(eq(schema.files.id, id)).limit(1);
    return result[0];
  }

  async deleteFile(id: string): Promise<boolean> {
    const result = await db.delete(schema.files).where(eq(schema.files.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
