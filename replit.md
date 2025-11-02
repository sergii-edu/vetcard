# VetCard - Veterinary Smart Medical Card Application

## Overview

VetCard is a professional veterinary medical records management system designed for pet owners and veterinary clinics. The application enables digital health tracking, OCR-powered document scanning, vaccination management, and health monitoring with intelligent alerts. Built with a focus on medical data clarity and professional utility, it serves as a comprehensive digital health passport for animals.

**Core Purpose:** Digitize and centralize veterinary medical records, enabling pet owners to track their animals' health metrics, vaccination schedules, and medical history while providing veterinarians with structured data access.

**Target Users:** 
- Pet owners managing health records for their animals
- Veterinary professionals accessing and updating medical data
- Veterinary clinics coordinating patient care

**Current Status (November 2, 2025 - OCR Data Model Enhanced):**
- ✅ Complete backend API with authentication, CRUD operations, and data validation
- ✅ **Session Authentication:** PostgreSQL-backed session store (connect-pg-simple), secure cookies, production-ready
- ✅ **PostgreSQL database:** Persistent storage via Neon serverless, data survives server restarts
- ✅ Frontend connected to backend with working authentication flow
- ✅ Owner registration, login (with redirect to dashboard), and animal management fully functional
- ✅ **Default admin user:** admin@admin.com / admin (auto-created on server start)
- ✅ Dashboard displays real-time animal data with AI-focused stat cards
- ✅ PetsList page: displays owner's animals with age calculation, search functionality, clickable cards navigate to detail view
- ✅ PetDetail page: comprehensive animal profile with avatar, identification, latest weight, health metrics display
- ✅ HealthMetrics page: grouped metrics by name, latest value display, reference range validation with "out of range" badge
- ✅ Security: bcrypt password hashing, Zod validation, React Query caching
- ✅ **EDIT FUNCTIONALITY (ENHANCED!):**
  - Lab test editing with Dialog form (testDate, clinicName as Input with datalist autocomplete, testType, notes)
  - Health metric editing with Dialog form (value, referenceMin, referenceMax, notes)
  - Automatic vector store synchronization on edits
  - Two-path logic: lab-linked metrics update entire lab_test, standalone metrics update individually
  - Added vectorStoreFileId to health_metrics schema for standalone metrics
  - React Query cache invalidation for instant UI updates
  - Success/error toast notifications
  - **NEW:** Lab test detail displays readonly createdAt/updatedAt timestamps
- ✅ **Grouped Lab Tests Architecture (ENHANCED!):**
  - `lab_tests` table with audit timestamps (createdAt, updatedAt)
  - testType as free text field (allows custom test types, not limited to enum)
  - One lab_test can contain multiple health_metrics linked via `labTestId`
  - Vector Store: ONE file per lab_test (instead of one per metric) for better AI context
  - LabTests page: lists all analyses with date, type, clinic, metric count
  - LabTestDetail page: displays full analysis with createdAt/updatedAt readonly timestamps
  - Enhanced OCR: automatically creates lab_test + grouped metrics + single vector file
- ✅ **OCR Scan page: FULLY ENHANCED!**
  - Owner-only access
  - **File type support: JPEG, PNG, WebP, PDF** (PDF support added!)
  - **PDF processing:** Uses pdf-parse to extract text, then GPT-4o Mini for analysis
  - **Image processing:** Uses OpenAI Vision API with GPT-4o Mini for faster recognition (5-10 seconds)
  - **Smart data extraction:**
    - **Automatic translation to Ukrainian** (translates metric names from any language)
    - Clinic name from document
    - Test date from document (editable)
    - Test type as free-form text (no autocomplete - fully flexible)
    - Metric values (numeric)
    - Reference ranges parsed into referenceMin/referenceMax (two numeric fields)
    - Leaves fields empty (null) if not recognized
  - **Re-scan workflow (НОВИНКА!):**
    - File stored in memory after upload (base64, name, size, mimeType)
    - Card shows uploaded filename and size
    - "Розпізнати знову" button - re-analyzes same file without re-upload
    - "Завантажити інший документ" button - clears everything for new upload
    - **User metadata preserved:** Animal, date, clinic, type NOT overwritten on re-scan
    - **Memory management:** AbortController for cleanup, isMountedRef guards, automatic cleanup on save/unmount
  - **Manual editing controls:**
    - "+ Додати показник" button - add new metrics manually
    - X button on each metric row - remove unwanted metrics
    - Manual re-scan without re-upload for quick corrections
  - Step 1: Upload & analyze document → auto-fills detected data (translated to Ukrainian)
  - Step 2: Review & edit metrics in grid (6-column layout: name, value, unit, min, max)
  - Step 3: (Optional) Re-scan document for better recognition OR upload different document
  - Step 4: Add/remove metrics as needed using manual controls
  - Step 5: Fill/verify test info (animal, date, clinic, type) - auto-filled on first scan only
  - Step 6: Save → creates lab_test + metrics + vector upload, clears memory
  - Redirects to /lab-tests list after save
  - Complete error handling, memory cleanup, and user feedback
- ✅ **Vector Store Integration (RAG Architecture - ENHANCED):**
  - VectorStoreService for OpenAI Vector Store API management
  - Automatic vector store creation for each animal
  - **New:** Uploads entire lab_test (with all metrics) as single file for better context
  - Formatted analysis data includes test date, clinic, metrics with reference ranges, summary
  - Legacy: Individual metric upload still supported for standalone metrics
- ✅ **AI Chat API (RAG-based):**
  - ChatService using OpenAI Assistants API with file_search tool
  - Thread persistence in memory for conversational context
  - RAG-powered answers based on animal's grouped lab tests and health metrics
  - Persistent chat history in database with atomic message storage
  - Rollback logic prevents orphaned messages on errors
  - Graceful fallback when OpenAI not configured
  - POST /api/chat/:animalId - send message and get AI response
  - GET /api/chat/:animalId - retrieve chat history
  - DELETE /api/chat/:animalId - clear chat history
- ✅ **AI Chat UI frontend:**
  - AIChat page with animal selector
  - Deep-linking support (/ai-chat/:animalId)
  - Message history display with user/assistant differentiation
  - Message input with Enter/Shift+Enter handling
  - Loading states during AI response generation
  - Auto-scroll to latest messages
  - Complete data-testid attributes for E2E testing
- ✅ **Settings page:**
  - Data management section with warning dialogs
  - **Clear data for specific animal** (lab_tests, metrics, vector store) - animal stays in system
  - **Delete animal completely (NEW!)** - removes animal + ALL data (lab tests, metrics, chat, vector store)
  - **Clear ALL data** - deletes all animals, lab_tests, metrics, vector stores, chat history
  - Confirmation dialogs with detailed warnings
  - Complete backend cleanup via:
    - DELETE /api/animals/:id/data (clear data only)
    - DELETE /api/animals/:id (delete animal + all data) - **NEW!**
    - DELETE /api/data/clear-all (nuclear option)
- ✅ **Navigation:** Sidebar with AI Асистент, Лабораторні аналізи, Налаштування links
- ✅ Vet-related functionality completely removed:
  - Deleted tables: vets, clinics, vaccinations, veterinary_records
  - Removed all vet UI components and pages
  - Dashboard stat cards updated (no "Вакцинації" or "Візити")
  - All backend routes and storage methods cleaned up

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript, using Vite as the build tool

**Routing:** Wouter (lightweight client-side routing)

**State Management:**
- React Query (TanStack Query) for server state management and caching
- React Context API for authentication state
- Local component state for UI interactions

**UI Component System:**
- shadcn/ui components (Radix UI primitives with custom styling)
- Material Design 3 principles for medical data presentation
- Tailwind CSS for styling with custom design tokens
- Theme system supporting light/dark modes

**Key Design Decisions:**
- **Problem:** Medical applications require high data density with excellent readability
- **Solution:** Material Design 3 system with structured typography hierarchy (Inter for UI, Roboto Mono for metrics)
- **Rationale:** Provides professional trust signals and clear visual hierarchy for clinical data

### Backend Architecture

**Runtime:** Node.js with Express.js server

**API Pattern:** RESTful API with JSON payloads

**Authentication Strategy:**
- **Session-based authentication** with PostgreSQL session store (connect-pg-simple)
  - Automatic session table creation
  - 30-day session expiry
  - httpOnly, sameSite: lax cookies
  - Secure cookies in production (HTTPS)
  - Trust proxy configuration for production deployments
  - Required SESSION_SECRET environment variable (fails fast if missing)
- bcrypt for password hashing (10 rounds)
- User type: owners only (vet functionality removed)
- Session persistence across requests with ownership validation

**Server Structure:**
- `/server/index.ts` - Express app initialization and middleware
- `/server/routes.ts` - API endpoint definitions
- `/server/storage.ts` - Data access layer interface

**Key Design Decisions:**
- **Problem:** Need to support two distinct user roles with different permissions
- **Solution:** Separate registration/login flows for owners and vets, with user type stored in session
- **Rationale:** Enables future role-based features while maintaining simple authentication

### Data Architecture

**ORM:** Drizzle ORM with PostgreSQL dialect

**Database:** PostgreSQL (via Neon serverless)
  - DbStorage implementation using Drizzle ORM
  - All data persists across server restarts
  - Database schema managed via `npm run db:push`

**Schema Design:**
```
owners (pet owners)
  ↓ owns
animals (pets)
  ↓ has
- veterinary_records (consultations, surgeries, checkups)
  - vetId: OPTIONAL (nullable) - allows records without registered vet
  - clinicName: OPTIONAL - text field for custom clinic names
- vaccinations (immunization history)
  - vetId: OPTIONAL (nullable)
  - clinicName: OPTIONAL
- health_metrics (weight, blood work, vitals)
- files (attachments)

vets (veterinarians)
  ↓ works at
clinics (veterinary clinics)
```

**Key Entities:**
- **Animals:** Central entity with species, breed, microchip, passport, and owner reference
- **Health Metrics:** Flexible metric storage (name, value, unit, reference range, date)
- **Veterinary Records:** Typed records (Consultation, Vaccination, Surgery, etc.) with attachments
- **Vaccinations:** Separate tracking for immunizations with due dates

**Key Design Decisions:**
- **Problem:** Need flexible health metric storage for diverse medical measurements
- **Solution:** Generic health_metrics table with name/value/unit/reference_range columns
- **Rationale:** Supports any metric type without schema changes, enables OCR data storage
- **Trade-off:** Less type safety vs. schema flexibility for medical data

### External Dependencies

**OCR Integration:**
- **Image OCR:** OpenAI Vision API (gpt-4o-mini model) - requires OPENAI_API_KEY
- **PDF OCR:** pdf-parse library for text extraction + GPT-4o Mini for analysis
- **Performance:** 5-10 seconds per document (previously 50+ seconds with GPT-5)
- Purpose: Extract medical data from scanned documents and lab reports
- **Supported formats:** JPEG, PNG, WebP, PDF (NEW: PDF support added November 2025)
- Integration point: `/api/ocr/analyze` endpoint
- Data flow: 
  - **Images:** base64 → OpenAI Vision API → structured JSON
  - **PDFs:** base64 → pdf-parse text extraction → GPT-4o Mini analysis → structured JSON
- Editable UI grid → user verification → batch save to health_metrics
- 10MB request size limit for large files
- Model choice: GPT-4o Mini optimized for speed while maintaining accuracy for medical document recognition

**UI Component Libraries:**
- Radix UI primitives (@radix-ui/*) - Accessible, unstyled component primitives
- Lucide React - Icon system
- Recharts - Data visualization for health metric charts
- date-fns - Date formatting and manipulation

**Development Tools:**
- Vite - Frontend build tool with HMR
- Replit-specific plugins for development experience
- TypeScript for type safety across full stack

**Database:**
- Neon Serverless PostgreSQL via @neondatabase/serverless
- Connection pooling and serverless-optimized queries

**Key Design Decisions:**
- **Problem:** Medical documents contain structured data that needs manual entry
- **Solution:** OCR-powered document scanning with AI extraction and manual verification step
- **Rationale:** Reduces data entry time while maintaining accuracy through human verification
- **Implementation:** OpenAI API processes images, extracts metrics, presents for user confirmation before save