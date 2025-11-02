import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertOwnerSchema,
  insertAnimalSchema,
  insertHealthMetricSchema,
  insertChatMessageSchema,
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  userType: z.literal("owner"),
});
import bcrypt from "bcryptjs";
import OpenAI from "openai";
import { VectorStoreService } from "./vectorStoreService";
import { ChatService } from "./chatService";
import { PDFParse } from "pdf-parse";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const vectorStoreService = openai ? new VectorStoreService(openai) : null;
const chatService = openai ? new ChatService(openai) : null;

async function initializeDefaultUsers() {
  const adminEmail = "admin@admin.com";
  const adminPassword = "admin";

  console.log("[INIT] Checking for admin user...");
  const existingAdmin = await storage.getOwnerByEmail(adminEmail);
  console.log(
    "[INIT] Existing admin:",
    existingAdmin ? `Found (ID: ${existingAdmin.id})` : "Not found",
  );

  if (!existingAdmin) {
    console.log("[INIT] Creating admin user...");
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await storage.createOwner({
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      phone: "+380000000000",
      city: "Київ",
      postalCode: "01001",
      addressLine1: "Default Address",
    });
    console.log(
      `✅ Default admin user created: admin@admin.com / admin (ID: ${admin.id})`,
    );
  } else {
    console.log(
      `✅ Default admin user ready: admin@admin.com / admin (ID: ${existingAdmin.id})`,
    );
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy BEFORE session middleware (important for cookies)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Setup PostgreSQL session store
  const PgStore = connectPgSimple(session);

  // Fail fast if SESSION_SECRET is not set
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET environment variable must be set for secure session management",
    );
  }

  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    }),
  );

  await initializeDefaultUsers();

  // Authentication routes
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
        userType: "owner",
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, userType } = loginSchema.parse(req.body);

      // Only owners can login now
      const user = await storage.getOwnerByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.userType = "owner";

      // Save session to ensure it persists
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }

        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: "owner",
        });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Animal routes
  // Get animals for current user (from session)
  app.get("/api/animals", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const animals = await storage.getAnimalsByOwner(req.session.userId);
      res.json(animals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/animals/owner/:ownerId", async (req, res) => {
    try {
      console.log("[DEBUG] Getting animals for owner:", req.params.ownerId);
      const animals = await storage.getAnimalsByOwner(req.params.ownerId);
      console.log("[DEBUG] Found", animals.length, "animals");
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
      console.log("[DEBUG] Creating animal with ownerId:", data.ownerId);

      let vectorStoreId: string | undefined;
      if (vectorStoreService) {
        try {
          vectorStoreId = await vectorStoreService.createVectorStore(
            data.ownerId,
            data.name,
          );
        } catch (error) {
          console.error("Failed to create vector store:", error);
        }
      }

      const animal = await storage.createAnimal({
        ...data,
        vectorStoreId: vectorStoreId || undefined,
      });
      console.log(
        "[DEBUG] Created animal:",
        animal.id,
        "for owner:",
        animal.ownerId,
      );
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
      // Security: Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const animal = await storage.getAnimal(req.params.id);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      // Security: Verify ownership
      if (animal.ownerId !== req.session.userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this animal" });
      }

      // Delete vector store if exists
      if (vectorStoreService && animal.vectorStoreId) {
        try {
          await vectorStoreService.deleteVectorStore(animal.vectorStoreId);
          console.log(
            `[VECTOR] ✓ Deleted vector store ${animal.vectorStoreId} for animal ${animal.id}`,
          );
        } catch (error) {
          console.error(
            `[VECTOR] Failed to delete vector store for animal ${animal.id}:`,
            error,
          );
        }
      }

      // Delete chat messages for this animal
      const chatMessages = await storage.getChatMessagesByAnimal(req.params.id);
      for (const message of chatMessages) {
        await storage.deleteChatMessage(message.id);
      }

      // Delete the animal (cascade will delete lab_tests and health_metrics)
      const success = await storage.deleteAnimal(req.params.id);
      if (!success) {
        return res.status(500).json({ error: "Failed to delete animal" });
      }

      console.log(
        `[DELETE] ✓ Deleted animal ${animal.name} (${animal.id}) with all related data`,
      );
      res.json({ success: true, message: "Animal deleted successfully" });
    } catch (error: any) {
      console.error("Delete animal error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Health Metrics routes
  app.get("/api/health-metrics/animal/:animalId", async (req, res) => {
    try {
      const metrics = await storage.getHealthMetricsByAnimal(
        req.params.animalId,
      );
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/health-metrics", async (req, res) => {
    try {
      const data = insertHealthMetricSchema.parse(req.body);

      const animal = await storage.getAnimal(data.animalId);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      const metric = await storage.createHealthMetric(data);
      res.json(metric);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/health-metrics/:id", async (req, res) => {
    try {
      const data = insertHealthMetricSchema.partial().parse(req.body);

      const existingMetric = await storage.getHealthMetric(req.params.id);
      if (!existingMetric) {
        return res.status(404).json({ error: "Health metric not found" });
      }

      // Update metric in database
      const updatedMetric = await storage.updateHealthMetric(
        req.params.id,
        data,
      );

      // Update vector store if OpenAI is configured
      if (vectorStoreService && updatedMetric) {
        try {
          const animal = await storage.getAnimal(existingMetric.animalId);
          if (animal?.vectorStoreId) {
            // If metric belongs to a lab test, update the entire lab test in vector store
            if (existingMetric.labTestId) {
              const labTest = await storage.getLabTest(
                existingMetric.labTestId,
              );
              if (labTest && labTest.vectorStoreFileId) {
                const allMetrics = await storage.getHealthMetricsByLabTest(
                  existingMetric.labTestId,
                );

                const newFileId =
                  await vectorStoreService.updateLabTestInVectorStore(
                    animal.vectorStoreId,
                    labTest.vectorStoreFileId,
                    labTest,
                    allMetrics,
                  );

                await storage.updateLabTest(existingMetric.labTestId, {
                  vectorStoreFileId: newFileId,
                });
                console.log(
                  `[VECTOR] ✓ Updated lab test ${existingMetric.labTestId} in vector store after metric edit`,
                );
              }
            }
            // Otherwise, update standalone metric in vector store
            else if (existingMetric.vectorStoreFileId) {
              const newFileId =
                await vectorStoreService.updateMetricInVectorStore(
                  animal.vectorStoreId,
                  existingMetric.vectorStoreFileId,
                  {
                    metricName: existingMetric.metricName,
                    value: updatedMetric.value,
                    unit: existingMetric.unit,
                    recordDate: existingMetric.recordDate,
                    referenceMin: updatedMetric.referenceMin ?? undefined,
                    referenceMax: updatedMetric.referenceMax ?? undefined,
                    notes: updatedMetric.notes ?? undefined,
                  },
                );

              await storage.updateHealthMetric(req.params.id, {
                vectorStoreFileId: newFileId,
              });
              console.log(
                `[VECTOR] ✓ Updated metric ${req.params.id} in vector store`,
              );
            }
          }
        } catch (error: any) {
          console.error(
            "[VECTOR] Failed to update metric in vector store:",
            error,
          );
          // Don't fail the whole request if vector update fails
        }
      }

      res.json(updatedMetric);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/health-metrics/:id", async (req, res) => {
    try {
      const metric = await storage.getHealthMetric(req.params.id);
      if (!metric) {
        return res.status(404).json({ error: "Health metric not found" });
      }

      const success = await storage.deleteHealthMetric(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lab Tests routes
  app.get("/api/lab-tests/animal/:animalId", async (req, res) => {
    try {
      const labTests = await storage.getLabTestsByAnimal(req.params.animalId);
      res.json(labTests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lab-tests/:id", async (req, res) => {
    try {
      const labTest = await storage.getLabTest(req.params.id);
      if (!labTest) {
        return res.status(404).json({ error: "Lab test not found" });
      }
      res.json(labTest);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lab-tests", async (req, res) => {
    try {
      const { insertLabTestSchema } = await import("@shared/schema");
      const { metrics, ...labTestData } = req.body;
      const data = insertLabTestSchema.parse(labTestData);

      const animal = await storage.getAnimal(data.animalId);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      // If metrics provided, create lab_test with metrics and upload to vector store
      if (
        metrics &&
        Array.isArray(metrics) &&
        metrics.length > 0 &&
        vectorStoreService
      ) {
        // Ensure animal has vector store
        if (!animal.vectorStoreId) {
          const vectorStoreId = await vectorStoreService.createVectorStore(
            animal.id,
            animal.name,
          );
          await storage.updateAnimal(animal.id, { vectorStoreId });
          animal.vectorStoreId = vectorStoreId;
        }

        // 1. Create lab test
        const labTest = await storage.createLabTest(data);

        // 2. Create metrics with referenceMin/referenceMax from OCR or manual entry
        const createdMetrics = await Promise.all(
          metrics.map(async (item: any) => {
            return await storage.createHealthMetric({
              animalId: data.animalId,
              labTestId: labTest.id,
              metricName: item.name,
              value:
                typeof item.value === "number"
                  ? item.value
                  : parseFloat(item.value),
              unit: item.unit || "",
              referenceMin:
                item.referenceMin !== null && item.referenceMin !== undefined
                  ? parseFloat(item.referenceMin)
                  : null,
              referenceMax:
                item.referenceMax !== null && item.referenceMax !== undefined
                  ? parseFloat(item.referenceMax)
                  : null,
              recordDate: data.testDate,
            });
          }),
        );

        // 3. Upload entire analysis to vector store as ONE file
        const vectorFileId =
          await vectorStoreService.uploadLabTestToVectorStore(
            animal.vectorStoreId,
            labTest,
            createdMetrics,
          );

        // 4. Update lab test with vector store file ID
        await storage.updateLabTest(labTest.id, {
          vectorStoreFileId: vectorFileId,
        });

        return res.json({
          ...labTest,
          vectorStoreFileId: vectorFileId,
          metrics: createdMetrics,
        });
      }

      // Otherwise, create lab_test without metrics (basic mode)
      const labTest = await storage.createLabTest(data);
      res.json(labTest);
    } catch (error: any) {
      console.error("Lab test creation error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/lab-tests/:id", async (req, res) => {
    try {
      const { insertLabTestSchema } = await import("@shared/schema");
      const data = insertLabTestSchema.partial().parse(req.body);

      const existingLabTest = await storage.getLabTest(req.params.id);
      if (!existingLabTest) {
        return res.status(404).json({ error: "Lab test not found" });
      }

      // Update lab test in database
      const updatedLabTest = await storage.updateLabTest(req.params.id, data);

      // Update vector store if OpenAI is configured and lab test has vector store file
      if (vectorStoreService && existingLabTest.vectorStoreFileId) {
        try {
          const animal = await storage.getAnimal(existingLabTest.animalId);
          if (animal?.vectorStoreId) {
            // Get all metrics for this lab test
            const metrics = await storage.getHealthMetricsByLabTest(
              existingLabTest.id,
            );

            // Update in vector store (delete old, upload new)
            const newFileId =
              await vectorStoreService.updateLabTestInVectorStore(
                animal.vectorStoreId,
                existingLabTest.vectorStoreFileId,
                updatedLabTest!,
                metrics,
              );

            // Update file ID in database
            await storage.updateLabTest(req.params.id, {
              vectorStoreFileId: newFileId,
            });

            console.log(
              `[VECTOR] ✓ Updated lab test ${req.params.id} in vector store`,
            );
          }
        } catch (error: any) {
          console.error(
            "[VECTOR] Failed to update lab test in vector store:",
            error,
          );
          // Don't fail the whole request if vector update fails
        }
      }

      res.json(updatedLabTest);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/lab-tests/:id", async (req, res) => {
    try {
      const labTest = await storage.getLabTest(req.params.id);
      if (!labTest) {
        return res.status(404).json({ error: "Lab test not found" });
      }

      // Delete from vector store if exists
      if (vectorStoreService && labTest.vectorStoreFileId) {
        const animal = await storage.getAnimal(labTest.animalId);
        if (animal?.vectorStoreId) {
          try {
            await vectorStoreService.deleteMetricFromVectorStore(
              animal.vectorStoreId,
              labTest.vectorStoreFileId,
            );
          } catch (error) {
            console.error(
              "Failed to delete lab test from vector store:",
              error,
            );
          }
        }
      }

      const success = await storage.deleteLabTest(req.params.id);
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
          error:
            "OCR service not configured. Please add OPENAI_API_KEY to enable document scanning.",
        });
      }

      const {
        imageBase64,
        mimeType,
        animalId,
        testDate,
        clinicName,
        testType,
      } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Validate MIME type - support both images and PDFs
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      const allowedPdfTypes = ["application/pdf"];
      const allAllowedTypes = [...allowedImageTypes, ...allowedPdfTypes];

      const normalizedMimeType = mimeType?.toLowerCase() || "image/jpeg";

      if (!allAllowedTypes.includes(normalizedMimeType)) {
        return res.status(400).json({
          error: `Непідтримуваний тип файлу. Підтримуються: JPEG, PNG, WebP, PDF`,
        });
      }

      const prompt = `Проаналізуй це ветеринарне медичне дослідження (аналіз крові, біохімія, рентген, УЗД, тощо).
Витягни інформацію про аналіз та всі медичні показники у форматі JSON з такою структурою:
{
  "clinicName": "назва клініки або лабораторії (якщо вказана, інакше null)",
  "testType": "тип аналізу українською (Аналіз крові/Аналіз сечі/Рентген/УЗД/Біохімія/ЕКГ або інший тип, якщо вказано, інакше null)",
  "testDate": "дата проведення аналізу у форматі YYYY-MM-DD (якщо вказана, інакше null)",
  "metrics": [
    {
      "name": "назва показника українською",
      "value": числове значення або null,
      "unit": "одиниця виміру",
      "referenceMin": мінімальна норма (число або null),
      "referenceMax": максимальна норма (число або null)
    }
  ]
}

ВАЖЛИВІ ПРАВИЛА:
1. **ПЕРЕКЛАД**: ВСІ назви показників ОБОВ'ЯЗКОВО перекладай УКРАЇНСЬКОЮ, навіть якщо в документі вони англійською, російською чи іншою мовою.
   Приклади: "Hemoglobin" → "Гемоглобін", "WBC" → "Лейкоцити", "Glucose" → "Глюкоза", "Билирубин" → "Білірубін"
2. Референсну норму (наприклад "5-10", "5.0-10.5") ОБОВ'ЯЗКОВО парси в два окремі числа: referenceMin та referenceMax
3. Якщо норма вказана як одне число (наприклад "<10"), використай його як referenceMax, а referenceMin залиш null
4. Якщо норма вказана як ">5", використай його як referenceMin, а referenceMax залиш null
5. value, referenceMin, referenceMax мають бути ЧИСЛАМИ, не текстом
6. Якщо щось не розпізнано - використовуй null, НЕ залишай порожні рядки

Приклади показників українською: Гемоглобін, Еритроцити, Лейкоцити, Глюкоза, Білірубін, АЛТ, АСТ, Креатинін, Сечовина, тощо.

Поверни ТІЛЬКИ валідний JSON об'єкт, без додаткового тексту.`;

      let extractedText: string | null = null;

      // Handle PDF files differently from images
      if (allowedPdfTypes.includes(normalizedMimeType)) {
        // For PDF: Extract text using pdf-parse, then analyze with GPT
        const buffer = Buffer.from(imageBase64, "base64");

        try {
          // Extract text from PDF using pdf-parse v2 API
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          const pdfText = result.text;

          if (!pdfText || pdfText.trim().length === 0) {
            throw new Error("PDF не містить текстового вмісту");
          }

          // Use GPT-4o Mini to analyze extracted text
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: `${prompt}\n\nОсь текст з PDF документа:\n\n${pdfText}`,
              },
            ],
            max_completion_tokens: 2048,
            temperature: 0.7, // Allow some variation in interpretation on re-scans
          });

          extractedText = response.choices[0].message.content;
        } catch (pdfError: any) {
          console.error("PDF parsing error:", pdfError);
          throw new Error(`Помилка обробки PDF: ${pdfError.message}`);
        }
      } else {
        // For images: Use Vision API (current approach)
        const dataUrl = `data:${normalizedMimeType};base64,${imageBase64}`;

        // Using GPT-4o Mini for faster OCR processing (5-10 seconds vs 50+ seconds with GPT-5)
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: dataUrl,
                  },
                },
              ],
            },
          ],
          max_completion_tokens: 2048,
          temperature: 0.7, // Allow some variation in interpretation on re-scans
        });

        extractedText = response.choices[0].message.content;
      }

      let extractedData;
      try {
        // Remove markdown code blocks if present
        const cleanText =
          extractedText?.replace(/```json\n?|\n?```/g, "").trim() ||
          '{"metrics":[]}';
        extractedData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        return res.status(500).json({
          error: "Failed to parse OCR results",
          rawResponse: extractedText,
        });
      }

      // Extract OCR-detected metadata (clinic, type, date) or use defaults
      const ocrClinicName = extractedData.clinicName || null;
      const ocrTestType = extractedData.testType || null;
      const ocrTestDate = extractedData.testDate || null;

      // Extract metrics directly from OCR results
      const ocrMetrics = extractedData.metrics || [];

      // If animalId provided, save as lab_test with metrics
      if (animalId && vectorStoreService) {
        const animal = await storage.getAnimal(animalId);
        if (!animal) {
          return res.status(404).json({ error: "Animal not found" });
        }

        // Ensure animal has vector store
        if (!animal.vectorStoreId) {
          const vectorStoreId = await vectorStoreService.createVectorStore(
            animal.id,
            animal.name,
          );
          await storage.updateAnimal(animal.id, { vectorStoreId });
          animal.vectorStoreId = vectorStoreId;
        }

        // 1. Create lab test with OCR-detected data or request body data
        const labTest = await storage.createLabTest({
          animalId,
          testDate:
            testDate || ocrTestDate || new Date().toISOString().split("T")[0],
          clinicName: clinicName || ocrClinicName,
          testType: testType || ocrTestType,
        });

        // 2. Create metrics using OCR-parsed referenceMin/referenceMax
        const metrics = await Promise.all(
          ocrMetrics.map(async (item: any) => {
            return await storage.createHealthMetric({
              animalId,
              labTestId: labTest.id,
              metricName: item.name,
              value: parseFloat(item.value),
              unit: item.unit || "",
              referenceMin:
                item.referenceMin !== null && item.referenceMin !== undefined
                  ? parseFloat(item.referenceMin)
                  : null,
              referenceMax:
                item.referenceMax !== null && item.referenceMax !== undefined
                  ? parseFloat(item.referenceMax)
                  : null,
              recordDate:
                testDate ||
                ocrTestDate ||
                new Date().toISOString().split("T")[0],
            });
          }),
        );

        // 3. Upload entire analysis to vector store as ONE file
        const vectorFileId =
          await vectorStoreService.uploadLabTestToVectorStore(
            animal.vectorStoreId,
            labTest,
            metrics,
          );

        // 4. Update lab test with vector store file ID
        await storage.updateLabTest(labTest.id, {
          vectorStoreFileId: vectorFileId,
        });

        res.json({
          success: true,
          labTest: { ...labTest, vectorStoreFileId: vectorFileId },
          metrics,
        });
      } else {
        // Return extracted data for frontend (OCRScan page uses this)
        res.json({
          success: true,
          clinicName: ocrClinicName,
          testType: ocrTestType,
          testDate: ocrTestDate,
          metrics: ocrMetrics,
        });
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      res.status(500).json({ error: error.message || "OCR processing failed" });
    }
  });

  // Chat routes (AI Assistant)
  app.get("/api/chat/:animalId", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesByAnimal(
        req.params.animalId,
      );
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat/:animalId", async (req, res) => {
    let userMessageId: string | undefined;

    try {
      if (!chatService) {
        return res.status(503).json({
          error:
            "AI Chat service not configured. Please add OPENAI_API_KEY to enable AI assistant.",
        });
      }

      const { message } = z
        .object({
          message: z.string().min(1),
        })
        .parse(req.body);

      const animal = await storage.getAnimal(req.params.animalId);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      const assistantResponse = await chatService.sendMessage(animal, message);

      const userMessage = await storage.createChatMessage({
        animalId: req.params.animalId,
        role: "user",
        content: message,
      });
      userMessageId = userMessage.id;

      const assistantMessage = await storage.createChatMessage({
        animalId: req.params.animalId,
        role: "assistant",
        content: assistantResponse,
      });

      res.json({
        userMessage: message,
        assistantMessage: assistantMessage.content,
      });
    } catch (error: any) {
      if (userMessageId) {
        await storage.deleteChatMessage(userMessageId);
      }
      console.error("Chat error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to process chat message" });
    }
  });

  app.delete("/api/chat/:animalId", async (req, res) => {
    try {
      const success = await storage.deleteChatMessagesByAnimal(
        req.params.animalId,
      );
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  // Data Management routes (Settings)
  // Clear all data for a specific animal (lab_tests, health_metrics, vector store)
  app.delete("/api/animals/:id/data", async (req, res) => {
    try {
      // Security: Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const animal = await storage.getAnimal(req.params.id);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }

      // Security: Verify ownership
      if (animal.ownerId !== req.session.userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this animal's data" });
      }

      // Delete from vector store if exists
      if (vectorStoreService && animal.vectorStoreId) {
        try {
          await vectorStoreService.deleteVectorStore(animal.vectorStoreId);
        } catch (error) {
          console.error("Failed to delete vector store:", error);
        }
      }

      // Delete all lab tests (cascades to health_metrics via labTestId)
      const labTests = await storage.getLabTestsByAnimal(req.params.id);
      for (const labTest of labTests) {
        await storage.deleteLabTest(labTest.id);
      }

      // Delete any standalone health metrics (where labTestId is null)
      const metrics = await storage.getHealthMetricsByAnimal(req.params.id);
      for (const metric of metrics) {
        if (!metric.labTestId) {
          await storage.deleteHealthMetric(metric.id);
        }
      }

      // Clear vectorStoreId from animal
      await storage.updateAnimal(req.params.id, { vectorStoreId: null });

      res.json({ success: true, message: "Animal data cleared successfully" });
    } catch (error: any) {
      console.error("Clear animal data error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Clear ALL data for current user (all animals, lab_tests, health_metrics, vector stores)
  app.delete("/api/data/clear-all", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const animals = await storage.getAnimalsByOwner(req.session.userId);

      // Delete all data for each animal
      for (const animal of animals) {
        // Delete vector store
        if (vectorStoreService && animal.vectorStoreId) {
          try {
            await vectorStoreService.deleteVectorStore(animal.vectorStoreId);
          } catch (error) {
            console.error(
              `Failed to delete vector store for animal ${animal.id}:`,
              error,
            );
          }
        }

        // Delete all lab tests
        const labTests = await storage.getLabTestsByAnimal(animal.id);
        for (const labTest of labTests) {
          await storage.deleteLabTest(labTest.id);
        }

        // Delete standalone health metrics
        const metrics = await storage.getHealthMetricsByAnimal(animal.id);
        for (const metric of metrics) {
          if (!metric.labTestId) {
            await storage.deleteHealthMetric(metric.id);
          }
        }

        // Delete animal itself
        await storage.deleteAnimal(animal.id);
      }

      res.json({
        success: true,
        message: "All data cleared successfully",
        deletedAnimals: animals.length,
      });
    } catch (error: any) {
      console.error("Clear all data error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
