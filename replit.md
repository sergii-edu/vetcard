# VetCard - Veterinary Smart Medical Card Application

## Overview

VetCard is a professional veterinary medical records management system designed for pet owners and veterinary clinics. The application enables digital health tracking, OCR-powered document scanning, vaccination management, and health monitoring with intelligent alerts. Built with a focus on medical data clarity and professional utility, it serves as a comprehensive digital health passport for animals.

**Core Purpose:** Digitize and centralize veterinary medical records, enabling pet owners to track their animals' health metrics, vaccination schedules, and medical history while providing veterinarians with structured data access.

**Target Users:** 
- Pet owners managing health records for their animals
- Veterinary professionals accessing and updating medical data
- Veterinary clinics coordinating patient care

**Current Status (October 10, 2025):**
- ✅ Complete backend API with authentication, CRUD operations, and data validation
- ✅ Frontend connected to backend with working authentication flow
- ✅ Owner registration, login, and animal management fully functional
- ✅ **Default admin user:** admin@admin.com / admin (auto-created on server start)
- ✅ Dashboard displays real-time animal data from backend
- ✅ VetRecords page: displays records per animal, add record form with optional vet selection and custom clinic names
- ✅ Vaccinations page: displays vaccinations per animal with status (completed/upcoming/overdue), optional vet selection
- ✅ PetsList page: displays owner's animals with age calculation, search functionality, clickable cards navigate to detail view
- ✅ PetDetail page: comprehensive animal profile with avatar, identification, latest weight, stat cards (records/vaccinations/metrics counts), recent activity summaries
- ✅ HealthMetrics page: grouped metrics by name, latest value display, reference range validation with "out of range" badge
- ✅ All pages tested end-to-end with full CRUD operations
- ✅ Flexible clinic workflow: veterinarian selection is optional, supports custom clinic names
- ✅ Security: bcrypt password hashing, Zod validation, React Query caching
- ✅ OCR Scan page: fully functional OpenAI Vision API (gpt-5) integration for medical document scanning
  - Owner-only access with redirect for vets
  - MIME type validation (JPEG, PNG, WebP only - PDF not supported by OpenAI Vision)
  - Base64 encoding with type preservation
  - Animal selector with loading states
  - Editable metrics grid before save
  - Batch save to health_metrics table
  - Complete error handling and user feedback
  - Tested with real veterinary blood test documents (4 metrics extracted successfully)
- ⏳ Vet-specific dashboard and workflows

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
- Session-based authentication (connect-pg-simple for session storage)
- bcrypt for password hashing
- Dual user types: owners and veterinarians
- Role-based access control for medical records

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
- OpenAI Vision API (gpt-5 model) - requires OPENAI_API_KEY
- Purpose: Extract medical data from scanned documents and lab reports
- Supported formats: JPEG, PNG, WebP only (PDF not supported by OpenAI Vision API)
- Integration point: `/api/ocr/analyze` endpoint
- Data flow: Image upload (base64) → OpenAI Vision analysis → structured metric extraction → editable UI grid → user verification → batch save to health_metrics
- 10MB request size limit for large images

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