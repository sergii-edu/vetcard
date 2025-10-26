import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOwnerSchema, insertVetSchema, insertAnimalSchema, insertVeterinaryRecordSchema, insertVaccinationSchema, insertHealthMetricSchema, insertClinicSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  userType: z.enum(["owner", "vet"]),
});
import bcrypt from "bcryptjs";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

async function initializeDefaultUsers() {
  const adminEmail = "admin@admin.com";
  const adminPassword = "admin";
  
  const existingAdmin = await storage.getOwnerByEmail(adminEmail);
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await storage.createOwner({
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      phone: "+380000000000",
      city: "Київ",
      postalCode: "01001",
      addressLine1: "Default Address",
    });
    console.log("✅ Default admin user ready: admin@admin.com / admin");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  await initializeDefaultUsers();
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { userType, ...data } = req.body;
      
      if (userType === "owner") {
        const ownerData = insertOwnerSchema.parse(data);
        const existingOwner = await storage.getOwnerByEmail(ownerData.email);
        if (existingOwner) {
          return res.status(400).json({ error: "Email already registered" });
        }
        const hashedPassword = await bcrypt.hash(ownerData.password, 10);
        const owner = await storage.createOwner({
          ...ownerData,
          password: hashedPassword,
        });
        return res.json({
          id: owner.id,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
          userType: "owner",
        });
      } else if (userType === "vet") {
        const vetData = insertVetSchema.parse(data);
        const existingVet = await storage.getVetByEmail(vetData.email);
        if (existingVet) {
          return res.status(400).json({ error: "Email already registered" });
        }
        const hashedPassword = await bcrypt.hash(vetData.password, 10);
        const vet = await storage.createVet({
          ...vetData,
          password: hashedPassword,
        });
        return res.json({
          id: vet.id,
          email: vet.email,
          firstName: vet.firstName,
          lastName: vet.lastName,
          userType: "vet",
        });
      } else {
        return res.status(400).json({ error: "Invalid userType" });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/register/owner", async (req, res) => {
    try {
      const data = insertOwnerSchema.parse(req.body);
      
      // Check if email exists
      const existing = await storage.getOwnerByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const owner = await storage.createOwner({
        ...data,
        password: hashedPassword,
      });

      res.json({ 
        id: owner.id, 
        email: owner.email, 
        firstName: owner.firstName,
        lastName: owner.lastName,
        userType: "owner" 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/register/vet", async (req, res) => {
    try {
      const data = insertVetSchema.parse(req.body);
      
      const existing = await storage.getVetByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const vet = await storage.createVet({
        ...data,
        password: hashedPassword,
      });

      res.json({ 
        id: vet.id, 
        email: vet.email, 
        firstName: vet.firstName,
        lastName: vet.lastName,
        userType: "vet" 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, userType } = loginSchema.parse(req.body);

      let user: any;
      if (userType === "owner") {
        user = await storage.getOwnerByEmail(email);
      } else if (userType === "vet") {
        user = await storage.getVetByEmail(email);
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Animal routes
  app.get("/api/animals/owner/:ownerId", async (req, res) => {
    try {
      const animals = await storage.getAnimalsByOwner(req.params.ownerId);
      res.json(animals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/animals/:id", async (req, res) => {
    try {
      const animal = await storage.getAnimal(req.params.id);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }
      res.json(animal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/animals", async (req, res) => {
    try {
      const data = insertAnimalSchema.parse(req.body);
      const animal = await storage.createAnimal(data);
      res.json(animal);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/animals/:id", async (req, res) => {
    try {
      const data = insertAnimalSchema.partial().parse(req.body);
      const animal = await storage.updateAnimal(req.params.id, data);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }
      res.json(animal);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/animals/:id", async (req, res) => {
    try {
      const success = await storage.deleteAnimal(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Animal not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vets routes
  app.get("/api/vets", async (req, res) => {
    try {
      const vets = await storage.getAllVets();
      res.json(vets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/vets/clinic/:clinicId", async (req, res) => {
    try {
      const vets = await storage.getVetsByClinic(req.params.clinicId);
      res.json(vets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Veterinary Records routes
  app.get("/api/records/animal/:animalId", async (req, res) => {
    try {
      const records = await storage.getVeterinaryRecordsByAnimal(req.params.animalId);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/records/:id", async (req, res) => {
    try {
      const record = await storage.getVeterinaryRecord(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/records", async (req, res) => {
    try {
      const data = insertVeterinaryRecordSchema.parse(req.body);
      const record = await storage.createVeterinaryRecord(data);
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/records/:id", async (req, res) => {
    try {
      const data = insertVeterinaryRecordSchema.partial().parse(req.body);
      const record = await storage.updateVeterinaryRecord(req.params.id, data);
      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/records/:id", async (req, res) => {
    try {
      const success = await storage.deleteVeterinaryRecord(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vaccination routes
  app.get("/api/vaccinations/animal/:animalId", async (req, res) => {
    try {
      const vaccinations = await storage.getVaccinationsByAnimal(req.params.animalId);
      res.json(vaccinations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/vaccinations", async (req, res) => {
    try {
      const data = insertVaccinationSchema.parse(req.body);
      const vaccination = await storage.createVaccination(data);
      res.json(vaccination);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/vaccinations/:id", async (req, res) => {
    try {
      const data = insertVaccinationSchema.partial().parse(req.body);
      const vaccination = await storage.updateVaccination(req.params.id, data);
      if (!vaccination) {
        return res.status(404).json({ error: "Vaccination not found" });
      }
      res.json(vaccination);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/vaccinations/:id", async (req, res) => {
    try {
      const success = await storage.deleteVaccination(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Vaccination not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health Metrics routes
  app.get("/api/health-metrics/animal/:animalId", async (req, res) => {
    try {
      const metrics = await storage.getHealthMetricsByAnimal(req.params.animalId);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/health-metrics", async (req, res) => {
    try {
      const data = insertHealthMetricSchema.parse(req.body);
      const metric = await storage.createHealthMetric(data);
      res.json(metric);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/health-metrics/:id", async (req, res) => {
    try {
      const data = insertHealthMetricSchema.partial().parse(req.body);
      const metric = await storage.updateHealthMetric(req.params.id, data);
      if (!metric) {
        return res.status(404).json({ error: "Health metric not found" });
      }
      res.json(metric);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/health-metrics/:id", async (req, res) => {
    try {
      const success = await storage.deleteHealthMetric(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Health metric not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // OCR route with OpenAI Vision API for medical document analysis
  app.post("/api/ocr/analyze", async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ 
          error: "OCR service not configured. Please add OPENAI_API_KEY to enable document scanning." 
        });
      }

      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Validate MIME type (OpenAI Vision API only supports images)
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const validMimeType = mimeType && allowedMimeTypes.includes(mimeType.toLowerCase()) 
        ? mimeType 
        : 'image/jpeg';

      if (mimeType && !allowedMimeTypes.includes(mimeType.toLowerCase())) {
        return res.status(400).json({ 
          error: `Непідтримуваний тип файлу. Підтримуються лише зображення: JPEG, PNG, WebP` 
        });
      }

      const dataUrl = `data:${validMimeType};base64,${imageBase64}`;

      const prompt = `Проаналізуй це ветеринарне медичне дослідження (аналіз крові, біохімія, тощо).
Витягни всі медичні показники у форматі JSON масиву з такою структурою:
[
  {
    "name": "назва показника українською",
    "value": "числове значення",
    "unit": "одиниця виміру",
    "referenceRange": "норма (мін-макс)"
  }
]

Приклади показників: Гемоглобін, Еритроцити, Лейкоцити, Глюкоза, Білірубін, АЛТ, АСТ, Креатинін, Сечовина, тощо.
Якщо референсна норма не вказана, залиш поле порожнім.
Поверни ТІЛЬКИ валідний JSON масив, без додаткового тексту.`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: dataUrl
                } 
              },
            ],
          },
        ],
        max_completion_tokens: 2048,
      });

      const extractedText = response.choices[0].message.content;
      
      let extractedData;
      try {
        // Remove markdown code blocks if present
        const cleanText = extractedText?.replace(/```json\n?|\n?```/g, '').trim() || "[]";
        extractedData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        return res.status(500).json({ 
          error: "Failed to parse OCR results", 
          rawResponse: extractedText 
        });
      }

      res.json({ 
        success: true, 
        metrics: extractedData
      });
    } catch (error: any) {
      console.error("OCR Error:", error);
      res.status(500).json({ error: error.message || "OCR processing failed" });
    }
  });

  // Profile routes
  app.get("/api/profile/owner/:id", async (req, res) => {
    try {
      const owner = await storage.getOwner(req.params.id);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }
      const { password, ...ownerData } = owner;
      res.json(ownerData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/profile/owner/:id", async (req, res) => {
    try {
      const data = insertOwnerSchema.partial().parse(req.body);
      
      // Hash password if it's being updated
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }
      
      const owner = await storage.updateOwner(req.params.id, data);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }
      const { password, ...ownerData } = owner;
      res.json(ownerData);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/profile/vet/:id", async (req, res) => {
    try {
      const vet = await storage.getVet(req.params.id);
      if (!vet) {
        return res.status(404).json({ error: "Vet not found" });
      }
      const { password, ...vetData } = vet;
      res.json(vetData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/profile/vet/:id", async (req, res) => {
    try {
      const data = insertVetSchema.partial().parse(req.body);
      
      // Hash password if it's being updated
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }
      
      const vet = await storage.updateVet(req.params.id, data);
      if (!vet) {
        return res.status(404).json({ error: "Vet not found" });
      }
      const { password, ...vetData } = vet;
      res.json(vetData);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Clinics routes
  app.get("/api/clinics", async (req, res) => {
    try {
      const clinics = await storage.getAllClinics();
      res.json(clinics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinics", async (req, res) => {
    try {
      const data = insertClinicSchema.parse(req.body);
      const clinic = await storage.createClinic(data);
      res.status(201).json(clinic);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/clinics/:id", async (req, res) => {
    try {
      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }
      res.json(clinic);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
